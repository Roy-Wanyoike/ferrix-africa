"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  Briefcase,
  Copy,
  Cpu,
  FileText,
  GraduationCap,
  Handshake,
  Loader2,
  MapPin,
  ScanSearch,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { t, type Lang } from "@/lib/i18n";
import type { ScoredMatch, StructuredProfile } from "@/lib/types";

/* ---------------- Signals panel ---------------- */

export function SignalsPanel({
  signals,
  lang,
  mode,
}: {
  signals: string[];
  lang: Lang;
  mode: "idle" | "live" | "fallback";
}) {
  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-stone-800">
          <ScanSearch className="h-4 w-4 text-emerald-600" />
          <h2>{t("signals.title", lang)}</h2>
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              mode === "live"
                ? "bg-emerald-100 text-emerald-700"
                : mode === "fallback"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-100 text-stone-500"
            }`}
          >
            {mode === "live" ? (
              <>
                <Cpu className="h-3 w-3" /> {t("chat.mode.live", lang)}
              </>
            ) : mode === "fallback" ? (
              <>
                <Cpu className="h-3 w-3" /> {t("chat.mode.fallback", lang)}
              </>
            ) : (
              t("chat.mode.standby", lang)
            )}
          </span>
        </CardTitle>
        <p className="text-xs text-stone-500">{t("signals.sub", lang)}</p>
      </CardHeader>
      <CardContent>
        {signals.length === 0 ? (
          <p className="text-xs italic text-stone-500">{t("signals.empty", lang)}</p>
        ) : (
          <ul className="space-y-1.5">
            {signals.map((s, i) => (
              <motion.li
                key={`${s}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 rounded-lg bg-stone-50 px-2.5 py-1.5 text-xs text-stone-700"
              >
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {s}
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Profile card ---------------- */

