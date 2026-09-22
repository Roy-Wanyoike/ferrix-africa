import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { personaByKey } from "@/lib/data";
import { ANALYZE_SYSTEM_PROMPT, extractJson, llmChat, type StructuredProfile } from "@/lib/ai";
import { rankOpportunities } from "@/lib/matcher";

export const dynamic = "force-dynamic";

const fallbackProfile = (
  baseline: ReturnType<typeof personaByKey> extends infer P ? P : never,
  spokenName: string | null
): StructuredProfile => {
  const p = baseline;
  return {
    name: spokenName || p?.name || "Friend",
    summary: p ? `${p.label} in Nairobi — ready for the next step` : "Informal worker ready for the next step",
    skills: p
      ? p.baseline.skills.map((s) =>
          s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        )
      : ["Customer service", "Sales"],
    tags: p?.baseline.skills ?? ["customer-service"],
    experience: p?.baseline.experience ?? "Informal work experience",
    digitalLiteracy: p?.baseline.digitalLiteracy ?? "Smartphone basics",
    availability: p?.key === "boda" ? "Daytime, Mon–Sat" : "Flexible daytime",
    goal: p?.baseline.goal ?? "Steadier income",
    constraints: p?.baseline.constraints ?? [],
    confidence: 0.78,
    aiSummary: p
      ? `${spokenName || p.name} — ${p.label.toLowerCase()} in ${p.location}. Strengths: ${p.baseline.skills
          .slice(0, 3)
          .join(", ")}. Goal: ${p.baseline.goal}. Recommend human verification of ID and stated experience before placement.`
      : "Profile built from conversation. Recommend human verification before placement.",
    verificationFlags: ["ID document", "Stated experience"],
  };
};

export async function POST(req: NextRequest) {
  try {
    const { candidateId } = await req.json();
    if (!candidateId) return NextResponse.json({ error: "candidateId required" }, { status: 400 });

    const candidate = await db.candidate.findUnique({
      where: { id: candidateId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    const persona = personaByKey(candidate.persona);

    const transcript = candidate.messages
      .map((m) => `${m.role === "user" ? "User" : "Copilot"}: ${m.content}`)
      .join("\n");

    const raw = await llmChat(
      [
        { role: "assistant", content: ANALYZE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Transcript:\n${transcript}\n\nProduce the JSON profile now.${
            persona ? ` The user resembles persona "${persona.label}" — use it only as context, transcript wins.` : ""
          }`,
        },
      ],
      14000
    );

    const parsed = extractJson<Partial<StructuredProfile>>(raw);

    let profile: StructuredProfile;
    if (parsed && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
      profile = {
        name: parsed.name || persona?.name || "Friend",
        summary: parsed.summary || `${persona?.label ?? "Worker"} — ready for the next step`,
        skills: parsed.skills.slice(0, 8),
        tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags.slice(0, 10) : persona?.baseline.skills ?? ["customer-service"],
        experience: parsed.experience || persona?.baseline.experience || "",
        digitalLiteracy: parsed.digitalLiteracy || persona?.baseline.digitalLiteracy || "",
        availability: parsed.availability || "Flexible",
        goal: parsed.goal || persona?.baseline.goal || "",
        constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
        confidence: typeof parsed.confidence === "number" ? Math.min(0.99, Math.max(0.3, parsed.confidence)) : 0.8,
        aiSummary: parsed.aiSummary || "Profile structured from conversation.",
        verificationFlags: Array.isArray(parsed.verificationFlags) && parsed.verificationFlags.length
          ? parsed.verificationFlags
          : ["ID document"],
      };
    } else {
      // Fallback: derive from persona baseline (demo-safe)
      const fb = fallbackProfile(persona, candidate.name);
      profile = fb;
    }

    // Persist profile
    await db.candidate.update({
      where: { id: candidateId },
      data: {
        name: profile.name,
        skills: JSON.stringify(profile.skills),
        experience: profile.experience,
        digitalLiteracy: profile.digitalLiteracy,
        availability: profile.availability,
        goal: profile.goal,
        constraints: JSON.stringify(profile.constraints),
        aiSummary: profile.aiSummary,
        confidence: profile.confidence,
        profile: JSON.stringify(profile),
        status: "assessed",
      },
    });

    // Match against opportunities (deterministic, explainable)
    const opps = await db.opportunity.findMany({ where: { active: true } });
    const scored = rankOpportunities(
      profile,
      opps.map((o) => ({
        id: o.id,
        title: o.title,
        type: o.type,
        provider: o.provider,
        location: o.location,
        payRange: o.payRange,
        duration: o.duration,
        description: o.description,
        tags: JSON.parse(o.tags || "[]") as string[],
        actionUrl: o.actionUrl,
      })),
      4
    );

    await db.match.deleteMany({ where: { candidateId } });
    for (const m of scored) {
      await db.match.create({
        data: {
          candidateId,
          opportunityId: m.id,
          score: m.score,
          reasons: JSON.stringify(m.reasons),
        },
      });
    }

    // Create the case for human handoff
    const caseCount = await db.case.count();
    const ref = `AJR-${1000 + caseCount + 1}`;
    const newCase = await db.case.create({
      data: {
        ref,
        candidateId,
        priority: persona?.baseline.priority ?? "normal",
        status: "new",
        request: profile.goal,
      },
    });

    await db.caseEvent.create({
      data: {
        caseId: newCase.id,
        actor: "AI",
        action: "structured",
        detail: `AI structured the request: ${profile.summary} — confidence ${profile.confidence.toFixed(2)}`,
      },
    });
    await db.caseEvent.create({
      data: {
        caseId: newCase.id,
        actor: "System",
        action: "note",
        detail: "Awaiting mentor assignment. Human verification required before any placement.",
      },
    });

    return NextResponse.json({
      profile,
      matches: scored.map((m) => ({
        id: m.id,
        score: m.score,
        reasons: m.reasons,
        opportunity: {
          id: m.id,
          title: m.title,
          type: m.type,
          provider: m.provider,
          location: m.location,
          payRange: m.payRange,
          duration: m.duration,
          description: m.description,
        },
      })),
      case: {
        id: newCase.id,
        ref: newCase.ref,
        priority: newCase.priority,
        status: newCase.status,
        request: newCase.request,
      },
      mode: parsed ? "live" : "fallback",
    });
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json({ error: "Analyze failed" }, { status: 500 });
  }
}
