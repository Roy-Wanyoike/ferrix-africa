// Seed the demo dataset: opportunities + a lively case queue.
// Run: bun run scripts/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const OPPORTUNITIES = [
  {
    title: "Sell Online with WhatsApp Catalogs",
    type: "COURSE",
    provider: "Ajira Digital (demo partner feed)",
    location: "Online + Kibera youth hub",
    payRange: "Free + data stipend",
    duration: "1 week, self-paced",
    description:
      "Set up a WhatsApp Business catalog, price your goods, take orders and broadcast weekly offers. Built for market traders.",
    tags: ["whatsapp", "sales", "pricing", "mobile-money", "marketing"],
    actionUrl: "https://ajira.digital",
  },
  {
    title: "Digital Marketing Basics",
    type: "COURSE",
    provider: "Ajira Digital (demo partner feed)",
    location: "Online",
    payRange: "Free",
    duration: "4 weeks",
    description:
      "Promote a real business on Facebook, WhatsApp and TikTok. Ends with a small portfolio and a certificate.",
    tags: ["marketing", "social-media", "whatsapp", "sales", "design"],
    actionUrl: "https://ajira.digital",
  },
  {
    title: "Virtual Assistant Starter",
    type: "COURSE",
    provider: "Ajira Digital (demo partner feed)",
    location: "Online",
    payRange: "Free",
    duration: "3 weeks",
    description:
      "Email, scheduling, typing and customer chat — the starter toolkit for online assistant work from home.",
    tags: ["typing", "english", "data-entry", "customer-service", "whatsapp"],
    actionUrl: "https://ajira.digital",
  },
  {
    title: "Data Entry & Transcription Foundations",
    type: "COURSE",
    provider: "eMobilis (demo partner feed)",
    location: "Online / CBD lab",
    payRange: "Free",
    duration: "2 weeks",
    description:
      "Typing speed, spreadsheets, and clean transcription habits. Gateway skill for online micro-work.",
    tags: ["typing", "data-entry", "english"],
  },
  {
    title: "Boda Delivery Partner",
    type: "GIG",
    provider: "Glovo (demo partner feed)",
    location: "Kilimani, CBD, Westlands",
    payRange: "KSh 900–1,600/day",
    duration: "Flexible shifts",
    description:
      "Food and parcel delivery on your own motorcycle. Requires ID, helmet and a smartphone. Weekly payouts to M-Pesa.",
    tags: ["driving", "delivery", "navigation", "customer-service", "mobile-money"],
  },
  {
    title: "Estate Courier Rider",
    type: "GIG",
    provider: "Wasili Deliveries (demo partner feed)",
    location: "South B/C, Lang'ata, Kibera edge",
    payRange: "KSh 700–1,200/day",
    duration: "Mon–Sat, daytime",
    description:
      "Documents and parcels between estates and CBD. Daytime routes that fit around other hustles.",
    tags: ["driving", "delivery", "navigation", "mobile-money"],
  },
  {
    title: "Catalog Seller (part-time)",
    type: "GIG",
    provider: "Ujuzi Hub partner shops",
    location: "Remote / home-based",
    payRange: "Commission, KSh 300–800/day",
    duration: "2–3 hrs/day",
    description:
      "Run WhatsApp catalogs and take orders for partner shops. Commission per confirmed order.",
    tags: ["whatsapp", "sales", "customer-service", "mobile-money"],
  },
  {
    title: "M-Pesa Shop Attendant",
    type: "JOB",
    provider: "Neighborhood agent, Kasarani (demo listing)",
    location: "Kasarani",
    payRange: "KSh 10,000–15,000/mo + commission",
    duration: "Full-time",
    description:
      "Handle deposits, withdrawals and float. Needs clean cash handling and patience with customers.",
    tags: ["mobile-money", "cash-handling", "customer-service", "swahili"],
  },
  {
    title: "Supermarket Floor Supervisor",
    type: "JOB",
    provider: "Freshmark Supermarkets (demo listing)",
    location: "Kasarani / Roysambu",
    payRange: "KSh 18,000–24,000/mo",
    duration: "Full-time",
    description:
      "Shelf planning, stock counts and supervising attendants. POS experience valued over certificates.",
    tags: ["inventory", "pos", "customer-service", "english", "stock-management"],
  },
  {
    title: "Online Transcription (entry level)",
    type: "MICROWORK",
    provider: "Global platforms (demo partner feed)",
    location: "Remote",
    payRange: "Pay per audio minute",
    duration: "Flexible nights",
    description:
      "Type out recordings — interviews, sermons, podcasts. Entry tests provided; earnings grow with accuracy.",
    tags: ["typing", "english", "data-entry"],
  },
  {
    title: "Social Media Manager — local shops",
    type: "MICROWORK",
    provider: "Direct clients (demo listing)",
    location: "Remote / client sites",
    payRange: "KSh 4,000–8,000/mo per client",
    duration: "Evenings",
    description:
      "Post 3x/week for a salon, butchery or hardware: photos, offers, WhatsApp replies. One phone, many shops.",
    tags: ["social-media", "marketing", "design", "whatsapp", "sales"],
  },
  {
    title: "School Uniform Micro-Contract",
    type: "GIG",
    provider: "Kamukunji school cluster (demo listing)",
    location: "Kamukunji / home workshop",
    payRange: "Per piece, KSh 150–400",
    duration: "Jan & May peaks",
    description:
      "Stitch school uniforms against measured orders. Two schools in the cluster are accepting new fundis via the hub.",
    tags: ["sewing", "design", "pricing", "negotiation"],
  },
  {
    title: "Canva Design for Small Business",
    type: "COURSE",
    provider: "eMobilis (demo partner feed)",
    location: "Online",
    payRange: "Free",
    duration: "3 weeks",
    description:
      "Flyers, price lists and product photos using free tools on a phone. Portfolio built on your own hustle.",
    tags: ["design", "marketing", "social-media", "photos"],
  },
  {
    title: "Home Catering for Office Lunches",
    type: "GIG",
    provider: "CBD office clusters (demo listing)",
    location: "Home kitchen + CBD delivery",
    payRange: "KSh 150–250/plate",
    duration: "Weekdays",
    description:
      "Cook chapati/pilau for 10–30 plates daily. The hub handles collection and delivery riders.",
    tags: ["cooking", "sales", "customer-service", "mobile-money", "pricing"],
  },
];

async function main() {
  console.log("Seeding…");

  // Wipe demo state (idempotent reseed)
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

  const counts = await db.$transaction([
    db.opportunity.count(),
    db.candidate.count(),
    db.case.count(),
  ]);
  console.log(`Seed done: ${counts[0]} opportunities, ${counts[1]} candidates, ${counts[2]} cases`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
