# Ferrix — Startup Vision & Blueprint

**From hackathon demo to the voice-first livelihood platform for 17 million informal workers.**

> "AI shouldn't replace the people who keep this city running. It should help them earn."

*Prepared by the multi-agent research team (voice AI, market, strategy, architecture), September 2026. Companion to [README.md](../README.md) — this document is the founder's big-dream roadmap.*

---

## 1. The Big Dream

Ferrix becomes the **trust layer and credential rail of Kenya's informal economy** — and then East Africa's.

Today, a mama fua in Kayole has no CV, no LinkedIn, no verified history. Her reputation lives in the memory of the neighbors she has worked for. Seventeen million Kenyan workers like her generate a huge share of the country's economic activity with **zero portable proof of skill, reliability, or experience** — which means they cannot access better work, fair pay, or credit. Meanwhile, every employer, SACCO, NGO, and government program flying blind on "who can actually do the work" keeps paying the cost of that invisibility.

Ferrix turns a 5-minute Swahili voice conversation into a **work passport**: a verified, compounding record of who did what work, at what quality, with what outcome — built by AI, confirmed by humans, audible in the worker's own voice, and monetizable by everyone the worker touches:

- **The worker** hears and carries her passport — even if she cannot read it.
- **The employer** hires a verified fundi in minutes instead of gambling on a WhatsApp group scam.
- **The lender** underwrites income the formal system has never seen (the Tala playbook, with better data).
- **The state** finally gets placement outcomes for programs like Ajira Digital and KYEOP that spend billions and can't measure results.

The end state in 5 years: **Ferrix passports are the default way informal work is matched and trusted across Kenya — voice-first, Swahili-native, worker-owned — processing hundreds of thousands of verified placements a year, with the verified-outcome dataset no competitor or ministry can replicate.**

That is the dream. The rest of this document is how to get there.

---

## 2. Why Now — The Thesis

**The problem is the size of the economy.** Informal work is 83–90% of Kenyan employment (~15–18M workers; ~704k–782k new jobs in 2024, ~90% informal; ~24% of GDP directly, far more in household income). The adjacent *online* gig market Ajira-style platforms chase is only ~$109M with ~36k–100k workers. The offline jua kali matching market is roughly **100× larger and effectively unserved by software**.

**The money to solve it is already appropriated.** Ajira Digital (GoK + Mastercard Foundation) targets 1M+ youth/year with KSh 16.3B allocated in FY2024/25; KYEOP was a $150M World Bank IDA credit; Mastercard Foundation's Young Africa Works targets 30M young people. Every one of these programs has a **placement-outcome measurement problem** Ferrix directly solves — they are buyers, not competitors.

**The rails are free to build on.** Kenya smartphone penetration is >60% of adults, M-Pesa is near-universal, the Safaricom Daraja API has no integration fee, and C2B till fees are capped (≤0.55%, max KSh 200). WhatsApp is where the target user already lives (workers send dozens of voice notes a day; ~95%+ penetration).

**Voice AI just crossed the quality line for Swahili.** ElevenLabs v3 now lists Swahili; OpenAI's newer transcription models roughly halve error rates across 22 languages; Soniox markets real-time Swahili STT at ~$0.12/hr; open-source floors exist (Meta MMS, Sunbird AI). The global voice stack is commoditizing — which means the defensible part is not the model. It's the **verified outcomes**.

**The precedent that de-risks the modality is Kenyan and live today.** Jacaranda Health's PROMPTS voice AI lets mothers call a toll-free line and get Kiswahili health answers; Viamo's 3-2-1 service runs 100M+ minutes/month across Africa. Research (Project HealthLine, CGAP) shows speech input beats key-press for low-literacy users — *in their own language*. Voice-first is not a gimmick here; it is the only interface that works.

