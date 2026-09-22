import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/track-record?candidateId=... — verified work passport entries + summary.
export async function GET(req: NextRequest) {
  try {
    const candidateId = req.nextUrl.searchParams.get("candidateId");
    if (!candidateId)
      return NextResponse.json({ error: "candidateId required" }, { status: 400 });

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
    const body = await req.json();
    const { candidateId, kind, title, org, detail, rating, verifiedBy } = body;
    if (!candidateId || !kind || !title?.trim())
      return NextResponse.json(
        { error: "candidateId, kind and title are required" },
        { status: 400 }
      );
    if (!["PLACEMENT", "TRAINING", "REVIEW"].includes(kind))
      return NextResponse.json({ error: "kind must be PLACEMENT, TRAINING or REVIEW" }, { status: 400 });

    const candidate = await db.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    const entry = await db.trackRecordEntry.create({
      data: {
        candidateId,
        kind,
        title: title.trim(),
        org: org?.trim() || null,
        detail: detail?.trim() || null,
        rating: kind === "REVIEW" && rating >= 1 && rating <= 5 ? Math.round(rating) : null,
        verified: true,
        verifiedBy: verifiedBy?.trim() || "Coordinator (Ujuzi Hub)",
      },
    });
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    console.error("[track-record POST] error:", err);
    return NextResponse.json({ error: "Failed to add record" }, { status: 500 });
  }
}
