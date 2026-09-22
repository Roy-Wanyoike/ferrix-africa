import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [candidates, cases, events] = await Promise.all([
      db.candidate.findMany({ where: { profile: { not: null } } }),
      db.case.findMany({ include: { events: { orderBy: { createdAt: "asc" } } } }),
      db.caseEvent.findMany({ where: { actor: "Coordinator" } }),
    ]);

    const placements = cases.filter((c) => ["placed", "resolved"].includes(c.status)).length;
    const resolved = cases.filter((c) => c.status === "resolved").length;

    // Median first human contact (hours from case creation to first Coordinator event)
    const contactHours: number[] = [];
    for (const c of cases) {
      const firstHuman = c.events.find((e) => e.actor === "Coordinator");
      if (firstHuman) {
        const diff =
          (new Date(firstHuman.createdAt).getTime() - new Date(c.createdAt).getTime()) /
          3600000;
        if (diff >= 0) contactHours.push(diff);
      }
    }
    contactHours.sort((a, b) => a - b);
    const median =
      contactHours.length === 0
        ? null
        : contactHours.length % 2 === 1
          ? contactHours[(contactHours.length - 1) / 2]
          : (contactHours[contactHours.length / 2 - 1] + contactHours[contactHours.length / 2]) / 2;

    const medianLabel =
      median === null
        ? "—"
        : median < 1
          ? `${Math.round(median * 60)} min`
          : median < 48
            ? `${median.toFixed(median < 10 ? 1 : 0)} hrs`
            : `${Math.round(median / 24)} days`;

    return NextResponse.json({
      candidatesAssessed: candidates.length,
      placements,
      resolved,
      medianFirstContact: medianLabel,
      humanVerifiedActions: events.length,
    });
  } catch (err) {
    console.error("[stats] error:", err);
    return NextResponse.json({ error: "Stats failed" }, { status: 500 });
  }
}
