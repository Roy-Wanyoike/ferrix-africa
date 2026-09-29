import type { StructuredProfile } from "./ai";

// Deterministic, explainable matching between a profile and opportunities.
// The AI never places anyone — it only proposes; this scorer is transparent
// enough to show judges exactly WHY each match was made.

/**
 * MATCHER_VERSION — versioning contract (STARTUP_VISION.md §8 #3).
 *
 * - Bump this constant (v1 → v2 → …) on ANY scoring-semantics change: the
 *   score formula/weights below, the GOAL_HINTS table, the reason strings,
 *   or the profile/opportunity fields the scorer reads. Cosmetic refactors
 *   that cannot change a score or a reason do NOT require a bump.
 * - Every persisted Match row is stamped with the version that produced it
 *   (`Match.matcherVersion`, written by /api/analyze), so any historical
 *   score can be reproduced and audited — the Kenya DP Act §9 posture of
 *   carrying a version on every automated decision.
 * - Responses carry the version that PRODUCED them, never a
 *   client-requested one: /api/analyze echoes `matcherVersion` at the top
 *   level and per match. Consumers (NGOs, counties, SACCOs) should log the
 *   version they received alongside the scores they used.
 *
 * v1: initial scorer — 0.55 × opportunity-tag coverage + 0.30 × skill-tag
 * overlap, +0.08 for a second reason and +0.07 for a third, clamped to
 * [0.05, 0.98] and rounded to 2 decimals.
 */
export const MATCHER_VERSION = "v1";

const GOAL_HINTS: { words: string[]; types: string[]; reason: string }[] = [
  {
    words: ["online", "work online", "mtandaoni", "internet"],
    types: ["MICROWORK", "COURSE"],
    reason: "Fits your goal of working online",
  },
  {
    words: ["income", "kipato", "money", "pesa", "stable"],
    types: ["GIG", "JOB"],
    reason: "Direct path to steadier daily income",
  },
  {
    words: ["business", "biashara", "grow", "customers", "wateja", "sell"],
    types: ["COURSE", "GIG"],
    reason: "Helps you grow your own business",
  },
  {
    words: ["formal job", "kazi rasmi", "job", "employ"],
    types: ["JOB"],
    reason: "A formal job matching your experience",
  },
];

export interface MatchLike {
  id: string;
  title: string;
  type: string;
  provider: string;
  location: string;
  payRange: string;
  duration?: string | null;
  description: string;
  tags: string[];
  actionUrl?: string | null;
  score?: number;
  reasons?: string[];
}

export const prettyTag = (tag: string) =>
  tag
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const scoreOpportunity = (
  profile: StructuredProfile,
  opp: MatchLike
): { score: number; reasons: string[] } => {
  const oppTags = new Set(opp.tags.map((t) => t.toLowerCase()));
  const skillTags = profile.tags.map((t) => t.toLowerCase());
  const matched = skillTags.filter((t) => oppTags.has(t));

  const reasons: string[] = [];
  if (matched.length > 0) {
    reasons.push(
      `Uses your strengths: ${matched.slice(0, 3).map(prettyTag).join(", ")}`
    );
  }

  const goalText = `${profile.goal} ${profile.summary}`.toLowerCase();
  for (const hint of GOAL_HINTS) {
    if (hint.types.includes(opp.type) && hint.words.some((w) => goalText.includes(w))) {
      if (!reasons.includes(hint.reason)) reasons.push(hint.reason);
      break;
    }
  }

  // constraint-aware nudge: data-cost pushes toward free courses
  if (
    profile.constraints.some((c) => c.includes("data-cost") || c.includes("free")) &&
    /free/i.test(opp.payRange)
  ) {
    reasons.push("Free — no upfront cost");
  }

  const coverage = opp.tags.length > 0 ? matched.length / opp.tags.length : 0;
  const overlap = skillTags.length > 0 ? matched.length / skillTags.length : 0;
  let score = 0.55 * coverage + 0.3 * overlap;
  if (reasons.length > 1) score += 0.08;
  if (reasons.length > 2) score += 0.07;
  score = Math.min(0.98, Math.max(0.05, score));

  if (reasons.length === 0) reasons.push("A nearby step from your current work");
  return { score: Math.round(score * 100) / 100, reasons };
};

export const rankOpportunities = <T extends MatchLike>(
  profile: StructuredProfile,
  opps: T[],
  top = 4
): (T & { score: number; reasons: string[] })[] =>
  opps
    .map((o) => ({ ...o, ...scoreOpportunity(profile, o) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
