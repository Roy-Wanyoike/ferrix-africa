// Unit tests for the WhatsApp Cloud API adapter (no server required).
// Run: bun scripts/whatsapp-verify.mjs
//
// Covers the paths we cannot hit on the live dev server without creds:
//   - hub.challenge handshake (correct / wrong / unset verify token)
//   - X-Hub-Signature-256 verification (unsigned / validly signed / bad sig)
//   - payload normalization (text / voice / statuses-only)
//   - demo-mode sendOutbound no-op
// Signatures are built with node:crypto HMAC-SHA256 exactly like Meta signs them.

import { createHmac } from "node:crypto";
import assert from "node:assert/strict";

// Env must be set BEFORE the dynamic import for module-level defaults;
// the adapter also re-reads env per call, so later toggles work too.
process.env.WHATSAPP_VERIFY_TOKEN = "ferrix-test-verify-token";
process.env.WHATSAPP_APP_SECRET = "ferrix-test-app-secret";

const { whatsappAdapter, WhatsappSignatureError, detectLang } = await import(
  "../src/lib/channels/whatsapp.ts"
);

const BASE = "http://localhost:3000/api/channels/whatsapp";
const GET_URL = `${BASE}?hub.mode=subscribe&hub.verify_token=ferrix-test-verify-token&hub.challenge=CHALLENGE_123`;

const sign = (body, secret) =>
  "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");

const metaTextPayload = (text, id = "wamid.test001") =>
  JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WABA123",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "254700000000", phone_number_id: "PNID123" },
              contacts: [{ profile: { name: "Amina" }, wa_id: "254711223344" }],
              messages: [
                { from: "254711223344", id, timestamp: "1727000000", type: "text", text: { body: text } },
              ],
            },
          },
        ],
      },
    ],
  });

let passed = 0;
const ok = (label) => {
  passed += 1;
  console.log(`  PASS  ${label}`);
};

// ── 1. Verification handshake ───────────────────────────────────────────────
{
  const res = await whatsappAdapter.verifyWebhook(new Request(GET_URL, { method: "GET" }));
  assert.equal(res instanceof Response, true);
  assert.equal(res.status, 200);
  assert.equal(await res.text(), "CHALLENGE_123");
  ok("verifyWebhook: correct token → 200 + echo of hub.challenge");
}
{
  const bad = GET_URL.replace("ferrix-test-verify-token", "wrong-token");
  const res = await whatsappAdapter.verifyWebhook(new Request(bad, { method: "GET" }));
  assert.equal(res.status, 403);
  const body = await res.json();
  assert.ok(String(body.error).length > 0);
  ok("verifyWebhook: wrong token → 403 JSON");
}
{
  const prev = process.env.WHATSAPP_VERIFY_TOKEN;
  delete process.env.WHATSAPP_VERIFY_TOKEN;
  try {
    const res = await whatsappAdapter.verifyWebhook(new Request(GET_URL, { method: "GET" }));
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.ok(/not configured|haijawekwa/i.test(body.error));
    ok("verifyWebhook: verify token env unset → 403 bilingual JSON error");
  } finally {
    process.env.WHATSAPP_VERIFY_TOKEN = prev;
  }
}
{
  const res = await whatsappAdapter.verifyWebhook(new Request(BASE, { method: "GET" }));
  assert.equal(res, null);
  ok("verifyWebhook: plain GET (no hub params) → null (not a verification request)");
}

