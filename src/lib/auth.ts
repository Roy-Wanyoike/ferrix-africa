// SEC-01 — shared auth helper for mutating API routes.
//
// Demo-mode contract (documented in README + ISSUES.md):
//  - When FERRIX_API_TOKEN is NOT set (default), the app runs in open demo mode
//    so judges can click through the full pipeline with zero setup. Mutating
//    routes stamp `x-ferrix-auth: open-demo` on responses so the mode is
//    always visible to auditors.
//  - When FERRIX_API_TOKEN IS set, every mutating request must present the
//    token via `Authorization: Bearer <token>` or `x-api-key: <token>`.
//    Reads (GET) stay public — the demo is judge-facing by design.
//
// Usage inside a route handler:
//   const guard = requireMutatingAuth(req);   // returns Response | null
//   if (guard) return guard;

export const isAuthEnforced = (): boolean =>
  Boolean(process.env.FERRIX_API_TOKEN && process.env.FERRIX_API_TOKEN.length >= 8);

const bearerMatch = (raw: string): string | null => {
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match ? match[1].trim() : raw.trim();
};

const tokensEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * Returns a 401 Response when auth is enforced and the caller is not
 * authorized. Returns null when the request may proceed (open demo mode or
 * valid token). Non-mutating endpoints should not call this.
 */
export const requireMutatingAuth = (req: Request): Response | null => {
  if (!isAuthEnforced()) return null;
  const raw = req.headers.get("authorization") ?? req.headers.get("x-api-key");
  const presented = raw ? bearerMatch(raw) : null;
  if (presented && tokensEqual(presented, process.env.FERRIX_API_TOKEN as string)) {
    return null;
  }
  return new Response(
    JSON.stringify({
      error: "unauthorized",
      message:
        "Ferrix auth is enforced on this deployment. Present the coordinator token via 'Authorization: Bearer <token>' or 'x-api-key'.",
    }),
    {
      status: 401,
      headers: { "content-type": "application/json", "x-ferrix-auth": "enforced" },
    },
  );
};

/** Standard header stamp describing the current auth mode. */
export const authModeHeaders = (): Record<string, string> =>
  isAuthEnforced()
    ? { "x-ferrix-auth": "enforced" }
    : { "x-ferrix-auth": "open-demo" };
