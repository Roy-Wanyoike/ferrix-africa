import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cases = await db.case.findMany({
      include: {
        candidate: {
          include: {
            matches: { include: { opportunity: true }, orderBy: { score: "desc" } },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const payload = cases.map((c) => ({
      id: c.id,
      ref: c.ref,
      priority: c.priority,
      status: c.status,
      request: c.request,
      assignedTo: c.assignedTo,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      candidate: {
        id: c.candidate.id,
        name: c.candidate.name,
        phone: c.candidate.phone,
        personaLabel: c.candidate.personaLabel,
        location: c.candidate.location,
        language: c.candidate.language,
        skills: JSON.parse(c.candidate.skills || "[]") as string[],
        experience: c.candidate.experience,
        digitalLiteracy: c.candidate.digitalLiteracy,
        availability: c.candidate.availability,
        goal: c.candidate.goal,
        constraints: JSON.parse(c.candidate.constraints || "[]") as string[],
        aiSummary: c.candidate.aiSummary,
        confidence: c.candidate.confidence,
        profile: c.candidate.profile ? JSON.parse(c.candidate.profile) : null,
      },
      matches: c.candidate.matches.map((m) => ({
        id: m.id,
        score: m.score,
        reasons: JSON.parse(m.reasons || "[]") as string[],
        opportunity: {
          id: m.opportunity.id,
          title: m.opportunity.title,
          type: m.opportunity.type,
          provider: m.opportunity.provider,
          location: m.opportunity.location,
          payRange: m.opportunity.payRange,
          duration: m.opportunity.duration,
          description: m.opportunity.description,
        },
      })),
      events: c.events.map((e) => ({
        id: e.id,
        actor: e.actor,
        action: e.action,
        detail: e.detail,
        createdAt: e.createdAt,
      })),
    }));

    return NextResponse.json({ cases: payload });
  } catch (err) {
    console.error("[cases] error:", err);
    return NextResponse.json({ error: "Failed to load cases" }, { status: 500 });
  }
}