**The competitive gap is structural, not incremental.** Lynk (closest Kenyan player) is app-form-based, English-leaning, with profiles but no verified track record. The WhatsApp/Facebook job groups workers actually use today are scam-ridden. Global platforms (Fiverr 20% rake, Upwork, Thumbtack) assume CVs, English, cards, and $50+ jobs — none of which hold for KSh 300–1,500 gigs paid in M-Pesa or cash and negotiated in Sheng.

**Therefore:** build the ops-heavy trust layer (AI proposes → human coordinator places → outcome verified) that pure-tech competitors structurally won't replicate, monetize on the demand/institutional side, and let verified placements compound into the dataset moat.

---

## 3. Lessons from ElevenLabs — Playbook Applied

ElevenLabs went from a two-person team frustrated by bad Polish movie dubbing (2022) to **$330M+ ARR in ~24 months** and an $11B valuation (2026). Their playbook, translated to Ferrix:

| ElevenLabs insight | Ferrix translation |
|---|---|
| **Frustration-driven origin beat market reports** (founders lived the pain of bad dubbing) | Our founder lives in the market: the mama fua without a CV *is* the founding insight. Stay ops-close; every feature must come from a real coordinator/worker pain. |
| **"Full-stack voice" bundling: every product sells the next** (TTS → STT → dubbing → agents) | Bundle voice *intake* → passport → matching → coordination → verification. Each layer makes the next cheaper and stickier; the passport is the product the bundle is for. |
| **The Voice Library is a social network: creators earn when their voices are used** | Workers *own* their passports and benefit from their use — portable credentials, exportable, never locked. Trust-as-feature beats trust-as-compliance. |
| **Free-first developer gravity, then pure usage billing** | Free forever for workers (they're the supply you need dense). Employers pay per verified gig; institutions pay for outcomes. Price in KSh and gig-value, never in "credits" or tokens. |
| **Raised after each product line proved usage, not before** | Raise only after pilot metrics (≥60% placement completion, repeat demand) exist. Non-dilutive credits/grants first — see §10. |
| **Trust work before it was forced** (voice-captcha, consent attestation) unlocked enterprise buyers | In a scam-saturated market, **verification is the product**. Consent ledgers, verified-outcome badges, human review rights — build before regulation forces it. |
| **Community as R&D** (hackathons, showcase apps) | We are the showcase app for voice-AI-for-livelihoods. Keep shipping weekly, publish the "Kenya Informal Work Index" — authority compounds. |
| **Went wide (99 languages shallow) — the deep-language lane is open** | Go **deep**: Swahili + Sheng + one dialect layer, done better than anyone. Nobody — including ElevenLabs — has production Sheng support. That's our open lane. |

**What NOT to copy:** voice cloning as hero feature (a liability in a fraud-sensitive market — feature the worker's *own* voice instead); creator-economy positioning; emotive premium TTS as default (optimize intelligibility/latency/cost over 3G Android speakers); opaque credit systems; desktop-first Studio products (our surface is phone speaker + WhatsApp + dial pad); charging API prices Western devs pay.

---

## 4. The Voice Strategy — Swahili-First, Not Swahili-Best-Effort

Voice is Ferrix's wedge and its identity. The pipeline recommendation (three tiers):

| Tier | STT | TTS | Round-trip | Cost/voice-minute | Use |
|---|---|---|---|---|---|
| **Demo (today)** | Web Speech API (free, on-device) | Browser `speechSynthesis` | <1s | $0 | Shipped. The hackathon differentiator. |
| **Pilot (≤1k workers)** | WhatsApp voice notes → Whisper/`gpt-transcribe` (~$0.006/min) or Google `sw-KE` STT | Google `sw-KE` Neural2/Chirp3 | Turn-based 3–6s — fine for async voice notes | $0.01–0.03 | **Recommended pilot path.** No streaming infra needed. |
| **Scale (10k+)** | Fine-tuned Whisper large-v3 self-hosted (Lacuna Fund Kenyan Swahili dataset; PazaBench as eval rubric) or Deepgram streaming for IVR | Self-hosted MMS/Sunbird TTS at cost floor; ElevenLabs v3 Swahili only for employer-facing premium audio | Realtime (coordinator/employer tier only): budget ≤2.5s end-to-end on Kenyan 4G | $0.001–0.02 self-hosted | Realtime reserved for the tier that pays for it. |

**Key architectural insight:** turn-based voice notes beat realtime voice agents for this population — latency-tolerant, data-cheap, cost-predictable, and *exactly how Kenyan workers already use voice* (70 voice notes per live call). The web voice agent is the demo; WhatsApp voice notes are the business.

**The Sheng play.** No production system understands Sheng (sw+EN slang). An LLM post-normalization pass (Sheng → clean EN/SW before parsing, shown side-by-side) makes Ferrix the only tool that understands how young Nairobi actually talks — and passively collects the correction dataset for a future fine-tune nobody else has.

### Flagship voice features (from the ranked backlog)

1. **"Sikiliza Passport Yako" — audible work passport.** A play button reads the passport aloud in natural Swahili: *"Amina ni mama fua wa miaka mitatu, amefanya kazi 27, wateja 24 wanamsifu…"* The passport only creates trust if it can be **heard** — by the worker who reads slowly, and by the client deciding whether to hire. *(~1 day of effort; highest impact/effort score on the board.)*
2. **Conversational voice-agent intake.** Replace mic-dictation-then-edit with a turn-based agent that *asks* — one question at a time in EN/SW/Sheng, filling the profile live on screen, like the ajira office works. *(60-second fully-voiced profile creation on stage.)*
3. **WhatsApp voice-note intake.** A Ferrix WhatsApp number: worker sends a voice note, Ferrix transcribes → extracts profile + intent → replies with matched gigs, optionally as a voice note back. No app install. *(The judge demo: send a Swahili voice note from your own phone, get matched gigs in seconds.)*
4. **Voice bio on the passport.** A 20-second self-recorded intro in the worker's own voice — reputation you can *hear*, consent-native, no cloning.
5. **Spoken "why this gig" explanations.** The existing explainable matcher, spoken in Swahili on tap.
6. **Voice gig alerts ("kazi iko!").** Push alerts on new matches via WhatsApp/voice call with press-1 interest.
7. **Sheng-normalization layer.** See above — differentiation + data moat in one.
8. **Post-job verification calls.** Auto-call/SMS the client after each gig: 3 questions, answers stamp a *verified* badge on the passport. Passport integrity = fraud resistance.
9. **Swahili interview coach.** Role-play a picky client; score clarity; save best answers as profile highlights.
10. **Toll-free IVR fallback.** The Jacaranda/Viamo pattern for feature phones — the fundraising-slide feature; simulate at demo, build post-pilot.

The full ranked backlog with rationale lives in the research archive; these ten are the committed set.

---

## 5. Market & Business Model

### Sizing (cited figures, Kenya)

- **TAM** — informal work matching + worker services: ~17M workers at $10–30/worker/yr ⇒ **$170M–500M/yr**. Cross-check: 1–2% fee on labor value flowing through a platform ⇒ $300–600M fee pool.
- **SAM** — urban/peri-urban workers in Ferrix's 27 trade categories with a phone: ~3.5–4.5M workers ⇒ **$40–110M/yr**.
- **SOM (3-yr)** — 100k–250k registered, 30–50k monthly-active via coordinator/partner channels ⇒ **~$1.5–2M ARR ceiling on the first wedge**, expanding with credit-data and training revenue.

### Monetization (ranked, with evidence)

1. **Employer-side per-placement fee** — KSh 50–300 flat or 5–10% of gig value. Staffing norm is 15–30%; Kenya gigs are micro, so flat micro-fees. Gross margin ~85% after voice+M-Pesa costs. *Risk: cash leakage → mitigate with M-Pesa escrow + "verified gig" benefits.*
2. **Institutional outcome contracts (B2B2C)** — $5–20 per verified placement or $100–300k/yr pilots, sold to Ajira/Mastercard Foundation/KYEOP-successor programs that must report placement numbers. *Anchor on outcomes Ferrix already tracks.*
3. **Work-passport-as-credit-data + SACCO SaaS** — Kenya SACCOs: KSh 1.07T assets, 7.4M members, KSh 542B disbursed (2024) — lending to jua kali workers with no formal data. KSh 60–120k/yr SaaS per SACCO + per-profile API pricing for lenders. *Tala proved the data thesis; a verified passport is better data.*
4. **Training/certification referral** — KSh 200–500 per referral into NITA/TVET pipelines; institutions need placement rates.
5. **Worker freemium (last resort)** — never for core matching; maybe for passport export/certificate printing.

**Rejected:** worker-side subscriptions (price-elastic supply), ads, Fiverr-style 20% rake (the gig is often the worker's lunch money).

### Distribution (ranked)

1. **Ajira Digital PoPs** — 300k+ beneficiaries; they need placement outcomes; Ferrix generates them.
2. **SACCOs** — free matching for members + passport-enhanced underwriting reports.
3. **Mastercard Foundation grantee NGOs** — infrastructure they buy instead of build.
4. **NITA + polytechnics** — passports issued at certification for one trade.
5. **Chief barazas & county social services** — the sanctioned trust channel per ward.
6. **Chamas & churches** — where mama fua supply organizes today.
7. **Hardware stores** — where fundis already get hired; "hire a verified fundi" counters.
8. **Boda SACCOs/rider unions** — 1M+ riders, mobile-money native, underemployed between trips.

*(Deliberately excluded: paid social ads — CAC destroys KSh-unit economics. The coordinator layer is the designed acquisition channel.)*

**The one-sentence business model:** *Ferrix earns a small employer-side fee on every gig it matches in Kenya's KSh-trillion jua kali economy, while the worker's voice-built work passport compounds into institutional contracts, SACCO SaaS subscriptions, and lender-grade credit data — turning 17 million workers' invisible track records into a monetizable asset.*

---

## 6. Moat & Flywheel

### The moat (scored over 24 months)

| Candidate | Defensibility | Buildable | Capital-eff. | Compounding | Total |
|---|---|---|---|---|---|
| **A. Verified-outcome dataset** — the only system that knows which workers actually completed which jobs at what quality | 4 | 4 | 4 | 5 | **17** ✅ |
| B. Supply-side trust network — vetted workers + coordinator guild | 4 | 3 | 3 | 4 | 14 |
| C. Regulatory/institutional — NITA/Ajira MoUs | 3 | 3 | 5 | 3 | 14 |

**Primary moat: A, executed through B, accelerated by C.** LLMs commoditize; "we are the only system that knows this mama fua completed 14 jobs at 4.8★" does not. The dataset can only be generated by ops humans verify — exactly what pure-tech competitors and ministry internal teams structurally won't replicate. Moat C is pursued as a toll booth on the flywheel, not the moat itself: an MoU is reversible; 24 months of verified placement history is not.

### The flywheel

```
WORKER (voice intake → structured profile)
        ▼
EXPLAINABLE MATCH (why this worker, in Kiswahili)  ◀──  DEMAND (homes, SMEs,
        ▼                                              landlords, NGOs, counties)
HUMAN COORDINATOR  ("AI suggests, humans place")
        ▼
PLACEMENT (M-Pesa escrow, completion check)
        ▼
VERIFIED OUTCOME  ← the labeled asset: completed / repeat client / rating
        ▼
BETTER MATCHING  +  RICHER PASSPORT  →  back to the top
```

The scarce asset is the **label**. Anyone can call an LLM; almost no one will field humans to verify a Kayole fundi actually finished the job and got paid. Each verified outcome simultaneously trains matching, thickens the worker's passport (supply stickiness), and de-risks the next demand-side customer (trust signaling).

---

## 7. Product Roadmap — From Demo to Company

**Phase 0 — Hackathon (now).** Voice-first web demo, 27 jua kali categories, explainable matching, coordinator trust pipeline, work passport, EN/SW. *(Shipped: E2E 11/11, API 38/38, zero lint/tsc errors.)*

**Phase 1 — Demo-week voice upgrades (days, not weeks):**
- "Sikiliza Passport Yako" — TTS-audible passport in Swahili (#1 above)
- Voice bio recording on the passport
- Spoken match explanations
- Conversational voice-agent intake (turn-based, no realtime infra needed)

**Phase 2 — Pilot (months 1–3):** one coordinator + ~20 workers in one estate (e.g., Kayole). WhatsApp Cloud API channel behind a `ChannelAdapter` interface (service-window messages are free since July 2025 — intake conversations cost ≈ $0). Voice-note intake via Whisper. Outcome verification instrumented on every placement. Metrics: match rate, **placement completion rate**, 30-day worker return rate.

**Phase 3 — Institutional wedge (months 3–9):** Ajira PoP pilot + one Mastercard Foundation partner NGO + one SACCO passport-underwriting pilot. SMS/USSD digests via Africa's Talking for feature phones (menu-shaped, session-limited — not the full conversation engine). Multi-tenancy (orgId) shipped *before* real PII lands.

**Phase 4 — Scale (months 9–24):** M-Pesa Daraja payouts + escrow; IVR toll-free line; county employability pilots; passport API for lenders; second/third city (Mombasa, Kisumu), then Swahili-region expansion (Uganda, Tanzania — the language advantage travels).

---

## 8. Platform Architecture — Built to Last

**Target architecture (12–24 months):** channels as swappable edges, one AI engine at the core, the trust pipeline you already built at the middle.

```
CHANNELS                      CHANNEL GATEWAY
Voice web (now)               ChannelAdapter interface:
WhatsApp Cloud API    ──►       verifyWebhook() → parseInbound()
USSD / SMS / IVR (AT)         → normalize to InboundMsg {tenant, worker, lang, text|audio}
                              → render OutboundMsg per channel
                                        ▼
        AI ORCHESTRATION (one engine, every channel)
        conversation state machine
        → LLMProvider port (llmChat(): zai | OpenAI | Gemini | Groq)
        → Zod-validated StructuredProfile
        → matcher.ts explainable scorer (versioned, pure)
        → scripted fallback = cheap-channel provider (demo-can't-die philosophy)
        HUMAN LAYER: coordinator queue + escalation + review
                                        ▼
DATA PLATFORM                          INTEGRATIONS
Postgres (Neon) · Prisma · orgId       M-Pesa Daraja · NITA/Ajira feeds
on every row · append-only EventLog    Africa's Talking SMS/USSD/IVR
object store for voice audio           WhatsApp Cloud API · KYC
```

**"Built to last" repo upgrades (tied to the actual codebase):**

1. **Multi-tenant schema** — `Organization` model + `orgId` FK on `Candidate`/`Opportunity`/`Case`/`TrackRecordEntry`; SQLite keeps one default org so the demo is unchanged.
2. **ChannelAdapter interface** (`src/lib/channels/types.ts`) — web chat becomes adapter #1; WhatsApp/USSD normalize into the same `Message` rows; `/api/chat` logic reused wholesale.
3. **Versioned matcher API** — `MATCHER_VERSION` constant persisted in `Match`; matcher exposed as a versioned endpoint NGOs can call.
4. **Append-only EventLog** — generalize `CaseEvent` into an auditor-certifiable log (actor, action, entity, payload, modelVersion); never UPDATE.
5. **LLMProvider port** — formalize `llmChat()` as an env-selected interface with per-call cost/latency logging; the scripted fallback becomes just another provider.
6. **Zod contracts → OpenAPI** — generated `openapi.json` so counties/partners integrate without us.
7. **Prisma Postgres hardening** — `Json` columns instead of JSON-strings, real `prisma migrate`, idempotent seed upserts — the provider swap becomes a one-day change.
8. **Offline-first PWA for coordinators** — service worker caches the case queue; mutations queue in IndexedDB and replay on reconnect.
9. **Self-host kit (DPI posture)** — `docker-compose.yml`, documented env matrix, one-command seed, `ferrix-export` data-portability CLI, ADRs. This is how Mifos and OpenFn earned DPI traction.
10. **Auth + per-tenant API keys** — phone-OTP coordinator auth, RBAC scoped by `orgId` (closes the one documented security deferral).

**Cost model (monthly infra):**

| Scale | Total/mo | Per worker |
|---|---|---|
| 100 workers | $25–75 | ~$0.50 |
| 10k workers | $300–800 | ~$0.05 |
| 100k workers | $2.5–6k | **$0.03–0.06** |

At scale Ferrix costs **a few US cents per worker per month** — cheap enough to be donor/county-funded public infrastructure.

---

## 9. Trust & Compliance (Kenya DP Act 2019)

Eight actions before the first real PII lands: (1) register with the ODPC as data controller; (2) consent ledger as first-class `ConsentEvent` rows per purpose; (3) treat voice as sensitive/biometric-adjacent data (s.30) — no voiceprint ID without separate consent; (4) **cross-border LLM transfer** — the live gap: consent at intake + PII-scrubbing before `llmChat()` + in-region/self-hosted models at scale; (5) DPIA before launch (profiling for livelihoods is high-risk processing); (6) in-region storage (AWS Cape Town / Azure SA North); (7) 72-hour breach-notification runbook; (8) data-subject rights: full export + cascading deletion with grace window; plus retention schedules as env-config, EN/SW privacy notices in-channel, `matcherVersion`/`modelVersion` on every decision for audit reproducibility, and the coordinator layer documented as the human-review right (s.26 remedy).

---

## 10. Funding Roadmap

Market context: African tech funding ~$4B (2025, +25% YoY) but pre-seed is brutal (~$165K average) — so **non-dilutive first, equity with traction only**.

| Stage | Source | Amount | Trigger |
|---|---|---|---|
| Day 0–90 | Microsoft Founders Hub / Google / AWS credits | $0–150K credits | Apply immediately (weeks 3–4) |
| Day 0–90 | Gates Grand Challenges AI, AI4D/IDRC, Mozilla | $50–150K grants | After pilot design exists |
| Month 3–6 | Antler Nairobi, Founders Factory Africa, Katapult | $100–250K pre-seed | Commitment gate passed |
| Month 4–8 | YC ($500K standard; 70+ African alumni), Accelerate Africa, Google for Startups Accelerator (equity-free) | varies | Pilot: ≥60% completion + repeat demand |
| Month 6–12 | Launch Africa | $250K–1M | 2–3 paying B2B/program customers |
| Month 12–18 | Mastercard Foundation / county procurement via implementers | $50K–1M+ contracts | NITA/Ajira MoU + published outcome data |
| Month 18–24 | Seed VC (Norrsken22, Launch Africa follow-on, regional funds) | $1–2.5M | Flywheel metrics proven; city #2 underway |

Also: **ElevenLabs Grant — 12 months free for startups building conversational agents.** Apply; it is literally built for this.

### Three pitch framings (use in this order)

1. **Applied-AI research** — "voice-first agents for low-resource languages" (cheapest credibility; judges, fellowships, credits, engineering talent — now).
2. **DPI / public good** — "Kenya's missing credential layer"; SDG 8, Ajira alignment (ministries, foundations — from week 9, forever).
3. **Commercial marketplace** — "Andela for the 83%"; take-rate + outcome-data moat, Lynk/Sendy graveyard openly addressed (equity investors — from month 3 with pilot numbers).

---

## 11. The First 90 Days After the Hackathon

| Weeks | Actions |
|---|---|
| **1–2: Lock it in** | Fix the 3 deferrals (auth, dep prune, live deploy at a real URL). Team commitment: full-time, vesting (4-yr/1-yr cliff), IP assignment. Incorporate (Kenya Ltd). Define the 3 metrics. 10 worker + 5 coordinator/employer interviews. |
| **3–4: Pilot design** | Recruit 1 coordinator + 20 workers in one estate. Instrument outcome verification. File the credit applications (Founders Hub, Google, AWS). WhatsApp sandbox live. |
| **5–8: Run & document** | Execute pilot; verify every placement outcome. Weekly shipping cadence. 3 worker case studies. Press: TechCabal, Nation, Standard. Grant applications in. Collect Swahili voice data deliberately — it's a research asset. |
| **9–10: Institutional wedge** | NITA + Ajira Digital meetings with demo + one-page "Kenya Work Passport" DPI brief. Flywheel metrics dashboard live. |
| **11–12: Raise readiness** | Data room; deck with pilot metrics. YC / Antler / Launch Africa / Founders Factory applications. |
| **13: Recommit** | Demo day / second-stage hackathons. **Gate: convert full-time only if ≥60% placement completion + repeat demand.** Publish "Kenya Informal Work Index" v1. |

---

## 12. Strategic Risks & Mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Ajira/NITA builds this in-house** after seeing traction | Become their vendor, not their rival: MoU by month 6; open passport spec so Ferrix is the operating layer, not a competing ministry project |
| 2 | **LLM cost collapse commoditizes the AI layer** | Moat = verified-outcome data + human coordination ops; keep the LLM provider abstraction; price on placement value, never tokens |
| 3 | **Trust crisis from one bad placement** (theft/safety incident) | Tiered verification before household access; M-Pesa escrow; incident-response SLA with coordinator on-site; guarantee fund when revenue allows; scale demand per-estate gradually |
| 4 | **Disintermediation / C2C liquidity death** (the Lynk lesson; Sendy died fundraising) | Lead with B2B/program revenue; make the passport the persistent product workers carry even off-platform; escrow keeps the money rail on Ferrix |
| 5 | **Post-hackathon dissolution / demo-ware decay** (the most common killer) | Week-1–2 commitment gate with vesting; single-estate pilot with hard completion metrics; ship weekly publicly; accelerators as forcing functions, not trophies |

---

## Appendix A — Immediate Next Actions

1. **Apply for the ElevenLabs Grant** (12 months free agent minutes) + Microsoft Founders Hub + Google for Startups credits — same week.
2. **Prototype the two flagship voice features** (audible passport + voice-agent intake) using browser TTS + the existing LLM seam — ~2 days of effort, transforms the demo.
3. **Request a WhatsApp Cloud API sandbox number**; ship the first `ChannelAdapter`.
4. **Recruit the one-coordinator pilot** in one estate; instrument placement-outcome verification.
5. **Register with the ODPC** and run the DPIA covering the cross-border `llmChat()` transfer.
6. **Prepare the one-page DPI brief** for NITA/Ajira outreach.

## Appendix B — Research provenance

Findings synthesized from four parallel research agents (voice AI product, market/monetization, startup strategy, platform architecture), ~60 live web searches total (Sep 2026): ElevenLabs pricing/funding pages, Partech 2025 Africa VC report, KNBS/KIPPRA/Laterite labor statistics, SASRA SACCO data, Safaricom Daraja docs, Meta WhatsApp pricing docs, Africa's Talking rate cards, Kenya Data Protection Act 2019 / ODPC guidance, Jacaranda Health PROMPTS, Viamo 3-2-1, Project HealthLine (CHI), CGAP oral-first UX research, Masakhane/Sunbird AI/PazaBench/Lacuna Fund, Lynk/SweepSouth/Kandua teardowns, The Flip's Lynk post-mortem, a16z data-moat analysis, HBS marketplace trust research, Tala HBS case, YC/Launch Africa/Norrsken22 portfolio data. Search evidence archived per agent; full per-agent reports in `worklog.md`.
