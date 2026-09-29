# Channels — Ferrix as swappable edges, one AI engine at the core

Implements STARTUP_VISION §8: every inbound surface normalizes into the same
`InboundMsg` shape, every reply leaves as an `OutboundMsg`, and the AI engine
(`src/lib/ai.ts` → `llmChat` + `INTAKE_SYSTEM_PROMPT`) never learns which
channel it is talking to.

## Architecture (diagram-in-text)

```
CHANNELS                    CHANNEL GATEWAY (src/lib/channels/)
Web chat (LIVE)  ──────────► webAdapter        (pass-through; the web app IS
Voice mic in UI              (src/lib/channels/web.ts)  the web channel via /api/chat)
WhatsApp Cloud API ────────► whatsappAdapter   verifyWebhook() → hub.challenge handshake
(this repo, adapter #2)      (src/lib/channels/whatsapp.ts)
                                        │      parseInbound() → InboundMsg[]
SMS / USSD / IVR (future) ─► (same contract, add src/lib/channels/sms.ts)   │
                                        ▼
              /api/channels/whatsapp  (webhook route = mini-orchestrator)
              1. signature check (X-Hub-Signature-256, HMAC-SHA256) → 401 on mismatch
              2. idempotency by externalId (in-memory Set — see below)
              3. per-sender rate limit (20 msgs/min → skip, still 200 + throttled:true)
              4. find-or-create Candidate by senderPhone (lang heuristic: detectLang)
              5. persist Message rows (same table the web chat uses)
              6. reply = llmChat(INTAKE_SYSTEM_PROMPT + untrustedBlock(history))   ← ONE ENGINE
                 failure → deterministic bilingual ack (demo-can't-die)
                                        ▼
              sendOutbound() → Meta Graph API v21.0 …/{PHONE_NUMBER_ID}/messages
              (demo mode: logged no-op)  + reply echoed in the HTTP JSON for curl tests
```

Adapter contract (`src/lib/channels/types.ts`):

```ts
interface ChannelAdapter {
  readonly name: string;
  verifyWebhook(req: Request): Promise<Response | null>; // null = not a verification request
  parseInbound(req: Request): Promise<InboundMsg[]>;     // [] = nothing to do (statuses-only etc.)
  sendOutbound(msg: OutboundMsg): Promise<void>;         // demo mode: log + no-op, never throw
}
```

## Environment variables

| Variable | Required for | Unset behavior (open-demo mode) |
|---|---|---|
| `WHATSAPP_VERIFY_TOKEN` | Meta webhook subscription handshake (GET) | verification always returns `403` bilingual JSON |
| `WHATSAPP_APP_SECRET` | `X-Hub-Signature-256` verification on POST (HMAC-SHA256 of raw body) | unsigned POSTs are **accepted but flagged** in logs (open-demo mode — never ship to prod like this) |
| `WHATSAPP_ACCESS_TOKEN` | Bearer token for the Graph API send path | `sendOutbound` logs and no-ops |
| `WHATSAPP_PHONE_NUMBER_ID` | Graph API path `v21.0/{PHONE_NUMBER_ID}/messages` | `sendOutbound` logs and no-ops |

None of these are needed to run the hackathon demo. The webhook is always
curl-testable regardless of credentials.

## Demo-mode behavior

- **No verify token** → `GET /api/channels/whatsapp?hub.mode=subscribe&...` → `403 {"error": "Webhook verify token not configured / Token ya uthibitisho haijawekwa", ...}`
- **No app secret** → inbound POSTs accepted unsigned (`[whatsapp] WHATSAPP_APP_SECRET unset — accepting UNSIGNED webhook (open-demo mode)` warning). Signature mismatch with a secret set → typed `WhatsappSignatureError` → route returns `401`.
- **No access token / phone number id** → replies are generated, persisted, and *logged*
  (`[whatsapp] demo-mode outbound (no creds) → …`) instead of sent; `sendOutbound` never throws.
- The route **always answers Meta with 200** (`EVENTS_PROCESSED` in the body) except the
  signature-401 case. Internal errors never become 5xx — Meta would retry them for days.

## Idempotency note

