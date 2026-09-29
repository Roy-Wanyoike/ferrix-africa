import { NextResponse } from "next/server";

// Catch-all for unknown /api/* paths — JSON 404 instead of the Next HTML
// default, keeping the "API errors are always JSON" posture (QA 5-a D18).
export function GET() {
  return NextResponse.json(
    { error: "Not found", message: "Unknown API route. See docs/API.md for available endpoints." },
    { status: 404 },
  );
}

export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
