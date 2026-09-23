import { Prisma } from "@prisma/client";
import { safeParseJson } from "@/lib/validate";
import type { StructuredProfile } from "@/lib/ai";

// Shared serializer so GET /api/cases and GET /api/cases/[id] return the exact
// same case shape the coordinator detail view consumes (BE-17).

export type CaseWithRelations = Prisma.CaseGetPayload<{
  include: {
    candidate: {
      include: { matches: { include: { opportunity: true } } };
    };
    events: true;
  };
}>;

export function serializeCase(c: CaseWithRelations) {
  return {
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
      skills: safeParseJson<string[]>(c.candidate.skills, []),
      experience: c.candidate.experience,
      digitalLiteracy: c.candidate.digitalLiteracy,
      availability: c.candidate.availability,
      goal: c.candidate.goal,
      constraints: safeParseJson<string[]>(c.candidate.constraints, []),
      aiSummary: c.candidate.aiSummary,
      confidence: c.candidate.confidence,
      profile: c.candidate.profile
        ? safeParseJson<StructuredProfile | null>(c.candidate.profile, null)
        : null,
    },
    matches: c.candidate.matches.map((m) => ({
      id: m.id,
      score: m.score,
      reasons: safeParseJson<string[]>(m.reasons, []),
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
  };
}
