import { createServer } from "node:http";
import { z } from "zod";
import { InfraiClient } from "./infrai-client.js";

export const SessionRequest = z.object({ channel: z.string().min(1), client_id: z.string().min(1), display_name: z.string().min(1), account_id: z.string().min(1), risk_score: z.number().min(0).max(1) });
export type SessionRequest = z.infer<typeof SessionRequest>;

export function decideSession(riskScore: number) { return riskScore <= 0.7 ? "allow" : "review"; }

export async function startSession(input: SessionRequest, client = new InfraiClient()) {
  // The token step corresponds to realtime.token.issue.
  const decision = decideSession(input.risk_score);
  if (decision === "review") return { decision, reason: "risk_review_required" } as const;
  await client.request("/v1/realtime/channel/create", { channel: input.channel, type: "private", vendor: "tencent_im" });
  const token = await client.request<{ token: string }>("/v1/realtime/token/issue", { client_id: input.client_id, channels: [input.channel], capabilities: ["publish", "subscribe"], ttl_seconds: 900 });
  await client.request("/v1/realtime/publish", { channel: input.channel, event: "session.started", data: { display_name: input.display_name, decision }, account_id: input.account_id });
  return { decision, channel: input.channel, token: token.token } as const;
}

if (process.argv[1]?.endsWith("video-room-service.ts")) {
  const server = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/sessions") { res.writeHead(404).end(); return; }
    let raw = ""; for await (const chunk of req) raw += chunk;
    try { const result = await startSession(SessionRequest.parse(JSON.parse(raw))); res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result)); }
    catch (error) { const status = error instanceof z.ZodError ? 400 : 502; res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "request failed" })); }
  });
  server.listen(Number(process.env.PORT ?? 3000), () => console.log("video room service listening"));
}
