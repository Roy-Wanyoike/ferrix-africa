# Ferrix API Reference

Human-facing companion to [`docs/openapi.json`](./openapi.json) (OpenAPI 3.1). The JSON contract is **maintained by hand** and enforced by the QA suite — if you change a route, update both files in the same PR.

Base URL (local dev): `http://localhost:3000`

The API is the "versioned matcher API + integration surface" from `docs/STARTUP_VISION.md` §8: counties, NGOs, SACCOs and program implementers can run intake, read explainable matches, and advance the human trust pipeline **without Ferrix's involvement** (see [For partners](#for-partners) below).

---

## Endpoint table

| Endpoint | Method | Auth mode | Rate limit | Purpose |
|---|---|---|---|---|
| `/api/stats` | GET | open read | — | Pipeline metrics (assessed, placements, median first contact) |
| `/api/chat` | POST | **guarded mutation** | 60 req/min/IP | Conversational intake; mints the candidate & transcript |
| `/api/analyze` | POST | **guarded mutation** | 10 req/min/IP | Structured profile + **versioned** explainable matches + case handoff |
| `/api/cases` | GET | open read | — | List cases (full case shape) |
| `/api/cases/{id}` | GET | open read | — | Case detail (candidate, matches, events) |
| `/api/cases/{id}` | PATCH | **guarded mutation** | — | Trust pipeline: `accept`/`contact`/`place`/`resolve`/`note` |
| `/api/track-record` | GET | open read | — | Worker's verified work passport + summary |
| `/api/track-record` | POST | **guarded mutation** | — | Add a verified passport entry |
| `/api/asset` | POST | **guarded mutation** | 20 req/min/IP | Generate WhatsApp catalog or plain-text CV |
| `/api/voice-bio` | GET | open read | — | Has the worker recorded a voice bio (passport audio intro)? |
| `/api/voice-bio` | POST | **guarded mutation** | 30 req/min/IP | Persist the worker's self-recorded voice bio (≤1.5MB `data:audio/` URL) |
| `/api/channels/whatsapp` | GET | open | — | Meta webhook verification handshake (`hub.challenge`) |
| `/api/channels/whatsapp` | POST | open (signature-verified) | per-sender throttle | Inbound WhatsApp messages → intake engine → auto-reply. `X-Hub-Signature-256` verified when `WHATSAPP_APP_SECRET` is set |

> There is deliberately **no** `POST /api/cases` (cases are minted by `/api/analyze`), no `GET /api/chat` (transcripts ride in the chat response), and no `GET /api/asset` (assets are generated on demand, not stored). Unknown `/api/*` paths answer a JSON 404 (catch-all route), never HTML.

`/api/analyze` returns the **top 4** explainable matches by design — the coordinator pipeline is built for a short, high-signal shortlist, not a long feed.

"Guarded mutation" means the endpoint participates in the auth contract below; GET reads are always public so the demo stays judge-facing.

---

## Auth contract

The single source of truth is `src/lib/auth.ts`. Two modes, selected by whether `FERRIX_API_TOKEN` is set (≥8 chars) on the deployment:

| Mode | When | Mutating routes (POST/PATCH) | Reads (GET) |
|---|---|---|---|
| `open-demo` | `FERRIX_API_TOKEN` unset (default) | Open — zero setup, so judges can click the full pipeline | Open |
| `enforced` | `FERRIX_API_TOKEN` set | Require the token | Open |

**How to send the token** when enforced (either header works):

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Authorization: Bearer $FERRIX_API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"candidateId":"<id>"}'

# equivalent:
curl -X POST http://localhost:3000/api/analyze \
  -H "x-api-key: $FERRIX_API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"candidateId":"<id>"}'
