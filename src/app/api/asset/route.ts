import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  CATALOG_SYSTEM_PROMPT,
  CV_SYSTEM_PROMPT,
  llmChat,
  type StructuredProfile,
} from "@/lib/ai";

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
  try {
    const { candidateId, kind } = await req.json();
    if (!candidateId || !["catalog", "cv"].includes(kind))
      return NextResponse.json({ error: "candidateId and kind required" }, { status: 400 });

    const candidate = await db.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate?.profile) return NextResponse.json({ error: "Profile the candidate first" }, { status: 400 });

    const profile = JSON.parse(candidate.profile) as StructuredProfile;
    const system = kind === "catalog" ? CATALOG_SYSTEM_PROMPT : CV_SYSTEM_PROMPT;

    const text =
      (await llmChat(
        [
          { role: "assistant", content: system },
          { role: "user", content: JSON.stringify(profile, null, 2) },
        ],
        12000
      )) ?? (kind === "catalog" ? catalogFallback(profile) : cvFallback(profile));

    return NextResponse.json({ text, mode: text ? "generated" : "fallback" });
  } catch (err) {
    console.error("[asset] error:", err);
    return NextResponse.json({ error: "Asset generation failed" }, { status: 500 });
  }
}