Meta retries webhook deliveries on timeout, so reprocessing would double-reply.
The `Message` Prisma model has **no `externalId` column** (schema untouched for
Phase 1), so dedupe is an **in-memory `Set<externalId>`** (cap 10k, oldest-half
eviction) inside the route:

- per server instance only — a restart clears it, and horizontally-scaled
  instances don't share it;
- the durable fix (Phase 2): add `externalId String? @unique` to `Message` +
  a Postgres unique-constraint upsert. Do the migration when real PII lands,
  together with the multi-tenant `orgId` work (STARTUP_VISION §8).

## Voice-note STT roadmap (STARTUP_VISION §4)

Voice notes arrive today as `kind: "voice"` with `mediaRef` (Meta media id) and
get a bilingual ack pointing the worker to the web voice demo — **no server STT
yet**. The pilot path from the vision doc:

1. Download media via Graph API (`GET /v21.0/{media-id}` with the bearer token) → ogg/opus.
2. Transcribe with Whisper / `gpt-transcribe` (~$0.006/min) **or** Google `sw-KE` STT;
   put the transcript into `InboundMsg.text` and let the same engine handle it.
3. Scale tier: fine-tuned Whisper large-v3 (Lacuna Fund Kenyan Swahili dataset,
   PazaBench evals) or Deepgram streaming for IVR; add a Sheng-normalization
   pass (Sheng → clean EN/SW before parsing) — the differentiation play.

## Test locally with curl

```bash
# 1) Plain GET → 403 JSON (not a verification request)
curl -s -i http://localhost:3000/api/channels/whatsapp

# 2) Wrong verify token → 403
curl -s -i "http://localhost:3000/api/channels/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc"

# 3) Realistic Meta text-message payload (unsigned → demo mode) → 200 with reply
curl -s -X POST http://localhost:3000/api/channels/whatsapp \
  -H 'content-type: application/json' \
  -d '{"object":"whatsapp_business_account","entry":[{"id":"WABA1","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"PNID1"},"contacts":[{"profile":{"name":"Amina"},"wa_id":"254711223344"}],"messages":[{"from":"254711223344","id":"wamid.demo001","timestamp":"1727000000","type":"text","text":{"body":"Habari, nataka kazi ya mama fua"}}]}}]}]}'
# → {"ok":true,"EVENTS_PROCESSED":1,"received":1,"replies":[...],"reply":"...", ...}

# 4) Send the SAME payload again → idempotent (idempotentSkips: 1, no new reply row)

# 5) Signature path (set WHATSAPP_APP_SECRET, then sign the raw body):
BODY='...'; SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WHATSAPP_APP_SECRET" -hex | awk '{print $2}')"
curl -s -X POST http://localhost:3000/api/channels/whatsapp \
  -H "content-type: application/json" -H "X-Hub-Signature-256: $SIG" -d "$BODY"
# wrong/absent signature with secret set → 401

# 6) Unit tests (no server needed):
bun scripts/whatsapp-verify.mjs
```

## Meta webhook setup (pilot)

1. **Meta App** → create at developers.facebook.com, add the **WhatsApp** product
   (Cloud API, free tier; service conversations are free since July 2025).
2. **Credentials** → copy *Phone number ID* → `WHATSAPP_PHONE_NUMBER_ID`; generate a
   **permanent** token via a System User (Business Settings) with
   `whatsapp_business_messaging` → `WHATSAPP_ACCESS_TOKEN`.
3. **App settings → Basic** → copy *App secret* → `WHATSAPP_APP_SECRET`.
4. **Configuration → Webhook**:
   - Callback URL: `https://<your-host>/api/channels/whatsapp`
   - Verify token: your `WHATSAPP_VERIFY_TOKEN` value
   - Click *Verify and save* (Meta issues the GET `hub.challenge` handshake our
     `verifyWebhook` answers with the raw challenge text).
5. **Subscribe to the `messages` field** on the webhook (without it Meta only
   delivers account updates, not messages).
6. Send a WhatsApp message ("Habari") to the test number and watch the logs —
   you should see the persisted Candidate/Message rows and the Graph API reply.
