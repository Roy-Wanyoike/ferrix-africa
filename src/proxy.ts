import { NextResponse } from "next/server";
import { isAuthEnforced } from "@/lib/auth";

// Next.js 16 proxy (formerly middleware): every /api/* response carries
// `x-ferrix-auth` describing the deployment's auth mode (SEC-01 contract,
// docs/API.md). Per-route headers (401s, shared-helper errors) already set
// the same value; the proxy guarantees full coverage incl. GET successes.
export default function proxy() {
  const res = NextResponse.next();
  res.headers.set(
    "x-ferrix-auth",
    isAuthEnforced() ? "enforced" : "open-demo",
  );
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
