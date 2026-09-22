// Ferrix (Ajira Copilot) — demo data layer
// Personas, curated Nairobi opportunity dataset, fallback conversation script.
// NOTE FOR JUDGES: opportunities are a curated demo dataset standing in for
// live partner feeds (Ajira Digital, platforms, employers).

export type Lang = "en" | "sw";

export type ChatStage =
  | "greet"      // AI asked: what work do you do now?
  | "work"       // AI asked: what are you good at?
  | "digital"    // AI asked: how do you use your phone?
  | "goal"       // AI asked: what do you want next?
  | "limits"     // AI asked: what's the biggest challenge?
  | "ready";     // profile can be built

export const STAGE_ORDER: ChatStage[] = [
  "greet", "work", "digital", "goal", "limits", "ready",
];

export interface Persona {
  key: string;
  label: string;
  labelSw: string;
  emoji: string;
  name: string;
  location: string;
  phone: string;
  quickStart: string;   // prefilled first message
  chipColor: string;    // tailwind classes
  baseline: {
    skills: string[];
    experience: string;
    digitalLiteracy: string;
    goal: string;
    constraints: string[];
    priority: "high" | "normal" | "low";
  };
}

export const PERSONAS: Persona[] = [
  {
    key: "mama_fua",
    label: "Mama fua — cleaner & laundry",
    labelSw: "Mama fua — naosha na kufua",
    emoji: "🧼",
    name: "Purity",
    location: "Pipeline, Nairobi",
    phone: "+254 7•• ••• 465",
    quickStart:
      "Sasa! Mimi ni Purity, nafanya kazi za mama fua Pipeline — kusafisha nyumba na kufua nguo. Nataka kazi zaidi za kila siku.",
    chipColor: "bg-teal-50 text-teal-800 border-teal-200",
    baseline: {
      skills: ["cleaning", "laundry", "household", "customer-service", "mobile-money", "swahili"],
      experience: "5 years cleaning homes and doing laundry in Pipeline and Nairobi West, three regular families",
      digitalLiteracy: "Basic smartphone; WhatsApp voice notes and M-Pesa; low typing confidence",
      goal: "More daily cleaning gigs and steady weekly clients",
      constraints: ["data-cost", "smartphone-basics"],
      priority: "normal",
    },
  },
  {
    key: "mama_mboga",
    label: "Mama mboga — market vendor",
    labelSw: "Mama mboga — muuzaji sokoni",
    emoji: "🥬",
    name: "Amina",
    location: "Gikomba, Nairobi",
    phone: "+254 7•• ••• 214",
    quickStart:
      "Habari! Mimi ni Amina, nauza mboga Gikomba market. Nimekuskia unaweza kunisaidia nipate kazi zaidi.",
    chipColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    baseline: {
      skills: ["customer-service", "sales", "pricing", "negotiation", "stock-management", "mobile-money", "swahili"],
      experience: "8 years selling fresh produce in Gikomba market, regulars include 3 nearby eateries",
      digitalLiteracy: "Uses WhatsApp + M-Pesa daily; comfortable with voice notes, types slowly",
      goal: "Take orders beyond the stall — online orders via WhatsApp and steady weekly buyers",
      constraints: ["data-cost", "typing-confidence"],
      priority: "normal",
    },
  },
  {
    key: "boda",
    label: "Boda rider",
    labelSw: "Mpanda bodaboda",
    emoji: "🏍️",
    name: "Brian",
    location: "Kibera, Nairobi",
    phone: "+254 7•• ••• 807",
    quickStart:
      "Sasa! Mimi ni Brian, napanda boda Kibera. Nataka kipato stable zaidi na kazi ya delivery.",
    chipColor: "bg-amber-50 text-amber-800 border-amber-200",
    baseline: {
      skills: ["driving", "delivery", "navigation", "customer-service", "mobile-money", "swahili"],
      experience: "3 years boda rider, owns motorcycle, knows South B/C, Kibera and CBD routes",
      digitalLiteracy: "Smartphone user, WhatsApp fluent, uses Google Maps for navigation",
      goal: "Steadier daily income through delivery platforms plus one digital side skill",
      constraints: ["daytime-only"],
      priority: "normal",
    },
  },
  {
    key: "cashier",
    label: "Supermarket cashier (at automation risk)",
    labelSw: "Mkahawa wa duka la self-service",
    emoji: "🛒",
    name: "Grace",
    location: "Kasarani, Nairobi",
    phone: "+254 7•• ••• 356",
    quickStart:
      "Hi, I'm Grace. I work as a cashier in Kasarani. The new self-checkout machines have me worried — what else can I do?",
    chipColor: "bg-rose-50 text-rose-800 border-rose-200",
    baseline: {
      skills: ["pos", "cash-handling", "inventory", "customer-service", "data-entry", "english", "swahili"],
      experience: "5 years supermarket cashier and shelf stocking, trusted with end-of-day reconciliation",
      digitalLiteracy: "Confident with POS systems and smartphone; email and spreadsheets basics",
      goal: "Move into a digital-facing role before self-checkout replaces tills",
      constraints: ["daytime-only"],
      priority: "high",
    },
  },
  {
    key: "fundi",
    label: "Jua kali fundi — tailor",
    labelSw: "Fundi wa kushona",
    emoji: "🧵",
    name: "Otieno",
    location: "Kamukunji, Nairobi",
    phone: "+254 7•• ••• 642",
    quickStart:
      "Hello, I'm Otieno, a tailor in Kamukunji. My stitches are clean but I have no customers online. Can you help me?",
    chipColor: "bg-stone-100 text-stone-800 border-stone-300",
    baseline: {
      skills: ["sewing", "design", "alterations", "customer-service", "pricing", "swahili"],
      experience: "12 years tailoring; specializes in school uniforms and kitenge wear",
      digitalLiteracy: "Smartphone with WhatsApp; low typing confidence, prefers voice notes",
      goal: "Get customers online with a WhatsApp catalog, fixed prices and school contracts",
      constraints: ["photos", "data-cost"],
      priority: "normal",
    },
  },
];

