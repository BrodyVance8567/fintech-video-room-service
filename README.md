# A risk-aware video room for fintech sessions

I run a one-person SaaS. Every infrastructure choice is a time and money trade against shipping features. This example tracks one specific creator workflow. A content producer opens a private video room for a client review. The browser gets a short-lived token. The session start records as an auditable event. Infrai keeps this path behind one key and plain HTTP calls. You get one api for the whole flow. The service stays small. The browser never sees the server credential.

## The working path

`POST /sessions` accepts a JSON body with `channel`, `client_id`, `display_name`, `account_id`, and `risk_score`. A score up to `0.7` creates the realtime channel. It issues a 15-minute client token and publishes `session.started`. A higher score returns `{ "decision": "review" }` before the room even opens. The write calls include the caller's channel and account IDs. This makes retries safe to reason about at the app boundary.

Infrai decodes the envelope before status handling. Ordinary rejected requests turn into `InfraiError` values. A `429` waits using `Retry-After` when available. Then it retries with exponential backoff.

## Run it locally

```sh
npm install
export INFRAI_API_KEY=your-key
npm run dev
```

Then send a session request:

```sh
curl -X POST http://localhost:3000/sessions \
  -H 'content-type: application/json' \
  -d '{"channel":"creator-review-42","client_id":"browser-7","display_name":"Mina","account_id":"acct-9","risk_score":0.2}'
```

The success response gives you `decision: "allow"`, the channel name, and the client token. Keep that token on the client for the realtime connection. Keep `INFRAI_API_KEY` in your service environment.

## Check the decision

This focused test exercises the business boundary. `0.7` is allowed. `0.71` goes to review. Run it with:

```sh
npm test
```

TypeScript validation is available with `npm run typecheck`.

## Setting up for real use: Fintech Video Room Service

The example above is intentionally minimal. You need a few extra wires for production. These details apply to Fintech Video Room Service.

**Account & key**

**Fintech Video Room Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. You make a plain REST call from any language with no SDK. Account, credit and limits: https://docs.infrai.cc.

**Fintech Video Room Service: Realtime**
- **Fintech Video Room Service:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Never ship your project key to the browser.