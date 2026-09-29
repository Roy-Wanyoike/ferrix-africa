// ChannelAdapter contract — STARTUP_VISION §8: "channels as swappable edges,
// one AI engine at the core."
//
// Every inbound surface (web chat, WhatsApp Cloud API, future SMS/USSD/IVR)
// normalizes into InboundMsg via an adapter, and every outbound reply leaves as
// an OutboundMsg. The AI engine (src/lib/ai.ts) never learns which channel it
// is talking to.
//
// Dependency-free by design: adapters may only use global fetch / node builtins
// so they can be unit-tested without the Next.js runtime.

export interface InboundMsg {
  channel: 'web' | 'whatsapp' | 'sms' | 'ussd';
  externalId?: string;      // channel message id (idempotency)
  senderPhone?: string;     // E.164
  senderName?: string;
  lang: 'en' | 'sw';
  kind: 'text' | 'voice' | 'other';
  text?: string;            // normalized text (voice notes: transcript when available, else absent)
  mediaRef?: string;        // media id/url for voice
  raw?: unknown;
}

export interface OutboundMsg { to?: string; text: string; }

export interface ChannelAdapter {
  readonly name: string;
  /** Handle Meta-style webhook verification (GET hub.challenge handshake). Return null = not a verification request. */
  verifyWebhook(req: Request): Promise<Response | null>;
  /** Verify signature (when configured), parse the provider payload, normalize to InboundMsg[]. Return [] for nothing-to-do. */
  parseInbound(req: Request): Promise<InboundMsg[]>;
  /** Deliver the reply on this channel. In demo mode (creds unset) adapters log + no-op, never throw. */
  sendOutbound(msg: OutboundMsg): Promise<void>;
}
