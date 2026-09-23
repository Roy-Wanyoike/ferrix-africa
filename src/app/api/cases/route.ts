import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeCase } from "@/lib/serialize";

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

    // BE-13: JSON-string columns are parsed through safeParseJson inside the
    // shared serializer — a corrupt row can no longer 500 the whole list.
    return NextResponse.json({ cases: cases.map(serializeCase) });
  } catch (err) {
    console.error("[cases] error:", err);
    return NextResponse.json({ error: "Failed to load cases" }, { status: 500 });
  }
}