// ── 2. Signature enforcement (secret IS set) ────────────────────────────────
{
  const body = metaTextPayload("Habari, nataka kazi ya mama fua");
  await assert.rejects(
    () =>
      whatsappAdapter.parseInbound(
        new Request(BASE, { method: "POST", body, headers: { "content-type": "application/json" } })
      ),
    (err) => err instanceof WhatsappSignatureError
  );
  ok("parseInbound: unsigned POST rejected with WhatsappSignatureError when secret is set");
}
{
  const body = metaTextPayload("Habari, nataka kazi ya mama fua");
  const badSig = sign(body, "not-the-real-secret");
  await assert.rejects(
    () =>
      whatsappAdapter.parseInbound(
        new Request(BASE, {
          method: "POST",
          body,
          headers: { "content-type": "application/json", "x-hub-signature-256": badSig },
        })
      ),
    (err) => err instanceof WhatsappSignatureError
  );
  ok("parseInbound: forged signature rejected (HMAC-SHA256 mismatch)");
}
{
  const body = metaTextPayload("Habari, nataka kazi ya mama fua");
  const msgs = await whatsappAdapter.parseInbound(
    new Request(BASE, {
      method: "POST",
      body,
      headers: { "content-type": "application/json", "x-hub-signature-256": sign(body, "ferrix-test-app-secret") },
    })
  );
  assert.equal(msgs.length, 1);
  const m = msgs[0];
  assert.equal(m.channel, "whatsapp");
  assert.equal(m.kind, "text");
  assert.equal(m.text, "Habari, nataka kazi ya mama fua");
  assert.equal(m.senderPhone, "254711223344");
  assert.equal(m.senderName, "Amina");
  assert.equal(m.externalId, "wamid.test001");
  assert.equal(m.lang, "sw");
  ok("parseInbound: validly-signed POST parsed → normalized InboundMsg (lang=sw via heuristic)");
}

// ── 3. Open-demo mode (secret UNSET → unsigned accepted but flagged) ────────
{
  const prev = process.env.WHATSAPP_APP_SECRET;
  delete process.env.WHATSAPP_APP_SECRET;
  try {
    const body = metaTextPayload("Hello, I am a plumber in Kayole");
    const msgs = await whatsappAdapter.parseInbound(
      new Request(BASE, { method: "POST", body, headers: { "content-type": "application/json" } })
    );
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].lang, "en");
    ok("parseInbound: secret unset → unsigned payload accepted (open-demo mode), lang=en");

    const res = await whatsappAdapter.sendOutbound({ to: "254711223344", text: "Karibu Ferrix!" });
    assert.equal(res, undefined); // resolved, no throw
    ok("sendOutbound: no creds → logged no-op, never throws (demo mode)");
  } finally {
    process.env.WHATSAPP_APP_SECRET = prev;
  }
}

// ── 4. Payload edge cases ───────────────────────────────────────────────────
{
  const statusesOnly = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ id: "WABA123", changes: [{ field: "messages", value: { statuses: [{ id: "wamid.s1", status: "delivered" }] } }] }],
  });
  const msgs = await whatsappAdapter.parseInbound(
    new Request(BASE, {
      method: "POST",
      body: statusesOnly,
      headers: { "content-type": "application/json", "x-hub-signature-256": sign(statusesOnly, "ferrix-test-app-secret") },
    })
  );
  assert.deepEqual(msgs, []);
  ok("parseInbound: statuses-only payload → [] (nothing to do)");
}
{
  const voicePayload = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ id: "WABA123", changes: [{ field: "messages", value: {
      contacts: [{ profile: { name: "Amina" }, wa_id: "254711223344" }],
      messages: [{ from: "254711223344", id: "wamid.v1", timestamp: "1727000001", type: "audio", audio: { id: "MEDIA123", mime_type: "audio/ogg; codecs=opus" } }],
    } }] }],
  });
  const msgs = await whatsappAdapter.parseInbound(
    new Request(BASE, {
      method: "POST",
      body: voicePayload,
      headers: { "content-type": "application/json", "x-hub-signature-256": sign(voicePayload, "ferrix-test-app-secret") },
    })
  );
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].kind, "voice");
  assert.equal(msgs[0].mediaRef, "MEDIA123");
  assert.equal(msgs[0].text, undefined);
  ok("parseInbound: voice note → kind=voice + mediaRef, no text");
}

// ── 5. Language heuristic ───────────────────────────────────────────────────
assert.equal(detectLang("nataka kazi ya leo"), "sw");
assert.equal(detectLang("asante sana"), "sw");
assert.equal(detectLang("I want a job please"), "en");
assert.equal(detectLang(undefined), "en");
ok("detectLang: sw keywords (nataka/kazi/asante) → sw, else en");

console.log(`\nwhatsapp-verify: ${passed} assertions groups passed ✅`);