export const personaByKey = (key: string | null | undefined) =>
  PERSONAS.find((p) => p.key === key);

export interface OpportunitySeed {
  title: string;
  type: "COURSE" | "GIG" | "JOB" | "MICROWORK";
  provider: string;
  location: string;
  payRange: string;
  duration?: string;
  description: string;
  tags: string[];
  actionUrl?: string;
}

export const OPPORTUNITIES: OpportunitySeed[] = [
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
    title: "Mama Fua — Household Cleaning Day Gigs",
    type: "GIG",
    provider: "Estate families & BnB hosts (demo listing)",
    location: "Pipeline, Nairobi West, South C",
    payRange: "KSh 800–1,500/day",
    duration: "Day gigs, 2–5/week",
    description:
      "House cleaning, laundry and compound work for verified families and BnB hosts. Same-day M-Pesa pay after each gig.",
    tags: ["cleaning", "laundry", "household", "customer-service", "swahili", "mobile-money"],
  },
  {
    title: "House Help / Nanny — verified families",
    type: "JOB",
    provider: "Partner agencies, South B & Kilimani (demo listing)",
    location: "South B, Kilimani, Lang'ata",
    payRange: "KSh 8,000–15,000/mo",
    duration: "Full-time, live-in or day",
    description:
      "Childcare, cooking and housekeeping with vetted employers. Reference checks done by the agency before placement.",
    tags: ["childcare", "cooking", "household", "cleaning", "customer-service", "swahili"],
  },
  {
    title: "Laundry & Ironing — home service",
    type: "GIG",
    provider: "Estate client network (demo listing)",
    location: "Pipeline, Donholm, Umoja",
    payRange: "KSh 300–700 per basket",
    duration: "Flexible, pickup at 6pm",
    description:
      "Wash, dry and iron household laundry collected from estates. Weekly clients mean steady, repeatable income.",
    tags: ["laundry", "cleaning", "household", "customer-service", "mobile-money"],
  },
  {
    title: "Residential Plumber (fundi maji)",
    type: "GIG",
    provider: "Estate maintenance clusters (demo listing)",
    location: "Donholm, Umoja, Buruburu",
    payRange: "KSh 1,500–3,500/job",
    duration: "On-call + weekly estates",
    description:
      "Leaking taps, unblocking drains, fitting sinks and cisterns across estate clusters. Your own basic toolkit required.",
    tags: ["plumbing", "repair", "pipes", "maintenance", "construction", "swahili"],
  },
  {
    title: "Certified Electrician (fundi stima)",
    type: "GIG",
    provider: "Licensed contractor, Roysambu (demo listing)",
    location: "Roysambu, Kahawa West, CBD",
    payRange: "KSh 2,000–5,000/job",
    duration: "On-call + install days",
    description:
      "House wiring, socket and breaker fixes, security-light installs. EPA-registered contractor; safety gear provided.",
    tags: ["electrical", "wiring", "repair", "maintenance", "construction", "safety"],
  },
  {
    title: "Welder & Metal Fabricator",
    type: "JOB",
    provider: "Kamukunji jua kali cluster (demo listing)",
    location: "Kamukunji, Baba Dogo",
    payRange: "KSh 25,000–40,000/mo",
    duration: "Full-time, workshop",
    description:
      "Gates, grills and window frames on order from hardware referrals. Own mask an advantage; materials supplied.",
    tags: ["welding", "fabrication", "metalwork", "construction", "tools"],
  },
  {
    title: "Carpenter — Furniture & Fittings (fundi seremala)",
    type: "GIG",
    provider: "Gikomba workshops (demo listing)",
    location: "Gikomba, Kariobangi North",
    payRange: "Per piece, KSh 500–3,000",
    duration: "Workshop-based",
    description:
      "Beds, sofas frames and fitted cabinets against customer orders. Materials supplied; pay per completed piece.",
    tags: ["carpentry", "woodworking", "furniture", "tools", "construction"],
  },
  {
    title: "Mason — Block & Plaster (fundi wa kufu)",
    type: "GIG",
    provider: "Site foremen, Roysambu (demo listing)",
    location: "Roysambu, Mwiki, Njiru",
    payRange: "KSh 1,200–2,500/day",
    duration: "Daily site work",
    description:
      "Block laying, plastering and screeding on residential sites. Steady 6-day weeks once a foreman knows you.",
    tags: ["masonry", "plaster", "building", "construction"],
  },
  {
    title: "Painter & Decorator",
    type: "GIG",
    provider: "Estate repaint contracts (demo listing)",
    location: "South C, Lang'ata, Kilimani",
    payRange: "KSh 1,500–3,000/day",
    duration: "1–3 week contracts",
    description:
      "Interior and exterior repainting for move-out contracts. Two painters work as a pair; paint and scaffolds supplied.",
    tags: ["painting", "decorating", "finishing", "construction"],
  },
  {
    title: "Fridge & AC Repair Technician",
    type: "GIG",
    provider: "Appliance service network (demo listing)",
    location: "CBD, Kasarani, Thika Road",
    payRange: "KSh 1,000–3,000/call-out",
    duration: "On-call + Saturday clinic",
    description:
      "Gas refills, thermostat and compressor swaps for homes and shops. Training provided for common fridge models.",
    tags: ["refrigeration", "ac", "electrical", "repair", "appliances"],
  },
  {
    title: "Car Mechanic — garage team",
    type: "JOB",
    provider: "Garage, Industrial Area (demo listing)",
    location: "Industrial Area, Baba Dogo",
    payRange: "KSh 15,000–30,000/mo",
    duration: "Full-time",
    description:
      "Servicing, brake and suspension work on taxis and fleet cars. Experienced fundis welcome — certificates optional.",
    tags: ["mechanic", "engines", "vehicles", "repair", "tools"],
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
    title: "Phone Repair Technician",
    type: "JOB",
    provider: "Repair kiosks, CBD & Kasarani (demo listing)",
    location: "CBD, Kasarani, Eastleigh",
    payRange: "KSh 12,000–25,000/mo + commission",
    duration: "Full-time, kiosk",
    description:
      "Screen swaps, charging ports and software flashes at a busy kiosk. Apprentices trained on the job in 6 weeks.",
    tags: ["repair", "electronics", "phones", "customer-service", "tools"],
  },
  {
    title: "Tuk-tuk Driver — stage route",
    type: "GIG",
    provider: "Owner-operators, Dandora stage (demo listing)",
    location: "Dandora, Komarock, Kayole",
    payRange: "KSh 800–1,400/day after fuel",
    duration: "Day or night shifts",
    description:
      "Drive a shared tuk-tuk on a fixed stage route. Clean record needed; weekly saving plan managed via M-Pesa.",
    tags: ["driving", "transport", "customer-service", "mobile-money", "swahili"],
  },
  {
    title: "Barber & Grooming — salon chair",
    type: "GIG",
    provider: "Salons, Umoja & Donholm (demo listing)",
    location: "Umoja, Donholm, Tassia",
    payRange: "Commission, KSh 600–1,500/day",
    duration: "Tue–Sun, walk-ins",
    description:
      "Rent a chair in a partner salon — cuts, shaves and kids' lines. Own clippers preferred; bookings come via WhatsApp.",
    tags: ["barber", "grooming", "customer-service", "sales", "mobile-money"],
  },
  {
    title: "NITA Trade Test Prep — Plumbing / Electrical / Carpentry",
    type: "COURSE",
    provider: "NITA partner centre (demo partner feed)",
    location: "Online theory + Nairobi workshop",
    payRange: "Subsidised, KSh 500 registration",
    duration: "8 weeks, part-time",
    description:
      "Prepare for the NITA Grade III–I trade test in your trade. Certified fundis are listed first on partner job feeds.",
    tags: ["certification", "plumbing", "electrical", "carpentry", "masonry", "trade-test"],
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

// ---- Fallback conversation script (used if the live model is unavailable) ----

export const FALLBACK_REPLIES: Record<ChatStage, Record<Lang, string>> = {
  greet: {
    en: "Asante! I hear you — that work takes real hustle. Tell me, what are you best at in your work? Even small things count.",
    sw: "Asante! Nimekusikia — kazi yako ni juhudi za kweli. Sasa niambie, unashinda wapi kwenye kazi yako? Hata vitu vidogo vina hesabu.",
  },
  work: {
    en: "That's a strong skill set — many people underrate it. Now, how do you use your phone? WhatsApp, M-Pesa, anything else?",
    sw: "Uwezo wako ni mzuri — watu wengi hupunguza thamani yake. Sasa, unatumia simu yako vipi? WhatsApp, M-Pesa, au nini kingine?",
  },
  digital: {
    en: "Good — your phone can already carry part of your next step. What do you want next: more income, online work, or growing your business?",
    sw: "Nzuri — simu yako inaweza kubeba hatua yako ijayo. Unataka nini mtandaoni: kipato zaidi, kazi ya online, au kuongeza biashara?",
  },
  goal: {
    en: "Clear goal — I like it. Last one: what makes this hard right now? Data cost, time, confidence, or not knowing where to start?",
    sw: "Lengo lisilo na shaka — napenda. Swali la mwisho: nini linagumu sasa? Bei ya data, muda, uhakika, au kutojuauanza wapi?",
  },
  limits: {
    en: "Thank you for being honest — that's exactly what we plan around. I have enough to build your profile and match you with real opportunities.",
    sw: "Asante kwa ukweli — ndiyo tunayopanga nayo. Nina ya kutosha kutengeneza wasifu wako na kukupatia fursa halisi.",
  },
  ready: {
    en: "Tap “Build my profile” and I'll prepare everything — then a human mentor from our network takes it from there.",
    sw: "Bonyeza “Tengeneza wasifu wangu” nitaandaa kila kitu — kisha mtu wa kweli kutoka mtandao wetu ataendelea na wewe.",
  },
};

export const SUGGESTIONS: Record<ChatStage, Record<Lang, string[]>> = {
  greet: {
    en: ["I sell vegetables in the market", "I ride a boda", "I do mama fua & cleaning", "I'm a fundi — plumber / electrician", "I do tailoring"],
    sw: ["Nauza mboga sokoni", "Napanda boda", "Nafua na kusafisha nyumba", "Ni fundi wa maji / stima", "Nashona nguo"],
  },
  work: {
    en: ["Serving customers & pricing", "Driving & navigating the city", "Typing & keeping records", "Making & designing things"],
    sw: ["Kuhudumia wateja & bei", " kuendesha & njia za jiji", "Kuandika & kumbukumbu", "Kutengeneza vitu"],
  },
  digital: {
    en: ["WhatsApp & M-Pesa only", "Comfortable with many apps", "Basic phone only", "I learn fast"],
    sw: ["WhatsApp & M-Pesa tu", "Natumia apps vizuri", "Simu ya kawaida tu", "Najifunza haraka"],
  },
  goal: {
    en: ["More income", "Work online", "Grow my business", "A formal job"],
    sw: ["Kipato zaidi", "Kazi ya online", "Kuongeza biashara", "Kazi rasmi"],
  },
  limits: {
    en: ["Data bundles are costly", "No time during the day", "I don't know where to start", "Typing is hard for me"],
    sw: ["Data ni ghali", "Sina muda mchana", "Sijui pa kuanza", "Kuandika ni ngumu"],
  },
  ready: {
    en: ["Build my profile", "One more question"],
    sw: ["Tengeneza wasifu wangu", "Swali lingine"],
  },
};

// Lightweight keyword spotting for the "under the hood" signal panel.
export const SIGNAL_RULES: { label: string; keywords: string[] }[] = [
  { label: "Sector: fresh produce retail", keywords: ["mboga", "sokoni", "market", "vegetable", "greens"] },
  { label: "Sector: transport & delivery", keywords: ["boda", "delivery", "ride", "panda", "courier", "motorcycle"] },
  { label: "Sector: retail / POS", keywords: ["cashier", "shop", "duka", "supermarket", "till", "pos"] },
  { label: "Sector: tailoring & craft", keywords: ["tailor", "shona", "sewing", "fundi", "kitenge", "uniform"] },
  { label: "Sector: cleaning & domestic (mama fua)", keywords: ["mama fua", "fua", "cleaning", "kusafisha", "laundry", "nyumba", "domestic", "nanny"] },
  { label: "Sector: plumbing & water", keywords: ["plumber", "plumbing", "maji", "bomba", "pipes", "fundi maji", "leak"] },
  { label: "Sector: electrical & wiring", keywords: ["electrician", "stima", "wiring", "umeme", "socket", "fundi stima"] },
  { label: "Sector: construction & metalwork", keywords: ["mason", "carpenter", "seremala", "welder", "construction", "plaster", "mechanic", "garage"] },
  { label: "Skill signal: customer service", keywords: ["customer", "wateja", "serve", "huduma"] },
  { label: "Skill signal: mobile money", keywords: ["m-pesa", "mpesa", "pesa", "money", "float"] },
  { label: "Skill signal: WhatsApp commerce", keywords: ["whatsapp", "catalog", "order", "online"] },
  { label: "Constraint: data cost", keywords: ["data", "bundles", "ghali", "cost"] },
  { label: "Constraint: automation risk", keywords: ["machine", "self-checkout", "automat", "replace", "punguz"] },
];