```

**Visibility is mandatory:** the contract is that *every* response carries an `x-ferrix-auth` header (`open-demo` or `enforced`) so auditors can always see which mode served the request. Today this is verifiably true for success responses (`...authModeHeaders()` in each route) and for `401` rejections (`x-ferrix-auth: enforced`); the shared 400/404/429 error helpers in `src/lib/validate.ts` / `src/lib/rate-limit.ts` are being wired to stamp it too. A `401` response body is:

```json
{
  "error": "unauthorized",
  "message": "Ferrix auth is enforced on this deployment. Present the coordinator token via 'Authorization: Bearer <token>' or 'x-api-key'."
}
```

---

## Error-shape conventions

Errors are always JSON, never HTML or empty bodies:

- **All errors** carry `error` — a short, stable string. For request-body failures this is the first Zod issue message (e.g. `"String must contain at least 1 character(s)"`).
- **401** additionally carries `message` (human guidance, see above) — the `{ error, message }` shape.
- **Malformed JSON body → 400**, never a 500 (`safeJson` + Zod on every mutating route).
- **429** carries the `error` body plus a `Retry-After` header in seconds.

Status codes you will actually see:

| Code | Meaning | Typical cause |
|---|---|---|
| 200 | OK | — |
| 400 | Bad request | Malformed JSON, Zod contract failure, invalid case transition, missing `note`/`opportunityId`, asset requested before profiling |
| 401 | Unauthorized | Enforced mode without a valid token (guarded mutations only) |
| 404 | Not found | Unknown `candidateId` / case id / opportunity id |
| 409 | Conflict | `place` on an already-placed case, `resolve` on an already-resolved case |
| 429 | Rate limited | AI-cost routes: chat 60/min, analyze 10/min, asset 20/min per IP (fixed window, in-memory) |
| 500 | Server error | Unexpected — the handler logs details server-side |

> **Idempotency asymmetry (by design):** repeating `place`/`resolve` → `409` because both write immutable work-passport entries and must never double-execute (integrity-critical). Repeating `accept`/`contact` → `400` with the transition error (state flags, no side effects).

**Rate-limit behavior on AI routes:** `/api/chat`, `/api/analyze` and `/api/asset` bucket by client IP (first `x-forwarded-for` hop) with fixed windows (60/10/20 per minute respectively). Exceeding the window returns `429 { "error": "Too many requests, try again shortly" }` with `Retry-After`. Limits reset automatically; the limiter is per server instance and generous enough to never trip during a normal demo. LLM-backed routes also degrade gracefully: when the model is unavailable they return `200` with `mode: "fallback"` and scripted content instead of failing.

---

## Golden path (curl)

The full pipeline: **chat → analyze → cases PATCH accept → contact → place → resolve → track-record**.

```bash
BASE=http://localhost:3000

