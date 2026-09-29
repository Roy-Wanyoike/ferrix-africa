import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { badRequest, validateBody } from "@/lib/validate";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { requireMutatingAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/voice-bio — persist a worker's self-recorded voice bio (a base64
// data-URL, e.g. "data:audio/webm;codecs=opus;base64,...") onto Candidate.voiceBio.
// GET /api/voice-bio?candidateId=... — report whether a voice bio exists.

// Hard cap: the request body must stay <= 1.5MB (a 25s opus voice note is
// ~30–60KB, so honest clients never come near this; the cap only stops abuse).
const MAX_BODY_CHARS = 1_500_000;

const voiceBioSchema = z.object({
  candidateId: z.string().min(1),
  audio: z
    .string()
    .startsWith("data:audio/", { message: "audio must be a data:audio/ URL" })
    .max(1_400_000, { message: "audio too large" }),
});

export async function GET(req: NextRequest) {
  try {
    const candidateId = req.nextUrl.searchParams.get("candidateId");
    if (!candidateId) return badRequest("candidateId required");

    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, voiceBio: true, updatedAt: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasVoiceBio: Boolean(candidate.voiceBio),
      audio: candidate.voiceBio ?? null,
      ...(candidate.voiceBio ? { createdAt: candidate.updatedAt } : {}),
    });
  } catch (err) {
    console.error("[voice-bio GET] error:", err);
    return NextResponse.json({ error: "Failed to load voice bio" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // SEC-01: mutating route — no-op in open demo mode, 401 when FERRIX_API_TOKEN is set.
  const authGuard = requireMutatingAuth(req);
  if (authGuard) return authGuard;

  // SEC-03: per-IP fixed window — uploads are heavier than chat, stay generous.
  const gate = rateLimit(`voice-bio:${clientIp(req)}`, 30, 60_000);
  if (!gate.ok) return tooManyRequests(gate.retryAfter);

  try {
    // Read as text first so the size cap answers 413 before anything else;
    // malformed JSON still becomes a 400 (BE-02) — never a 500.
    const rawText = await req.text();
    if (rawText.length > MAX_BODY_CHARS) {
      return NextResponse.json(
        { error: "Voice bio too large (max 1.5MB)" },
        { status: 413 }
      );
    }

    let raw: unknown;
    try {
      raw = JSON.parse(rawText);
    } catch {
      return badRequest("Invalid JSON body");
    }

    // SEC-02: zod contract — audio must be a data:audio/ URL within size limits.
    const parsed = validateBody(voiceBioSchema, raw);
    if (parsed.res) return parsed.res;
    const { candidateId, audio } = parsed.data;

    // BE-01: unknown candidateId → 404 instead of a Prisma FK 500.
    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const updated = await db.candidate.update({
      where: { id: candidateId },
      data: { voiceBio: audio },
      select: { id: true, voiceBio: true, updatedAt: true },
    });

    return NextResponse.json({
      ok: true,
      hasVoiceBio: Boolean(updated.voiceBio),
      audio: updated.voiceBio ?? null,
      createdAt: updated.updatedAt,
    });
  } catch (err) {
    console.error("[voice-bio POST] error:", err);
    return NextResponse.json({ error: "Failed to save voice bio" }, { status: 500 });
  }
}
