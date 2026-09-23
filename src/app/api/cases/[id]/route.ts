import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeCase } from "@/lib/serialize";
import { casePatchSchema, safeJson, validateBody } from "@/lib/validate";

export const dynamic = "force-dynamic";

const MENTOR = "Wanjiku M. (Ujuzi Hub)";

// BE-04: strict state machine — action → the status a case must be in to run it.
const TRANSITIONS: Record<"accept" | "contact" | "place" | "resolve", string> = {
  accept: "new",
  contact: "accepted",
  place: "contacted",
  resolve: "placed",
};

// BE-17: GET detail — same case shape as GET /api/cases (coordinator detail).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const found = await db.case.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            matches: { include: { opportunity: true }, orderBy: { score: "desc" } },
          },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!found) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json({ case: serializeCase(found) });
  } catch (err) {
    console.error("[case get] error:", err);
    return NextResponse.json({ error: "Failed to load case" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // BE-02: malformed JSON → 400.
    const raw = await safeJson(req);
    if (raw === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // SEC-02: zod contract — action enum ("Unknown action" for bad values).
    const parsed = validateBody(casePatchSchema, raw);
    if (parsed.res) return parsed.res;
    const body = parsed.data;
    const action = body.action;

    const existing = await db.case.findUnique({
      where: { id },
      include: { candidate: true },
    });
    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    // BE-04/BE-05: enforce the transition map before any write.
    let status = existing.status;
    const events: { actor: string; action: string; detail: string }[] = [];
    const note = body.note?.trim() || null;

    if (action === "note") {
      if (!note) return NextResponse.json({ error: "note required" }, { status: 400 });
      events.push({ actor: "Coordinator", action: "note", detail: note });
    } else {
      const required = TRANSITIONS[action];
      if (action === "place" && existing.status === "placed") {
        return NextResponse.json({ error: "Case already placed" }, { status: 409 });
      }
      if (action === "resolve" && existing.status === "resolved") {
        return NextResponse.json({ error: "Case already resolved" }, { status: 409 });
      }
      if (existing.status !== required) {
        return NextResponse.json(
          { error: `Invalid transition: ${action} requires status ${required}` },
          { status: 400 }
        );
      }
      status =
        action === "accept"
          ? "accepted"
          : action === "contact"
            ? "contacted"
            : action === "place"
              ? "placed"
              : "resolved";
    }

    // Resolve the opportunity before the transaction (read-only, fail fast).
    let opp: { title: string; provider: string; payRange: string } | null = null;
    if (action === "place") {
      if (!body.opportunityId) {
        return NextResponse.json(
          { error: "opportunityId required for placement" },
          { status: 400 }
        );
      }
      const foundOpp = await db.opportunity.findUnique({
        where: { id: body.opportunityId },
      });
      if (!foundOpp) {
        return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
      }
      opp = { title: foundOpp.title, provider: foundOpp.provider, payRange: foundOpp.payRange };
    }

    // BE-16: the multi-write workflow runs in one transaction — no partial state.
    const finalStatus = await db.$transaction(async (tx) => {
      switch (action) {
        case "accept": {
          await tx.case.update({ where: { id }, data: { assignedTo: MENTOR } });
          events.push({
            actor: "System",
            action: "assigned",
            detail: `Assigned to ${MENTOR} — coverage area ${existing.candidate.location ?? "Nairobi"}`,
          });
          events.push({
            actor: "Coordinator",
            action: "accepted",
            detail: "Case accepted. Verification checklist opened: ID, stated experience, availability.",
          });
          await tx.candidate.update({
            where: { id: existing.candidateId },
            data: { status: "accepted" },
          });
          break;
        }
        case "contact": {
          events.push({
            actor: "Coordinator",
            action: "contacted",
            detail:
              note ||
              `Contacted candidate via ${existing.candidate.language === "sw" ? "voice call (Swahili)" : "call/WhatsApp"}. Identity and availability confirmed.`,
          });
          await tx.candidate.update({
            where: { id: existing.candidateId },
            data: { status: "contacted" },
          });
          break;
        }
        case "place": {
          // opp is guaranteed non-null here (validated above).
          const opportunity = opp!;
          events.push({
            actor: "Coordinator",
            action: "placed",
            detail: `Placed: ${opportunity.title} (${opportunity.provider}) — ${opportunity.payRange}. Human-verified placement.`,
          });
          await tx.candidate.update({
            where: { id: existing.candidateId },
            data: { status: "placed" },
          });
          // Every human-verified placement builds the worker's portable track record.
          await tx.trackRecordEntry.create({
            data: {
              candidateId: existing.candidateId,
              kind: "PLACEMENT",
              title: opportunity.title,
              org: opportunity.provider.replace(/\s*\(demo[^)]*\)\s*/i, "").trim(),
              detail: `Placed: ${opportunity.title} — ${opportunity.payRange}. Human-verified by coordinator.`,
              verified: true,
              verifiedBy: existing.assignedTo || MENTOR,
            },
          });
          break;
        }
        case "resolve": {
          events.push({
            actor: "Coordinator",
            action: "resolved",
            detail: note || "Outcome confirmed with candidate. Case closed with follow-up scheduled.",
          });
          await tx.candidate.update({
            where: { id: existing.candidateId },
            data: { status: "resolved" },
          });
          break;
        }
        case "note": {
          // single-event action; nothing else to write
          break;
        }
      }

      for (const e of events) {
        await tx.caseEvent.create({ data: { caseId: id, ...e } });
      }

      await tx.case.update({ where: { id }, data: { status } });
      return status;
    });

    return NextResponse.json({ ok: true, caseId: id, status: finalStatus });
  } catch (err) {
    console.error("[case patch] error:", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
