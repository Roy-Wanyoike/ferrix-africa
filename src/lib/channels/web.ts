// Adapter #1 — the WEB channel.
//
// The existing Ferrix web app IS the web channel: the chat UI (worker view,
// voice mic, profile flow) already talks to /api/chat directly, which persists
// Message rows and calls the same llmChat()/INTAKE_SYSTEM_PROMPT engine that
// channel adapters feed. There is nothing to verify or parse over the wire for
// first-party traffic, so this adapter is a documented pass-through.
//
// Why it exists: STARTUP_VISION §8 wants "channels as swappable edges, one AI
// engine at the core". Registering web as the first ChannelAdapter keeps the
// interface honest (its first consumer), and gives the future unified
// orchestrator a seam — when /api/chat logic migrates behind the adapter
// contract, web traffic routes through here without touching the engine.

import type { ChannelAdapter, InboundMsg } from "./types";

export const webAdapter: ChannelAdapter = {
  name: "web",

  // First-party browser calls are not Meta-style webhooks; nothing to verify.
  async verifyWebhook(): Promise<Response | null> {
    return null;
  },

  // Inbound web messages are handled by /api/chat today; the orchestrator will
  // normalize them here once chat traffic moves behind the adapter seam.
  async parseInbound(): Promise<InboundMsg[]> {
    return [];
  },

  // Web replies return in the /api/chat JSON response (rendered by the chat UI),
  // so outbound delivery is a no-op.
  async sendOutbound(): Promise<void> {
    /* no-op: reply ships in the HTTP response body */
  },
};