# 1) Start intake from a persona (mama_fua | mama_mboga | boda | cashier | fundi)
CANDIDATE=$(curl -s -X POST $BASE/api/chat \
  -H "content-type: application/json" \
  -d '{"persona":"mama_fua","language":"sw"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['candidateId'])")

# 2) Continue the conversation (repeat; each reply advances the stage)
curl -s -X POST $BASE/api/chat -H "content-type: application/json" \
  -d "{\"candidateId\":\"$CANDIDATE\",\"message\":\"Nafua nguo Kayole\",\"language\":\"sw\"}"

# 3) Analyze → structured profile + versioned explainable matches + case
ANALYZE=$(curl -s -X POST $BASE/api/analyze \
  -H "content-type: application/json" \
  -d "{\"candidateId\":\"$CANDIDATE\"}")
echo "$ANALYZE" | python3 -m json.tool   # note "matcherVersion": "v1"
CASE_ID=$(echo "$ANALYZE" | python3 -c "import sys,json;print(json.load(sys.stdin)['case']['id'])")
OPP_ID=$(echo "$ANALYZE" | python3 -c "import sys,json;print(json.load(sys.stdin)['matches'][0]['id'])")

# 4) Human trust pipeline (AI proposes, humans place)
curl -s -X PATCH $BASE/api/cases/$CASE_ID -H "content-type: application/json" -d '{"action":"accept"}'
curl -s -X PATCH $BASE/api/cases/$CASE_ID -H "content-type: application/json" \
  -d '{"action":"contact","note":"Called — ID and availability confirmed."}'
curl -s -X PATCH $BASE/api/cases/$CASE_ID -H "content-type: application/json" \
  -d "{\"action\":\"place\",\"opportunityId\":\"$OPP_ID\"}"   # writes a verified passport entry
curl -s -X PATCH $BASE/api/cases/$CASE_ID -H "content-type: application/json" \
  -d '{"action":"resolve","note":"Outcome confirmed with candidate."}'

# 5) Read the worker's verified track record (work passport)
curl -s "$BASE/api/track-record?candidateId=$CANDIDATE" | python3 -m json.tool

# 6) Bonus: WhatsApp-ready catalog from the stored profile
curl -s -X POST $BASE/api/asset -H "content-type: application/json" \
  -d "{\"candidateId\":\"$CANDIDATE\",\"kind\":\"catalog\"}"
```

Notes on the pipeline: PATCH actions enforce a strict state machine (`accept` requires `new`, `contact` requires `accepted`, `place` requires `contacted` + `opportunityId`, `resolve` requires `placed`) — wrong-order calls return `400 Invalid transition: …`. `place` automatically writes a verified `PLACEMENT` entry into the worker's track record. If auth is `enforced`, add `-H "Authorization: Bearer $FERRIX_API_TOKEN"` to the POST/PATCH calls.

---

## Matcher versioning

Scores come from a deterministic, explainable scorer (`src/lib/matcher.ts`) — the same reasons the UI shows ("Uses your strengths: …", "Free — no upfront cost").

- `MATCHER_VERSION` (currently **`"v1"`**) is bumped on **any change to scoring semantics**: the score formula/weights, the goal-hint table, the reason strings, or the fields the scorer reads.
- Every persisted `Match` row is stamped with `Match.matcherVersion`, and `POST /api/analyze` echoes it — top level **and** per match — so an API consumer can always tell which version produced the scores it just used.
- Responses carry the version that **produced** them, never a client-requested one; there is no version negotiation. Consumers should log `matcherVersion` alongside any decision they derive from the scores (audit-reproducibility posture, Kenya DP Act §9: a version on every automated decision).
- To reproduce a historical score: check the version on the row, read the scorer source at that version tag, re-run the same profile + opportunities.
- Match objects inside `GET /api/cases` and `GET /api/cases/{id}` surface `matcherVersion` too (shared `serializeCase` in `src/lib/serialize.ts`), so every serialized match carries the version that produced it.

---

## For partners

**Counties, NGOs, SACCOs and program implementers can integrate without Ferrix's involvement.** This is the DPI (Digital Public Infrastructure) posture from `docs/STARTUP_VISION.md` §8/§9:

- **Self-serve integration** — the endpoint table above plus the machine-readable `docs/openapi.json` are the whole contract. A county employability program can post intake transcripts to `/api/chat`, call `/api/analyze`, and read versioned, explainable matches for reporting — no bespoke Ferrix engineering, no vendor lock-in conversations.
- **Machine-readable, hand-tested** — `openapi.json` is kept valid OpenAPI 3.1 and exercised by the QA suite, so client codegen (`openapi-generator`, Postman import, etc.) works against a file that matches the running system.
- **Auditable decisions** — `matcherVersion` on every match, `x-ferrix-auth` on every response, append-only case events with actor attribution: partners get a trust pipeline they can defend to auditors and funders.
- **Worker-owned data** — the track record is portable by design (`GET /api/track-record`); a worker's passport is not held hostage by any single integration. Partners should surface consent notices at intake and respect data-subject rights (full export + deletion) per the Kenya DP Act 2019 posture documented in `docs/STARTUP_VISION.md` §9.
- **No real PII on the demo** — the public demo runs open (no token, demo data only). For anything touching real worker data, deploy with `FERRIX_API_TOKEN` set and follow the privacy checklist in the vision doc.

---

*Maintained by hand alongside `docs/openapi.json`. Questions → `src/lib/auth.ts` (auth), `src/lib/matcher.ts` (scorer + versioning), `src/lib/rate-limit.ts` (limits).*