export function ProfileCard({ profile, lang }: { profile: StructuredProfile; lang: Lang }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-emerald-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-stone-800">
            <Bot className="h-4 w-4 text-emerald-600" />
            <h2>{t("profile.title", lang)}</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-lg font-black text-stone-900">{profile.name}</div>
            <div className="text-sm text-stone-600">{profile.summary}</div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-stone-500">
              <span>{t("profile.confidence", lang)}</span>
              <span className="text-emerald-700">{Math.round(profile.confidence * 100)}%</span>
            </div>
            <Progress value={profile.confidence * 100} className="h-2" />
          </div>

          <div>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-500">
              {t("case.skills", lang)}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <Badge key={s} variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <dl className="space-y-1.5 text-xs text-stone-600">
            <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold text-stone-500">{t("profile.experience", lang)}</span><span>{profile.experience}</span></div>
            <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold text-stone-500">{t("profile.digital", lang)}</span><span>{profile.digitalLiteracy}</span></div>
            <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold text-stone-500">{t("profile.availability", lang)}</span><span>{profile.availability}</span></div>
            <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold text-stone-500">{t("profile.goal", lang)}</span><span>{profile.goal}</span></div>
          </dl>

          {profile.verificationFlags.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <Handshake className="h-3.5 w-3.5" />
                {t("profile.verification", lang)}
              </div>
              <ul className="mt-1.5 space-y-0.5">
                {profile.verificationFlags.map((v) => (
                  <li key={v} className="text-xs text-amber-700">• {v}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------------- Matches ---------------- */

const typeColors: Record<string, string> = {
  COURSE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  GIG: "bg-amber-100 text-amber-800 border-amber-200",
  JOB: "bg-stone-200 text-stone-800 border-stone-300",
  MICROWORK: "bg-rose-100 text-rose-700 border-rose-200",
};

export function MatchList({ matches, lang }: { matches: ScoredMatch[]; lang: Lang }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Wallet className="h-4 w-4 text-emerald-600" />
        <h2 className="text-sm font-bold text-stone-800">{t("matches.title", lang)}</h2>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-stone-500">
          {t("matches.note", lang)}
        </span>
      </div>
      {matches.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card className="border-stone-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] font-bold ${typeColors[m.opportunity.type] ?? ""}`}>
                      {m.opportunity.type}
                    </Badge>
                    <h3 className="text-sm font-bold text-stone-900">{m.opportunity.title}</h3>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    {m.opportunity.provider} · <MapPin className="inline h-3 w-3" /> {m.opportunity.location}
                  </div>
                </div>
                <div className="shrink-0 rounded-xl bg-emerald-700 px-2.5 py-1.5 text-center text-white">
                  <div className="text-sm font-black leading-none">{Math.round(m.score * 100)}%</div>
                  <div className="text-[9px] uppercase tracking-wide text-white/90">{t("match.label", lang)}</div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-stone-700">
                <span><span aria-hidden="true">💰</span> {m.opportunity.payRange}</span>
                {m.opportunity.duration && <span><span aria-hidden="true">⏱</span> {m.opportunity.duration}</span>}
              </div>

              <p className="mt-2 text-xs leading-relaxed text-stone-600">{m.opportunity.description}</p>

              <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  {t("matches.why", lang)}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {m.reasons.map((r) => (
                    <li key={r} className="text-xs text-emerald-900"><span aria-hidden="true">✓</span> {r}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ---------------- Track record (work passport) ---------------- */

interface TrackEntry {
  id: string;
  kind: string;
  title: string;
  org: string | null;
  detail: string | null;
  rating: number | null;
  verified: boolean;
  verifiedBy: string | null;
  occurredAt: string;
}

interface TrackSummary {
  placements: number;
  trainings: number;
  reviews: number;
  avgRating: number | null;
  verifiedCount: number;
  lastVerifiedAt: string | null;
}

const kindStyles: Record<string, string> = {
  PLACEMENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  TRAINING: "bg-sky-100 text-sky-800 border-sky-200",
  REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
};

export function TrackRecordPanel({
  candidateId,
  lang,
  workerName,
}: {
  candidateId: string;
  lang: Lang;
  workerName?: string;
}) {
  const [entries, setEntries] = useState<TrackEntry[] | null>(null);
  const [summary, setSummary] = useState<TrackSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let live = true;
    fetch(`/api/track-record?candidateId=${candidateId}`)
      .then((r) => {
        if (!r.ok) throw new Error("track-record request failed");
        return r.json();
      })
      .then((d) => {
        if (!live) return;
        setEntries(d.entries ?? []);
        setSummary(d.summary ?? null);
        setError(false);
      })
      .catch(() => {
        if (!live) return;
        setEntries(null);
        setError(true); // FE-11: surface failure instead of a silent empty state
      });
    return () => {
      live = false;
    };
  }, [candidateId, retryKey]);

  const shareText = () => {
    const lines = [
      `${workerName || t("case.worker", lang)} — ${t("track.shareTitle", lang)}`,
      ...(
        entries ?? []
      ).map(
        (e) =>
          `• ${kindLabel(e.kind)} — ${e.title}${e.org ? ` @ ${e.org}` : ""}${e.rating ? ` (${e.rating}★)` : ""} — ${t("track.verifiedBy", lang)} ${e.verifiedBy ?? t("nav.coordinator", lang)}`
      ),
    ];
    return lines.join("\n");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText());
    } catch {
      /* clipboard unavailable in some contexts */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(lang === "sw" ? "sw-KE" : "en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return new Date(iso).toLocaleDateString();
    }
  };

  const kindLabel = (k: string) =>
    k === "PLACEMENT"
      ? t("track.kind.placement", lang)
      : k === "TRAINING"
        ? t("track.kind.training", lang)
        : t("track.kind.review", lang);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-emerald-300 bg-gradient-to-br from-emerald-50/70 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-stone-800">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <h2>{t("track.title", lang)}</h2>
          </CardTitle>
          <p className="text-xs text-stone-500">{t("track.sub", lang)}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary && summary.verifiedCount > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge className="border border-emerald-200 bg-emerald-700 text-white">
                <Briefcase className="mr-1 h-3 w-3" /> {summary.placements} {t("track.placements", lang)}
              </Badge>
              {summary.trainings > 0 && (
                <Badge variant="outline" className="border border-sky-200 bg-sky-50 text-sky-800">
                  <GraduationCap className="mr-1 h-3 w-3" /> {summary.trainings} {t("track.trainings", lang)}
                </Badge>
              )}
              {summary.avgRating != null && (
                <Badge variant="outline" className="border border-amber-200 bg-amber-50 text-amber-800">
                  <Star className="mr-1 h-3 w-3" /> {summary.avgRating}★ {t("track.rating", lang)}
                </Badge>
              )}
            </div>
          )}

          {error && !entries ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-red-700">
              <span>{t("errors.loadFailed", lang)}</span>
              <button
                onClick={() => {
                  setError(false);
                  setRetryKey((k) => k + 1);
                }}
                className="inline-flex min-h-[36px] items-center rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                {t("errors.retryBtn", lang)}
              </button>
            </div>
          ) : !entries ? (
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("common.loading", lang)}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-xs italic text-stone-500">{t("track.empty", lang)}</p>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-emerald-200 pl-4">
              {entries.map((e) => (
                <li key={e.id} className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-[9px] font-black tracking-wide ${kindStyles[e.kind] ?? ""}`}>
                      {kindLabel(e.kind)}
                    </Badge>
                    <span className="text-xs font-bold text-stone-800">{e.title}</span>
                    {e.rating != null && (
                      <span className="text-[10px] font-bold text-amber-700">{"★".repeat(e.rating)}</span>
                    )}
                  </div>
                  {e.detail && <p className="text-xs leading-relaxed text-stone-600">{e.detail}</p>}
                  <div className="text-[10px] text-stone-600">
                    {e.org ? `${e.org} · ` : ""}{fmtDate(e.occurredAt)}
                    {e.verified && e.verifiedBy && (
                      <span className="font-semibold text-emerald-700"> · {t("track.verifiedBy", lang)} {e.verifiedBy}</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {entries && entries.length > 0 && (
            <Button onClick={copy} variant="outline" className="w-full font-bold">
              <Copy className="h-4 w-4" />
              {copied ? t("asset.copied", lang) : t("track.share", lang)}
            </Button>
          )}
          <p className="text-[10px] leading-relaxed text-stone-600">{t("track.autoNote", lang)}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------------- Asset generator ---------------- */

export function AssetPanel({
  candidateId,
  lang,
}: {
  candidateId: string;
  lang: Lang;
}) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, kind: "catalog" }),
      });
      if (!res.ok) throw new Error("asset request failed");
      const data = await res.json();
      setText(data.text ?? null);
    } catch {
      setText(null);
      setError(true); // FE-11: surface failure instead of a silent empty state
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard unavailable in some contexts */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-stone-800">
            <FileText className="h-4 w-4 text-amber-600" />
            <h2>
              {t("asset.title", lang)} — {t("asset.catalog", lang)}
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && !text ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-red-700">
              <span>{t("errors.loadFailed", lang)}</span>
              <button
                onClick={generate}
                className="inline-flex min-h-[36px] items-center rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                {t("errors.retryBtn", lang)}
              </button>
            </div>
          ) : !text ? (
            <Button
              onClick={generate}
              disabled={loading}
              className="w-full bg-amber-500 text-stone-950 font-bold hover:bg-amber-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading", lang)}
                </>
              ) : (
                t("asset.generate", lang)
              )}
            </Button>
          ) : (
            <>
              <div className="whitespace-pre-wrap rounded-xl border border-emerald-200 bg-[#ECE5DD] p-3 text-xs leading-relaxed text-stone-800">
                {text}
              </div>
              <Button onClick={copy} variant="outline" className="w-full font-bold">
                <Copy className="h-4 w-4" />
                {copied ? t("asset.copied", lang) : t("asset.copy", lang)}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------------- Handoff ---------------- */

export function HandoffPanel({
  caseRef,
  lang,
  onOpenCoordinator,
}: {
  caseRef: string;
  lang: Lang;
  onOpenCoordinator: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border-2 border-emerald-600 bg-stone-950 p-5 text-white"
    >
      <div className="flex items-center gap-2 text-emerald-400">
        <Handshake className="h-5 w-5" />
        <h2 className="text-sm font-bold uppercase tracking-wide">{t("handoff.title", lang)}</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-stone-300">{t("handoff.body", lang)}</p>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-stone-900 px-3 py-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <span className="font-mono text-sm font-bold text-amber-300">{caseRef}</span>
        <span className="text-xs text-stone-400">{t("handoff.status", lang)}</span>
      </div>
      <button
        onClick={onOpenCoordinator}
        className="mt-3 min-h-[44px] w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
      >
        {t("nav.coordinator", lang)} →
      </button>
    </motion.div>
  );
}
