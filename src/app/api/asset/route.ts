import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  CATALOG_SYSTEM_PROMPT,
  CV_SYSTEM_PROMPT,
  llmChat,
  type StructuredProfile,
} from "@/lib/ai";
import { assetSchema, safeJson, safeParseJson, validateBody } from "@/lib/validate";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const catalogFallback = (profile: StructuredProfile): string =>
  [
    `${profile.name}'s fresh stock is ready!`,
    profile.tags.includes("sewing")
      ? "- School uniforms (measured) — KSh 900\n- Kitenge dress (made to order) — KSh 2,200\n- Repairs & alterations — from KSh 150"
      : profile.tags.includes("driving")
        ? "- Same-day parcel runs across town — from KSh 300\n- Office document delivery — KSh 250\n- Weekly business rates available"
        : "- Today's fresh stock just arrived — from KSh 30\n- Bulk prices for hotels & eateries\n- Free delivery for orders above KSh 500",
    "Repyo hii message for prices. Karibu!",
  ].join("\n");

const cvFallback = (profile: StructuredProfile): string =>
  [
    profile.name.toUpperCase(),
    profile.summary,
    `Skills: ${profile.skills.join(", ")}`,
    `Experience: ${profile.experience}`,
    `Availability: ${profile.availability}`,
    "Contact: +254 7•• ••• •••",
  ].join("\n");

export async function POST(req: NextRequest) {
  // SEC-03: per-IP fixed window — 20 req/min.
  const gate = rateLimit(`asset:${clientIp(req)}`, 20, 60_000);
  if (!gate.ok) return tooManyRequests(gate.retryAfter);

  try {
    // BE-02: malformed JSON → 400.
    const raw = await safeJson(req);
    if (raw === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // SEC-02: zod contract — candidateId required, kind enum.
    const parsed = validateBody(assetSchema, raw);
    if (parsed.res) return parsed.res;
    const { candidateId, kind } = parsed.data;

    const candidate = await db.candidate.findUnique({ where: { id: candidateId } });
    // BE-08: split the checks — missing candidate is 404; unprofiled is 400.
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    if (!candidate.profile) {
      return NextResponse.json({ error: "Profile the candidate first" }, { status: 400 });
    }

    // BE-13: guarded parse — a corrupt stored profile can no longer 500 the route.
    const profile = safeParseJson<StructuredProfile | null>(candidate.profile, null);
    if (!profile) {
      return NextResponse.json({ error: "Profile the candidate first" }, { status: 400 });
    }

    const system = kind === "catalog" ? CATALOG_SYSTEM_PROMPT : CV_SYSTEM_PROMPT;

    // BE-07: track the LLM result so the fallback is never mislabeled "generated".
    const llm = await llmChat(
      [
        { role: "assistant", content: system },
        { role: "user", content: JSON.stringify(profile, null, 2) },
      ],
      12000
    );
    const text = llm ?? (kind === "catalog" ? catalogFallback(profile) : cvFallback(profile));

    return NextResponse.json({ text, mode: llm ? "generated" : "fallback" });
  } catch (err) {
    console.error("[asset] error:", err);
    return NextResponse.json({ error: "Asset generation failed" }, { status: 500 });
  }
}
