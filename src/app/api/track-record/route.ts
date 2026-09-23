import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, trackRecordSchema, validateBody } from "@/lib/validate";

export const dynamic = "force-dynamic";

// GET /api/track-record?candidateId=... — verified work passport entries + summary.
export async function GET(req: NextRequest) {
  try {
    const candidateId = req.nextUrl.searchParams.get("candidateId");
    if (!candidateId)
      return NextResponse.json({ error: "candidateId required" }, { status: 400 });

    // BE-17: unknown candidateId → 404 instead of a silent empty summary.
    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate)
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    const entries = await db.trackRecordEntry.findMany({
      where: { candidateId },
      orderBy: { occurredAt: "desc" },
    });

    const placements = entries.filter((e) => e.kind === "PLACEMENT");
    const trainings = entries.filter((e) => e.kind === "TRAINING");
    const reviews = entries.filter((e) => e.kind === "REVIEW" && e.rating != null);
    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length) * 10) / 10
        : null;
    const lastVerifiedAt = entries[0]?.occurredAt ?? null;

    return NextResponse.json({
      entries,
      summary: {
        placements: placements.length,
        trainings: trainings.length,
        reviews: reviews.length,
        avgRating,
        verifiedCount: entries.filter((e) => e.verified).length,
        lastVerifiedAt,
      },
    });
  } catch (err) {
    console.error("[track-record GET] error:", err);
    return NextResponse.json({ error: "Failed to load track record" }, { status: 500 });
  }
}

// POST /api/track-record — a human coordinator adds a verified entry.
export async function POST(req: NextRequest) {
  try {
    // BE-02: malformed JSON → 400.
    const raw = await safeJson(req);
    if (raw === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // SEC-02: zod contract (kind enum, length caps, rating 1..5, ISO datetime).
    const parsed = validateBody(trackRecordSchema, raw);
    if (parsed.res) return parsed.res;
    const { candidateId, kind, title, org, detail, rating, occurredAt, verifiedBy } =
      parsed.data;

    const candidate = await db.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    const entry = await db.trackRecordEntry.create({
      data: {
        candidateId,
        kind,
        title,
        org: org || null,
        detail: detail || null,
        rating: kind === "REVIEW" && rating != null ? rating : null,
        verified: true,
        verifiedBy: verifiedBy || "Coordinator (Ujuzi Hub)",
        ...(occurredAt ? { occurredAt: new Date(occurredAt) } : {}),
      },
    });
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("[track-record POST] error:", err);
    return NextResponse.json({ error: "Failed to add record" }, { status: 500 });
  }
}
