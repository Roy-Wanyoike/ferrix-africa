import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MENTOR = "Wanjiku M. (Ujuzi Hub)";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = body.action as
      | "accept"
      | "contact"
      | "place"
      | "resolve"
      | "note";
    if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

    const existing = await db.case.findUnique({
      where: { id },
      include: { candidate: true },
    });
    if (!existing) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    let status = existing.status;
    const events: { actor: string; action: string; detail: string }[] = [];

    switch (action) {
      case "accept": {
        status = "accepted";
        await db.case.update({ where: { id }, data: { assignedTo: MENTOR } });
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
        await db.candidate.update({ where: { id: existing.candidateId }, data: { status: "accepted" } });
        break;
      }
      case "contact": {
        status = "contacted";
        events.push({
          actor: "Coordinator",
          action: "contacted",
          detail:
            body.note?.trim() ||
            `Contacted candidate via ${existing.candidate.language === "sw" ? "voice call (Swahili)" : "call/WhatsApp"}. Identity and availability confirmed.`,
        });
        await db.candidate.update({ where: { id: existing.candidateId }, data: { status: "contacted" } });
        break;
      }
      case "place": {
        if (!body.opportunityId)
          return NextResponse.json({ error: "opportunityId required for placement" }, { status: 400 });
        const opp = await db.opportunity.findUnique({ where: { id: body.opportunityId } });
        if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
        status = "placed";
        events.push({
          actor: "Coordinator",
          action: "placed",
          detail: `Placed: ${opp.title} (${opp.provider}) — ${opp.payRange}. Human-verified placement.`,
        });
        await db.candidate.update({
          where: { id: existing.candidateId },
          data: { status: "placed" },
        });
        // Every human-verified placement builds the worker's portable track record.
        await db.trackRecordEntry.create({
          data: {
            candidateId: existing.candidateId,
            kind: "PLACEMENT",
            title: opp.title,
            org: opp.provider.replace(/\s*\(demo[^)]*\)\s*/i, "").trim(),
            detail: `Placed: ${opp.title} — ${opp.payRange}. Human-verified by coordinator.`,
            verified: true,
            verifiedBy: existing.assignedTo || MENTOR,
          },
        });
        break;
      }
      case "resolve": {
        status = "resolved";
        events.push({
          actor: "Coordinator",
          action: "resolved",
          detail: body.note?.trim() || "Outcome confirmed with candidate. Case closed with follow-up scheduled.",
        });
        await db.candidate.update({ where: { id: existing.candidateId }, data: { status: "resolved" } });
        break;
      }
      case "note": {
        if (!body.note?.trim())
          return NextResponse.json({ error: "note required" }, { status: 400 });
        events.push({ actor: "Coordinator", action: "note", detail: body.note.trim() });
        break;
      }
    }

    for (const e of events) {
      await db.caseEvent.create({ data: { caseId: id, ...e } });
    }

    await db.case.update({ where: { id }, data: { status } });

    return NextResponse.json({ ok: true, caseId: id, status });
  } catch (err) {
    console.error("[case patch] error:", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
