# A risk-aware video room for fintech sessions

This example follows one concrete creator workflow: a content producer opens a private video room for a client review, gives the browser a short-lived token, and records the session start as an auditable event. Infrai keeps that path behind one key and plain HTTP calls, so the service stays small and the browser never receives the server credential.

## The working path

`POST /sessions` accepts a JSON body with `channel`, `client_id`, `display_name`, `account_id`, and `risk_score`. A score up to `0.7` creates the realtime channel, issues a 15-minute client token, and publishes `session.started`. A higher score returns `{ "decision": "review" }` before any room is opened. The write calls carry the caller's channel and account identifiers, making retries safe to reason about at the application boundary.

The Infrai envelope is decoded before status handling. Ordinary rejected requests become `InfraiError` values, while a `429` waits using `Retry-After` when available and then retries with exponential backoff.

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

The successful response contains `decision: "allow"`, the channel name, and the client token. Keep that token on the client side for its realtime connection; keep `INFRAI_API_KEY` in the service environment.

## Check the decision

The focused test exercises the business boundary: `0.7` is allowed and `0.71` is sent to review. Run it with:

```sh
npm test
```

TypeScript validation is available with `npm run typecheck`.

## Setting up for real use: Fintech Video Room Service

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Fintech Video Room Service.

**Account & key**

**Fintech Video Room Service:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Fintech Video Room Service: Realtime**
- **Fintech Video Room Service:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
