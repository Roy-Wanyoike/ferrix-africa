"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  Bot,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  FileClock,
  GraduationCap,
  Handshake,
  PhoneCall,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { t, type Lang } from "@/lib/i18n";
import type { CaseDetail, Stats } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface Props {
  lang: Lang;
  focusRef: string | null;
}

const actorStyles: Record<string, { dot: string; label: string }> = {
  AI: { dot: "bg-emerald-500", label: "text-emerald-700" },
  Coordinator: { dot: "bg-amber-500", label: "text-amber-700" },
  System: { dot: "bg-stone-400", label: "text-stone-500" },
};

const statusColors: Record<string, string> = {
  new: "bg-rose-100 text-rose-700 border-rose-200",
  accepted: "bg-amber-100 text-amber-800 border-amber-200",
  contacted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  placed: "bg-emerald-600 text-white border-emerald-600",
  resolved: "bg-stone-200 text-stone-700 border-stone-300",
};

const priorityColors: Record<string, string> = {
  high: "bg-rose-600 text-white",
  normal: "bg-stone-200 text-stone-700",
  low: "bg-stone-100 text-stone-500",
};

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

// The worker's verified work passport, shown beside the AI summary.
// refreshKey (status/updatedAt) forces a refetch after coordinator actions.
function TrackRecordSection({ candidateId, lang, refreshKey }: { candidateId: string; lang: Lang; refreshKey: string }) {
  const [entries, setEntries] = useState<TrackEntry[]>([]);

  useEffect(() => {
    let live = true;
    fetch(`/api/track-record?candidateId=${candidateId}`)
      .then((r) => r.json())
      .then((d) => live && setEntries(d.entries ?? []))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [candidateId, refreshKey]);

  const kindLabel = (k: string) =>
    k === "PLACEMENT"
      ? t("track.kind.placement", lang)
      : k === "TRAINING"
        ? t("track.kind.training", lang)
        : t("track.kind.review", lang);

  return (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-stone-800">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          {t("case.track", lang)}
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            {entries.length} {lang === "sw" ? "rekodi" : "records"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-xs italic text-stone-500">{t("track.empty", lang)}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className="max-w-full rounded-xl border border-emerald-200 bg-white px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {e.kind === "PLACEMENT" ? (
                    <Briefcase className="h-3 w-3 text-emerald-600" />
                  ) : e.kind === "TRAINING" ? (
                    <GraduationCap className="h-3 w-3 text-sky-600" />
                  ) : (
                    <Star className="h-3 w-3 text-amber-500" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-wide text-stone-400">
                    {kindLabel(e.kind)}
                  </span>
                  {e.rating != null && (
                    <span className="text-[10px] font-bold text-amber-600">{"★".repeat(e.rating)}</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs font-bold text-stone-800">{e.title}</div>
                {e.org && <div className="text-[10px] text-stone-500">{e.org}</div>}
                {e.verifiedBy && (
                  <div className="mt-0.5 text-[9px] font-semibold text-emerald-700">
                    ✓ {t("track.verifiedBy", lang)} {e.verifiedBy}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function CoordinatorView({ lang, focusRef }: Props) {
  const { toast } = useToast();
  const [cases, setCases] = useState<CaseDetail[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [placeOpp, setPlaceOpp] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([fetch("/api/cases"), fetch("/api/stats")]);
      const cData = await cRes.json();
      const sData = await sRes.json();
      setCases(cData.cases ?? []);
      setStats(sData);
    } catch {
      toast({ title: "Could not load cases", description: "Check the connection and refresh." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (cases.length === 0 || selectedId) return;
    const focus = focusRef ? cases.find((c) => c.ref === focusRef) : null;
    const firstNew = cases.find((c) => c.status === "new");
    setSelectedId((focus ?? firstNew ?? cases[0]).id);
  }, [cases, selectedId, focusRef]);

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  const act = async (action: string, opportunityId?: string) => {
    if (!selected) return;
    setActing(action);
    try {
      const res = await fetch(`/api/cases/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, opportunityId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({
        title: `${selected.ref} — ${t(`status.${data.status}`, lang)}`,
        description: "Audit trail updated. Every action is attributable.",
      });
      await load();
    } catch (err) {
      toast({ title: "Action failed", description: err instanceof Error ? err.message : "Try again." });
    } finally {
      setActing(null);
    }
  };

  const statCards = stats
    ? [
        { label: t("stats.candidates", lang), value: stats.candidatesAssessed, icon: Activity },
        { label: t("stats.placements", lang), value: stats.placements, icon: Handshake },
        { label: t("stats.resolved", lang), value: stats.resolved, icon: CheckCircle2 },
        { label: t("stats.response", lang), value: stats.medianFirstContact, icon: FileClock },
        { label: t("stats.verified", lang), value: stats.humanVerifiedActions, icon: BadgeCheck },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">{t("coord.title", lang)}</h1>
          <p className="text-sm text-stone-500">{t("coord.sub", lang)}</p>
        </div>
        <button
          onClick={load}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:border-emerald-500 hover:text-emerald-700"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} className="border-stone-200">
            <CardContent className="p-4">
              <s.icon className="h-4 w-4 text-emerald-600" />
              <div className="mt-2 text-2xl font-black text-stone-900">{s.value}</div>
              <div className="text-[11px] font-semibold text-stone-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* ---------- QUEUE ---------- */}
        <Card className="border-stone-200 self-start">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-stone-800">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
              {t("cases.title", lang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[560px] space-y-2 overflow-y-auto pr-1.5">
            {loading && <p className="text-xs text-stone-400">{t("common.loading", lang)}</p>}
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  setPlaceOpp("");
                }}
                className={`w-full rounded-xl border p-3 text-left transition-all ${
                  selectedId === c.id
                    ? "border-emerald-500 bg-emerald-50 shadow-sm"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-stone-800">{c.ref}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${priorityColors[c.priority]}`}>
                    {c.priority}
                  </span>
                  <span
                    className={`ml-auto rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusColors[c.status]}`}
                  >
                    {t(`status.${c.status}`, lang)}
                  </span>
                </div>
                <div className="mt-1 truncate text-sm font-bold text-stone-900">
                  {c.candidate.name ?? "Unnamed"}
                </div>
                <div className="truncate text-[11px] text-stone-500">
                  {c.candidate.personaLabel ?? "Worker"} · {c.candidate.location ?? "Nairobi"}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* ---------- DETAIL ---------- */}
        {!selected ? (
          <Card className="border-stone-200">
            <CardContent className="flex h-64 items-center justify-center text-sm text-stone-400">
              {t("case.select", lang)}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* trust banner */}
            <div className="flex items-start gap-2.5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <div className="text-sm font-black text-amber-900">{t("case.trust", lang)}</div>
                <div className="mt-0.5 text-xs text-amber-700">
                  {t("case.assignee", lang)}: <b>{selected.assignedTo ?? "—"}</b>
                </div>
              </div>
            </div>

            {/* AI summary */}
            <Card className="border-stone-800 bg-stone-950 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <Bot className="h-4 w-4 text-emerald-400" />
                  {t("case.summary", lang)}
                  <span className="ml-auto font-mono text-xs text-stone-400">{selected.ref}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-black">{selected.candidate.name}</span>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                    {selected.candidate.personaLabel ?? "Worker"}
                  </Badge>
                  <Badge variant="outline" className="border-stone-600 text-stone-300">
                    {selected.candidate.location}
                  </Badge>
                  <span className="ml-auto text-xs font-bold text-emerald-400">
                    {t("profile.confidence", lang)}: {selected.candidate.confidence != null ? `${Math.round(selected.candidate.confidence * 100)}%` : "—"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-stone-200">{selected.candidate.aiSummary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.candidate.skills.map((s) => (
                    <span key={s} className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                      {s}
                    </span>
                  ))}
                </div>
                <dl className="grid gap-x-6 gap-y-1 text-xs text-stone-400 sm:grid-cols-2">
                  <div><span className="font-semibold text-stone-500">Experience:</span> {selected.candidate.experience}</div>
                  <div><span className="font-semibold text-stone-500">Digital:</span> {selected.candidate.digitalLiteracy}</div>
                  <div><span className="font-semibold text-stone-500">Availability:</span> {selected.candidate.availability}</div>
                  <div><span className="font-semibold text-stone-500">Phone:</span> {selected.candidate.phone}</div>
                  <div className="sm:col-span-2"><span className="font-semibold text-stone-500">Goal:</span> {selected.candidate.goal}</div>
                </dl>
              </CardContent>
            </Card>

            {/* worker track record */}
            <TrackRecordSection
              candidateId={selected.candidate.id}
              lang={lang}
              refreshKey={`${selected.status}-${selected.updatedAt}`}
            />

            {/* matches */}
            {selected.matches.length > 0 && (
              <div>
                <h3 className="mb-2 px-1 text-sm font-bold text-stone-800">{t("case.matches", lang)}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.matches.map((m) => (
                    <Card key={m.id} className="border-stone-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge variant="outline" className="text-[9px] font-bold border-stone-300 text-stone-600">
                              {m.opportunity.type}
                            </Badge>
                            <div className="mt-1 text-sm font-bold text-stone-900">{m.opportunity.title}</div>
                            <div className="text-[11px] text-stone-500">{m.opportunity.provider}</div>
                          </div>
                          <div className="shrink-0 rounded-lg bg-emerald-600 px-2 py-1 text-center text-white">
                            <div className="text-xs font-black leading-none">{Math.round(m.score * 100)}%</div>
                          </div>
                        </div>
                        <div className="mt-1.5 text-xs font-semibold text-stone-700">💰 {m.opportunity.payRange}</div>
                        <ul className="mt-1.5 space-y-0.5">
                          {m.reasons.map((r) => (
                            <li key={r} className="text-[11px] text-emerald-800">✓ {r}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* actions */}
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-stone-800">{t("case.actions", lang)}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                {selected.status === "new" && (
                  <button
                    onClick={() => act("accept")}
                    disabled={acting !== null}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" /> {t("case.accept", lang)}
                  </button>
                )}
                {selected.status === "accepted" && (
                  <button
                    onClick={() => act("contact")}
                    disabled={acting !== null}
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    <PhoneCall className="h-4 w-4" /> {t("case.contact", lang)}
                  </button>
                )}
                {selected.status === "contacted" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={placeOpp} onValueChange={setPlaceOpp}>
                      <SelectTrigger className="w-[260px] bg-white">
                        <SelectValue placeholder="Choose opportunity…" />
                      </SelectTrigger>
                      <SelectContent>
                        {selected.matches.map((m) => (
                          <SelectItem key={m.opportunity.id} value={m.opportunity.id}>
                            {m.opportunity.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => placeOpp && act("place", placeOpp)}
                      disabled={!placeOpp || acting !== null}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      <Handshake className="h-4 w-4" /> {t("case.place", lang)}
                    </button>
                  </div>
                )}
                {selected.status === "placed" && (
                  <button
                    onClick={() => act("resolve")}
                    disabled={acting !== null}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-600 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> {t("case.resolve", lang)}
                  </button>
                )}
                {selected.status === "resolved" && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> {t("status.resolved", lang)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* audit trail */}
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-stone-800">
                  <FileClock className="h-4 w-4 text-stone-500" />
                  {t("case.timeline", lang)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative space-y-4 border-l-2 border-stone-200 pl-5">
                  {selected.events.map((e) => {
                    const a = actorStyles[e.actor] ?? actorStyles.System;
                    return (
                      <li key={e.id} className="relative">
                        <span className={`absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${a.dot}`} />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-black uppercase ${a.label}`}>{e.actor}</span>
                          <span className="text-xs font-semibold text-stone-700">{e.action}</span>
                          <span className="ml-auto text-[10px] text-stone-400">
                            {format(new Date(e.createdAt), "d MMM · HH:mm")}
                          </span>
                        </div>
                        {e.detail && <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{e.detail}</p>}
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
