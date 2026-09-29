// SEC-01 regression test — unit-tests the pure auth helper logic from
// src/lib/auth.ts directly (no Next.js, no HTTP server, no DB).
//
// Run: bun run scripts/auth-verify.mjs   (bun executes TS imports natively)
// Exit code 0 = all assertions pass (CI-friendly).
//
// Covers BOTH halves of the demo-mode contract:
//   enforced (FERRIX_API_TOKEN set): mutating requests need
//     `Authorization: Bearer <token>` or `x-api-key: <token>` → else 401.
//   open demo (token unset): requireMutatingAuth() is a pass-through (null)
//     and responses are stamped `x-ferrix-auth: open-demo`.

const TOKEN = "test-token-12345";
const URL = "http://x/api/cases";

let passed = 0;
let failed = 0;
function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}${extra ? `  [${extra}]` : ""}`);
  } else {
    failed++;
    console.error(`FAIL  ${name}${extra ? `  [${extra}]` : ""}`);
  }
}

// Dynamic import AFTER env is set, so the helper reads the enforced env
// deterministically at call time (it evaluates process.env per request).
process.env.FERRIX_API_TOKEN = TOKEN;
const { requireMutatingAuth, isAuthEnforced, authModeHeaders } = await import(
  "../src/lib/auth.ts"
);

// ---- Enforced mode (FERRIX_API_TOKEN set) ----------------------------------
check(
  "isAuthEnforced() is true when FERRIX_API_TOKEN is set (>=8 chars)",
  isAuthEnforced() === true
);

// 1. No token → 401 Response.
const noToken = requireMutatingAuth(new Request(URL, { method: "POST" }));
check(
  "enforced: POST without token → 401 Response",
  noToken instanceof Response && noToken.status === 401,
  noToken instanceof Response
    ? `status=${noToken.status} x-ferrix-auth=${noToken.headers.get("x-ferrix-auth")}`
    : String(noToken)
);

// 2. Wrong token (same length, exercises the constant-time compare path) → 401.
const wrongToken = requireMutatingAuth(
  new Request(URL, {
    method: "POST",
    headers: { authorization: "Bearer test-token-99999" },
  })
);
check(
  "enforced: wrong Bearer token → 401 Response",
  wrongToken instanceof Response && wrongToken.status === 401
);

// 3. Correct Bearer token → null (request may proceed).
const bearerOk = requireMutatingAuth(
  new Request(URL, {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}` },
  })
);
check(
  "enforced: Authorization: Bearer <token> → null (allowed)",
  bearerOk === null,
  String(bearerOk)
);

// 4. Correct token via x-api-key → null (request may proceed).
const apiKeyOk = requireMutatingAuth(
  new Request(URL, { method: "POST", headers: { "x-api-key": TOKEN } })
);
check(
  "enforced: x-api-key: <token> → null (allowed)",
  apiKeyOk === null,
  String(apiKeyOk)
);

check(
  "authModeHeaders() stamps 'enforced' while token is set",
  authModeHeaders()["x-ferrix-auth"] === "enforced"
);

// ---- Open demo mode (FERRIX_API_TOKEN unset) -------------------------------
delete process.env.FERRIX_API_TOKEN;

const openDemo = requireMutatingAuth(new Request(URL, { method: "POST" }));
check(
  "open-demo: POST without token → null (judge golden path stays open)",
  openDemo === null,
  String(openDemo)
);
check(
  "authModeHeaders() stamps 'open-demo' when token is unset",
  authModeHeaders()["x-ferrix-auth"] === "open-demo"
);

// ---- Edge: sub-8-char token must NOT activate enforcement ------------------
process.env.FERRIX_API_TOKEN = "short";
check(
  "token shorter than 8 chars → isAuthEnforced() stays false (open-demo)",
  isAuthEnforced() === false &&
    requireMutatingAuth(new Request(URL, { method: "POST" })) === null
);

// Leave the environment as we found it.
delete process.env.FERRIX_API_TOKEN;

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
