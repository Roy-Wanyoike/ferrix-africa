// Seed the demo dataset: opportunities + a lively case queue + track records.
// Run: bun run scripts/seed.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { OPPORTUNITIES } from "../src/lib/data";

const db = new PrismaClient();

async function main() {
  console.log("Seeding…");

  // BE-15: the whole wipe+create seed runs atomically — a mid-run failure now
  // rolls back instead of leaving a half-empty demo database.
  await db.$transaction(
    (tx) => seedAll(tx),
    { timeout: 30_000, maxWait: 10_000 }
  );
}

// All writes run inside the caller's transaction; `db` here is the tx client.
async function seedAll(db: Prisma.TransactionClient) {
  // Wipe demo state (idempotent reseed)
  await db.trackRecordEntry.deleteMany();
  await db.caseEvent.deleteMany();
  await db.case.deleteMany();
  await db.match.deleteMany();
  await db.message.deleteMany();
  await db.candidate.deleteMany();
  await db.opportunity.deleteMany();

  const oppRows: Record<string, string> = {};
  for (const o of OPPORTUNITIES) {
    const row = await db.opportunity.create({
      data: {
        title: o.title,
        type: o.type,
        provider: o.provider,
        location: o.location,
        payRange: o.payRange,
        duration: o.duration ?? null,
        description: o.description,
        tags: JSON.stringify(o.tags),
        actionUrl: o.actionUrl ?? null,
      },
    });
    oppRows[o.title] = row.id;
  }
  console.log(`Seeded ${OPPORTUNITIES.length} opportunities`);

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000);

  // ---- Demo case 1: RESOLVED placement (full audit trail) ----
  const c1 = await db.candidate.create({
    data: {
      name: "Joseph Kariuki",
      phone: "+254 7•• ••• 118",
      language: "en",
      persona: "boda",
      personaLabel: "Boda rider",
      location: "Makadara, Nairobi",
      status: "placed",
      skills: JSON.stringify(["Riding & delivery", "City navigation", "Customer service", "M-Pesa handling"]),
      experience: "4 years boda rider, own motorcycle",
      digitalLiteracy: "Smartphone, Google Maps, WhatsApp fluent",
      availability: "Daytime, Mon–Sat",
      goal: "Steadier delivery income",
      constraints: JSON.stringify([]),
      aiSummary:
        "Experienced boda rider with own motorcycle, strong route knowledge of Eastlands. Delivery-platform ready; verify ID and helmet. Good fit for daytime courier routes.",
      confidence: 0.91,
      profile: JSON.stringify({
        name: "Joseph Kariuki",
        summary: "Boda rider seeking steadier delivery income",
        skills: ["Riding & delivery", "City navigation", "Customer service", "M-Pesa handling"],
        tags: ["driving", "delivery", "navigation", "customer-service", "mobile-money", "swahili"],
        experience: "4 years boda rider, own motorcycle",
        digitalLiteracy: "Smartphone, Google Maps, WhatsApp fluent",
        availability: "Daytime, Mon–Sat",
        goal: "Steadier delivery income",
        constraints: [],
        confidence: 0.91,
        verificationFlags: ["ID document", "Motorcycle ownership"],
      }),
      createdAt: hoursAgo(72),
    },
  });
  await db.match.create({
    data: {
      candidateId: c1.id,
      opportunityId: oppRows["Estate Courier Rider"],
      score: 0.93,
      reasons: JSON.stringify([
        "Uses your strengths: Driving, Delivery, Navigation",
        "Direct path to steadier daily income",
      ]),
    },
  });
  const case1 = await db.case.create({
    data: {
      ref: "AJR-1001",
      candidateId: c1.id,
      priority: "normal",
      status: "placed",
      request: "Steadier delivery income",
      assignedTo: "Wanjiku M. (Ujuzi Hub)",
      createdAt: hoursAgo(70),
    },
  });
  const ev1: [string, string, string, number][] = [
    ["AI", "structured", "AI structured the request: delivery-ready rider, 0.91 confidence", 70],
    ["System", "assigned", "Auto-assigned to Wanjiku M. (Ujuzi Hub) — Eastlands coverage", 69.8],
    ["Coordinator", "accepted", "Case accepted. ID and helmet to be verified on call", 68],
    ["Coordinator", "contacted", "Called candidate. Verified ID, helmet and smartphone. Confirmed daytime availability", 46],
    ["Coordinator", "placed", "Placed: Estate Courier Rider (Wasili Deliveries) — KSh 700–1,200/day, daytime routes", 24],
  ];
  for (const [actor, action, detail, h] of ev1) {
    await db.caseEvent.create({
      data: { caseId: case1.id, actor, action, detail, createdAt: hoursAgo(h) },
    });
  }

  // Track record: Joseph has a verified placement + review + prior training
  await db.trackRecordEntry.create({
    data: {
      candidateId: c1.id,
      kind: "PLACEMENT",
      title: "Estate Courier Rider",
      org: "Wasili Deliveries",
      detail: "Placed after ID and helmet verification. Daytime estate-to-CBD routes.",
      verified: true,
      verifiedBy: "Wanjiku M. (Ujuzi Hub)",
      occurredAt: hoursAgo(24),
    },
  });
  await db.trackRecordEntry.create({
    data: {
      candidateId: c1.id,
      kind: "REVIEW",
      title: "Reliability review — trial week",
      org: "Wasili Deliveries",
      detail: "41 deliveries, 95% on-time, zero parcel losses. Dispatcher would rehire.",
      rating: 5,
      verified: true,
      verifiedBy: "Wanjiku M. (Ujuzi Hub)",
      occurredAt: hoursAgo(26),
    },
  });
  await db.trackRecordEntry.create({
    data: {
      candidateId: c1.id,
      kind: "TRAINING",
      title: "Rider Safety & Road Signage",
      org: "Ajira Digital (demo partner feed)",
      detail: "Completed certificate. Safe-riding module passed first attempt.",
      verified: true,
      verifiedBy: "Ajira Digital records check",
      occurredAt: hoursAgo(24 * 34),
    },
  });

  // ---- Demo case 2: CONTACTED (mid-workflow) ----
  const c2 = await db.candidate.create({
    data: {
      name: "Fatuma Hassan",
      phone: "+254 7•• ••• 590",
      language: "sw",
      persona: "mama_mboga",
      personaLabel: "Mama mboga — market vendor",
      location: "Eastleigh, Nairobi",
      status: "contacted",
      skills: JSON.stringify(["Customer service", "Pricing & negotiation", "Stock management", "M-Pesa handling"]),
      experience: "6 years selling vegetables in Eastleigh open market",
      digitalLiteracy: "WhatsApp voice notes + M-Pesa; low typing confidence",
      availability: "Market mornings, free after 2pm",
      goal: "Take WhatsApp orders beyond the stall",
      constraints: JSON.stringify(["data-cost", "typing-confidence"]),
      aiSummary:
        "Seasoned produce trader with strong pricing and supplier relationships. Wants WhatsApp ordering; voice-first user, avoid text-heavy tools. Verify stall permit and M-Pesa line ownership.",
      confidence: 0.87,
      profile: JSON.stringify({
        name: "Fatuma Hassan",
        summary: "Produce trader moving sales to WhatsApp ordering",
        skills: ["Customer service", "Pricing & negotiation", "Stock management", "M-Pesa handling"],
        tags: ["customer-service", "sales", "pricing", "stock-management", "mobile-money", "swahili", "whatsapp"],
        experience: "6 years selling vegetables in Eastleigh open market",
        digitalLiteracy: "WhatsApp voice notes + M-Pesa; low typing confidence",
        availability: "Market mornings, free after 2pm",
        goal: "Take WhatsApp orders beyond the stall",
        constraints: ["data-cost", "typing-confidence"],
        confidence: 0.87,
        verificationFlags: ["Market stall permit", "M-Pesa line ownership"],
      }),
      createdAt: hoursAgo(50),
    },
  });
  await db.match.create({
    data: {
      candidateId: c2.id,
      opportunityId: oppRows["Sell Online with WhatsApp Catalogs"],
      score: 0.95,
      reasons: JSON.stringify([
        "Uses your strengths: WhatsApp, Sales, Pricing, M-Pesa",
        "Helps you grow your own business",
        "Free — no upfront cost",
      ]),
    },
  });
  const case2 = await db.case.create({
    data: {
      ref: "AJR-1002",
      candidateId: c2.id,
      priority: "normal",
      status: "contacted",
      request: "Take WhatsApp orders beyond the stall",
      assignedTo: "Wanjiku M. (Ujuzi Hub)",
      createdAt: hoursAgo(49),
    },
  });
  const ev2: [string, string, string, number][] = [
    ["AI", "structured", "AI structured the request: WhatsApp-commerce ready trader, 0.87 confidence", 49],
    ["System", "assigned", "Auto-assigned to Wanjiku M. (Ujuzi Hub) — Eastlands coverage", 48.7],
    ["Coordinator", "accepted", "Case accepted. Confirm stall permit on visit", 30],
    ["Coordinator", "contacted", "Voice call done (Swahili). She prefers voice notes; enrollment in catalog course scheduled Thursday", 12],
  ];
  for (const [actor, action, detail, h] of ev2) {
    await db.caseEvent.create({
      data: { caseId: case2.id, actor, action, detail, createdAt: hoursAgo(h) },
    });
  }

  // Track record: Fatuma just started a training
  await db.trackRecordEntry.create({
    data: {
      candidateId: c2.id,
      kind: "TRAINING",
      title: "Sell Online with WhatsApp Catalogs",
      org: "Ajira Digital (demo partner feed)",
      detail: "Enrolled with data stipend. Module 2 of 5 complete.",
      verified: true,
      verifiedBy: "Wanjiku M. (Ujuzi Hub)",
      occurredAt: hoursAgo(12),
    },
  });

  // ---- Demo case 3: NEW, HIGH priority ----
  const c3 = await db.candidate.create({
    data: {
      name: "Grace Wanjiru",
      phone: "+254 7•• ••• 356",
      language: "en",
      persona: "cashier",
      personaLabel: "Supermarket cashier (at automation risk)",
      location: "Kasarani, Nairobi",
      status: "assessed",
      skills: JSON.stringify(["POS operation", "Cash handling & reconciliation", "Inventory counts", "Customer service"]),
      experience: "5 years supermarket cashier; end-of-day reconciliation trusted",
      digitalLiteracy: "POS + smartphone confident; email & spreadsheets basics",
      availability: "Daytime only",
      goal: "Move into digital-facing role before self-checkout replaces tills",
      constraints: JSON.stringify(["daytime-only"]),
      aiSummary:
        "Displaced-soon cashier with clean cash-handling record and POS fluency. High automation exposure (store installing self-checkout next quarter). Best fit: floor supervision or M-Pesa agency. Verify employment status and notice period.",
      confidence: 0.89,
      profile: JSON.stringify({
        name: "Grace Wanjiru",
        summary: "Cashier facing self-checkout automation, seeking digital-facing role",
        skills: ["POS operation", "Cash handling & reconciliation", "Inventory counts", "Customer service"],
        tags: ["pos", "cash-handling", "inventory", "customer-service", "data-entry", "english", "swahili"],
        experience: "5 years supermarket cashier; end-of-day reconciliation trusted",
        digitalLiteracy: "POS + smartphone confident; email & spreadsheets basics",
        availability: "Daytime only",
        goal: "Move into digital-facing role before self-checkout replaces tills",
        constraints: ["daytime-only"],
        confidence: 0.89,
        verificationFlags: ["Current employment status", "Notice period", "ID document"],
      }),
      createdAt: hoursAgo(6),
    },
  });
  await db.match.create({
    data: {
      candidateId: c3.id,
      opportunityId: oppRows["Supermarket Floor Supervisor"],
      score: 0.94,
      reasons: JSON.stringify([
        "Uses your strengths: POS, Inventory, Customer service",
        "A formal job matching your experience",
      ]),
    },
  });
  await db.match.create({
    data: {
      candidateId: c3.id,
      opportunityId: oppRows["M-Pesa Shop Attendant"],
      score: 0.88,
      reasons: JSON.stringify([
        "Uses your strengths: Cash handling, Customer service",
        "Direct path to steadier daily income",
      ]),
    },
  });
  const case3 = await db.case.create({
    data: {
      ref: "AJR-1003",
      candidateId: c3.id,
      priority: "high",
      status: "new",
      request: "Move into digital-facing role before self-checkout replaces tills",
      createdAt: hoursAgo(6),
    },
  });
  await db.caseEvent.create({
    data: {
      caseId: case3.id,
      actor: "AI",
      action: "structured",
      detail: "AI structured the request: automation-exposed cashier, 0.89 confidence — flagged HIGH priority",
      createdAt: hoursAgo(6),
    },
  });
  await db.caseEvent.create({
    data: {
      caseId: case3.id,
      actor: "System",
      action: "note",
      detail: "Awaiting mentor assignment — Kasarani coverage requested",
      createdAt: hoursAgo(5.9),
    },
  });
  // Grace is brand new — empty track record (shows the "start your passport" state)

  // ---- Demo case 4: RESOLVED (older, shows steady volume) ----
  const c4 = await db.candidate.create({
    data: {
      name: "Otieno Odhiambo",
      phone: "+254 7•• ••• 642",
      language: "en",
      persona: "fundi",
      personaLabel: "Jua kali fundi — tailor",
      location: "Kamukunji, Nairobi",
      status: "resolved",
      skills: JSON.stringify(["Tailoring", "Design & alterations", "Pricing", "Customer service"]),
      experience: "12 years tailoring; school uniforms and kitenge wear",
      digitalLiteracy: "WhatsApp calls; low typing confidence",
      availability: "Workshop 8am–6pm",
      goal: "School uniform contracts and online orders",
      constraints: JSON.stringify(["photos", "data-cost"]),
      aiSummary:
        "Master tailor with 12 years experience, seeking school contracts. Needs photo/catalog support; voice-first. Verify workshop address and sample quality.",
      confidence: 0.84,
      profile: JSON.stringify({
        name: "Otieno Odhiambo",
        summary: "Master tailor seeking school uniform contracts",
        skills: ["Tailoring", "Design & alterations", "Pricing", "Customer service"],
        tags: ["sewing", "design", "alterations", "pricing", "customer-service", "swahili"],
        experience: "12 years tailoring; school uniforms and kitenge wear",
        digitalLiteracy: "WhatsApp calls; low typing confidence",
        availability: "Workshop 8am–6pm",
        goal: "School uniform contracts and online orders",
        constraints: ["photos", "data-cost"],
        confidence: 0.84,
        verificationFlags: ["Workshop address", "Sample quality check"],
      }),
      createdAt: hoursAgo(160),
    },
  });
  await db.match.create({
    data: {
      candidateId: c4.id,
      opportunityId: oppRows["School Uniform Micro-Contract"],
      score: 0.96,
      reasons: JSON.stringify([
        "Uses your strengths: Sewing, Design, Pricing",
        "Helps you grow your own business",
      ]),
    },
  });
  const case4 = await db.case.create({
    data: {
      ref: "AJR-1004",
      candidateId: c4.id,
      priority: "low",
      status: "resolved",
      request: "School uniform contracts and online orders",
      assignedTo: "Kamau N. (Kamukunji CBO)",
      createdAt: hoursAgo(158),
    },
  });
  const ev4: [string, string, string, number][] = [
    ["AI", "structured", "AI structured the request: master tailor, contract-ready, 0.84 confidence", 158],
    ["System", "assigned", "Auto-assigned to Kamau N. (Kamukunji CBO)", 157],
    ["Coordinator", "accepted", "Case accepted", 150],
    ["Coordinator", "contacted", "Visited workshop; samples verified, measurements process confirmed", 120],
    ["Coordinator", "placed", "Placed: School Uniform Micro-Contract (Kamukunji school cluster) — per-piece KSh 150–400", 96],
    ["Coordinator", "resolved", "First 20 uniform pieces delivered and paid. Case closed with repeat order booked", 72],
  ];
  for (const [actor, action, detail, h] of ev4) {
    await db.caseEvent.create({
      data: { caseId: case4.id, actor, action, detail, createdAt: hoursAgo(h) },
    });
  }

  // Track record: Otieno has a completed contract + review
  await db.trackRecordEntry.create({
    data: {
      candidateId: c4.id,
      kind: "PLACEMENT",
      title: "School Uniform Micro-Contract",
      org: "Kamukunji school cluster",
      detail: "20 pieces delivered and paid. Repeat order booked for May intake.",
      verified: true,
      verifiedBy: "Kamau N. (Kamukunji CBO)",
      occurredAt: hoursAgo(96),
    },
  });
  await db.trackRecordEntry.create({
    data: {
      candidateId: c4.id,
      kind: "REVIEW",
      title: "Quality review — uniform batch",
      org: "Kamukunji school cluster",
      detail: "Zero rejections across 20 pieces. Sizes and stitching to spec.",
      rating: 5,
      verified: true,
      verifiedBy: "Kamau N. (Kamukunji CBO)",
      occurredAt: hoursAgo(74),
    },
  });

  const counts = await Promise.all([
    db.opportunity.count(),
    db.candidate.count(),
    db.case.count(),
    db.trackRecordEntry.count(),
  ]);
  console.log(
    `Seed done: ${counts[0]} opportunities, ${counts[1]} candidates, ${counts[2]} cases, ${counts[3]} track-record entries`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
