// WhatsApp Cloud API ChannelAdapter — the first real edge channel (STARTUP_VISION
// §8 "channels as swappable edges", §7 Phase 2).
//
// OPEN-DEMO MODE: every credential below is optional. When any of them is unset
// the adapter keeps working in a documented, safe way so the hackathon demo can
// never die:
//   - WHATSAPP_VERIFY_TOKEN unset → webhook verification always 403 (bilingual JSON error)
//   - WHATSAPP_APP_SECRET unset   → inbound POSTs are accepted WITHOUT signature check (logged)
//   - ACCESS_TOKEN / PHONE_NUMBER_ID unset → sendOutbound is a logged no-op
//
// Dependency-free: global fetch for the Graph API, node:crypto for the
// X-Hub-Signature-256 check. No Meta SDK.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { ChannelAdapter, InboundMsg, OutboundMsg } from "./types";

const GRAPH_VERSION = "v21.0";

/** Thrown when the X-Hub-Signature-256 check fails; the webhook route turns this into 401. */
export class WhatsappSignatureError extends Error {
  constructor(message = "Invalid X-Hub-Signature-256") {
    super(message);
    this.name = "WhatsappSignatureError";
  }
}

// ── env (read at call time so tests can toggle without re-importing) ────────
const verifyToken = () => process.env.WHATSAPP_VERIFY_TOKEN;
const appSecret = () => process.env.WHATSAPP_APP_SECRET;
const accessToken = () => process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = () => process.env.WHATSAPP_PHONE_NUMBER_ID;

// ── signature (Meta: "sha256=" + HMAC-SHA256-hex of the RAW body) ───────────
const verifySignature = (header: string, rawBody: string, secret: string): boolean => {
  if (!header.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const got = header.slice("sha256=".length);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(got, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

// ── language heuristic (same idea the route uses for Candidate.language) ────
const SW_WORDS = [
  "nataka", "kazi", "asante", "habari", "sawa", "naomba", "tafadhali",
  "fursa", "pesa", "karibu", "pole", "ndiyo", "hapana", "jina", "muda",
  "sasa", "hapa", "kuanza", "mahindi", "chakula", "kwanza",
];
export const detectLang = (text?: string): "en" | "sw" => {
  if (!text) return "en";
  const t = text.toLowerCase();
  return SW_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(t)) ? "sw" : "en";
};

// ── Meta payload shape (defensive — Meta evolves this; never trust it) ──────
interface MetaMessage {
  id?: string;
  from?: string;
  type?: string;
  timestamp?: string;
  text?: { body?: string };
  audio?: { id?: string; mime_type?: string };
  voice?: { id?: string; mime_type?: string };
  image?: { id?: string; caption?: string };
  document?: { id?: string; caption?: string };
  [k: string]: unknown;
}
interface MetaValue {
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: MetaMessage[];
  statuses?: unknown[];
  [k: string]: unknown;
}

const toInbound = (msg: MetaMessage, senderName?: string): InboundMsg | null => {
  const phone = msg.from;
  if (!phone) return null;
  const externalId = typeof msg.id === "string" && msg.id ? msg.id : undefined;
  const base = {
    channel: "whatsapp" as const,
    externalId,
    senderPhone: phone,
    senderName,
    lang: detectLang(msg.text?.body),
  };
  if (msg.type === "text" && typeof msg.text?.body === "string" && msg.text.body.trim()) {
    return { ...base, kind: "text", text: msg.text.body.trim(), raw: msg };
  }
  // Voice note (Cloud API emits type "audio"; older stacks used "voice").
  const media = msg.audio ?? msg.voice;
  if ((msg.type === "audio" || msg.type === "voice") && media) {
    return { ...base, kind: "voice", mediaRef: media.id ?? media.mime_type, raw: msg };
  }
  // Anything else (image/document/interactive/button/location…) → other;
  // captions are surfaced as text when present so the engine has something to chew.
  const caption = msg.image?.caption ?? msg.document?.caption;
  return { ...base, kind: "other", text: typeof caption === "string" && caption.trim() ? caption.trim() : undefined, raw: msg };
};

export const whatsappAdapter: ChannelAdapter = {
  name: "whatsapp",

  async verifyWebhook(req: Request): Promise<Response | null> {
    const url = new URL(req.url);
    if (url.searchParams.get("hub.mode") !== "subscribe") return null; // not a verification request

    const challenge = url.searchParams.get("hub.challenge") ?? "";
    const expected = verifyToken();
    if (!expected) {
      console.error("[whatsapp] WHATSAPP_VERIFY_TOKEN unset — refusing webhook verification (open-demo mode)");
      return Response.json(
        {
          error: "Webhook verify token not configured / Token ya uthibitisho haijawekwa",
          hint: "Set WHATSAPP_VERIFY_TOKEN in .env, then retry the Meta subscription handshake.",
        },
        { status: 403 }
      );
    }
    if (url.searchParams.get("hub.verify_token") === expected) {
      return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
    }
    return Response.json(
      { error: "Verification failed: token mismatch / Uthibitisho umeshindikana: token si sahihi" },
      { status: 403 }
    );
  },

  async parseInbound(req: Request): Promise<InboundMsg[]> {
    const raw = await req.text();

    const secret = appSecret();
    if (secret) {
      const sig = req.headers.get("x-hub-signature-256") ?? "";
      if (!verifySignature(sig, raw, secret)) {
        throw new WhatsappSignatureError();
      }
    } else {
      // Open-demo mode: accept but flag. Never ship to prod like this — set
      // WHATSAPP_APP_SECRET and Meta will sign every delivery.
      console.warn("[whatsapp] WHATSAPP_APP_SECRET unset — accepting UNSIGNED webhook (open-demo mode)");
    }

    let payload: { entry?: { changes?: { value?: MetaValue }[] }[] };
    try {
      payload = JSON.parse(raw);
    } catch {
      console.warn("[whatsapp] ignoring non-JSON webhook body");
      return [];
    }

    const out: InboundMsg[] = [];
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value?.messages?.length) continue; // statuses-only or empty → nothing to do
        const nameByWaId = new Map<string, string | undefined>();
        for (const c of value.contacts ?? []) {
          if (c.wa_id) nameByWaId.set(c.wa_id, c.profile?.name);
        }
        for (const m of value.messages) {
          const inbound = toInbound(m, nameByWaId.get(m.from ?? "") ?? value.contacts?.[0]?.profile?.name);
          if (inbound) out.push(inbound);
        }
      }
    }
    return out;
  },

  async sendOutbound(msg: OutboundMsg): Promise<void> {
    const token = accessToken();
    const phoneId = phoneNumberId();
    if (!token || !phoneId) {
      // Demo mode: log the would-be reply so curl tests can see it, never throw.
      console.log(`[whatsapp] demo-mode outbound (no creds) → ${msg.to ?? "?"}: ${msg.text.slice(0, 200)}`);
      return;
    }
    try {
      const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: msg.to,
          type: "text",
          text: { preview_url: false, body: msg.text },
        }),
      });
      if (!res.ok) {
        // Delivery failure must never take the webhook (and Meta's 200) down.
        console.error(`[whatsapp] Graph API send failed ${res.status}:`, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.error("[whatsapp] Graph API send threw:", err);
    }
  },
};

export type { InboundMsg, OutboundMsg };
