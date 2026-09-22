"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  Copy,
  Cpu,
  FileText,
  Handshake,
  Loader2,
  MapPin,
  ScanSearch,
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
          {t("signals.title", lang)}
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
              "standby"
            )}
          </span>
        </CardTitle>
        <p className="text-xs text-stone-500">{t("signals.sub", lang)}</p>
      </CardHeader>
      <CardContent>
        {signals.length === 0 ? (
          <p className="text-xs italic text-stone-400">{t("signals.empty", lang)}</p>
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
            {t("profile.title", lang)}
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
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-400">
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
            <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold text-stone-500">Experience</span><span>{profile.experience}</span></div>
            <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold text-stone-500">Digital</span><span>{profile.digitalLiteracy}</span></div>
            <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold text-stone-500">Availability</span><span>{profile.availability}</span></div>
            <div className="flex gap-2"><span className="w-28 shrink-0 font-semibold text-stone-500">Goal</span><span>{profile.goal}</span></div>
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
        <h3 className="text-sm font-bold text-stone-800">{t("matches.title", lang)}</h3>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-stone-400">
          AI recommends · human places
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
                    <h4 className="text-sm font-bold text-stone-900">{m.opportunity.title}</h4>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    {m.opportunity.provider} · <MapPin className="inline h-3 w-3" /> {m.opportunity.location}
                  </div>
                </div>
                <div className="shrink-0 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-center text-white">
                  <div className="text-sm font-black leading-none">{Math.round(m.score * 100)}%</div>
                  <div className="text-[9px] uppercase tracking-wide opacity-80">match</div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-stone-700">
                <span>💰 {m.opportunity.payRange}</span>
                {m.opportunity.duration && <span>⏱ {m.opportunity.duration}</span>}
              </div>

              <p className="mt-2 text-xs leading-relaxed text-stone-600">{m.opportunity.description}</p>

              <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  {t("matches.why", lang)}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {m.reasons.map((r) => (
                    <li key={r} className="text-xs text-emerald-900">✓ {r}</li>
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

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, kind: "catalog" }),
      });
      const data = await res.json();
      setText(data.text ?? null);
    } catch {
      setText(null);
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
            {t("asset.title", lang)} — {t("asset.catalog", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!text ? (
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
        <span className="text-sm font-bold uppercase tracking-wide">{t("handoff.title", lang)}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-stone-300">{t("handoff.body", lang)}</p>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-stone-900 px-3 py-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <span className="font-mono text-sm font-bold text-amber-300">{caseRef}</span>
        <span className="text-xs text-stone-400">— new · awaiting assignment</span>
      </div>
      <button
        onClick={onOpenCoordinator}
        className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-stone-950 transition-colors hover:bg-emerald-400"
      >
        {t("nav.coordinator", lang)} →
      </button>
    </motion.div>
  );
}
