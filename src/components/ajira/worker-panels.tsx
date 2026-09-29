"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Bot,
  Briefcase,
  Check,
  Copy,
  Cpu,
  FileText,
  GraduationCap,
  Handshake,
  Loader2,
  MapPin,
  Mic,
  Pause,
  Play,
  ScanSearch,
  ShieldCheck,
  Square,
  Star,
  Volume2,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { t, tf, type Lang } from "@/lib/i18n";
import {
  getSpeakingServerSnapshot,
  getSpeakingSnapshot,
  isSpeechSupported,
  speak,
  stopSpeaking,
  subscribeSpeaking,
} from "@/lib/speech";
import type { ScoredMatch, StructuredProfile } from "@/lib/types";

// useSyncExternalStore plumbing for environment-constant feature detection:
// the server snapshot is always `false`, so SSR renders the degraded UI first
// and supported browsers flip to the real controls right after hydration —
// no hydration mismatch, no setState-in-effect.
const neverSubscribe = () => () => {};
const serverFalse = () => false;

function isRecordingSupported(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.MediaRecorder !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia)
    );
  } catch {
    return false;
  }
}

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

/* ---------------- Spoken match explanations ---------------- */

// Small speaker button on each match card: speaks the existing "why this
// matches" reasons in the current UI language. speak() cancels previous
// playback; a second tap stops. 44px touch target, localized aria-label.
function MatchSpeakButton({ match, lang }: { match: ScoredMatch; lang: Lang }) {
  const speaking = useSyncExternalStore(
    subscribeSpeaking,
    getSpeakingSnapshot,
    getSpeakingServerSnapshot
  );

  const text = `${match.opportunity.title}. ${match.reasons.join(". ")}`;

  return (
    <button
      type="button"
      onClick={() => (speaking ? stopSpeaking() : speak(text, lang))}
      aria-label={t(speaking ? "a11y.matchStop" : "a11y.matchPlay", lang)}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:bg-emerald-100"
    >
      {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}

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
                <div className="flex items-center gap-1">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    {t("matches.why", lang)}
                  </div>
                  <div className="ml-auto -mr-1.5 -mt-1.5">
                    <MatchSpeakButton match={m} lang={lang} />
                  </div>
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

/* ---------------- "Sikiliza Passport Yako" — audible passport ---------------- */

// Prominent play/stop button that reads a natural-language summary of the work
// passport aloud (localized EN/SW). Degrades to a localized explainer line when
// speechSynthesis is unavailable — never a console error.
function PassportListenButton({ text, lang }: { text: string | null; lang: Lang }) {
  const canSpeak = useSyncExternalStore(neverSubscribe, isSpeechSupported, serverFalse);
  const speaking = useSyncExternalStore(
    subscribeSpeaking,
    getSpeakingSnapshot,
    getSpeakingServerSnapshot
  );

  // Leaving the panel stops playback so audio never outlives the UI.
  useEffect(() => () => stopSpeaking(), []);

  if (!canSpeak) {
    return (
      <p className="text-xs italic text-stone-500">
        {t("track.speak.unavailable", lang)}
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => (speaking ? stopSpeaking() : speak(text ?? "", lang))}
        disabled={!text}
        aria-label={t(speaking ? "a11y.passportStop" : "a11y.passportPlay", lang)}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
      >
        {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        {speaking ? t("track.speak.stop", lang) : t("track.speak.play", lang)}
      </button>
      {speaking && (
        <p
          role="status"
          className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
          {t("track.speak.playing", lang)}
        </p>
      )}
    </div>
  );
}

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

  // Natural spoken summary of the passport, built from the same track-record
  // data the panel renders — localized via track.speak.* i18n keys.
  const passportText = (): string | null => {
    if (!entries) return null;
    const name = workerName || t("case.worker", lang);
    const parts: string[] = [tf("track.speak.title", lang, { name })];
    if (summary) {
      if (summary.verifiedCount > 0) {
        parts.push(tf("track.speak.placements", lang, { name, count: summary.verifiedCount }));
      }
      if (summary.trainings > 0) {
        parts.push(tf("track.speak.trainings", lang, { count: summary.trainings }));
      }
      if (summary.avgRating != null && summary.reviews > 0) {
        parts.push(
          tf("track.speak.rating", lang, { name, count: summary.reviews, rating: summary.avgRating })
        );
      }
    }
    // Cap at 8 entries so the audio stays a listenable length.
    for (const e of entries.slice(0, 8)) {
      const title = e.org ? `${e.title}, ${e.org}` : e.title;
      parts.push(tf("track.speak.entry", lang, { kind: kindLabel(e.kind), title }));
    }
    parts.push(t("track.speak.outro", lang));
    return parts.join(" ");
  };

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
          {/* Sikiliza Passport Yako — the passport you can hear */}
          <PassportListenButton text={passportText()} lang={lang} />

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

          {/* 20-second self-recorded intro — reputation you can hear */}
          <VoiceBioSection candidateId={candidateId} lang={lang} />

          <p className="text-[10px] leading-relaxed text-stone-600">{t("track.autoNote", lang)}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------------- Voice bio (self-recorded passport intro) ---------------- */

const BIO_MAX_SECONDS = 25;
// ~0.9MB blob ceiling keeps the base64 JSON body under the API's 1.5MB cap
// (a real 25s opus voice note is ~30–60KB, so honest clients never hit this).
const BIO_MAX_BLOB_BYTES = 900_000;

function pickRecorderMime(): string | undefined {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
    return undefined;
  }
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate;
    } catch {
      /* keep trying */
    }
  }
  return undefined;
}

function VoiceBioSection({ candidateId, lang }: { candidateId: string; lang: Lang }) {
  const [bio, setBio] = useState<{ hasVoiceBio: boolean; audio: string | null } | null>(null);
  const canRecord = useSyncExternalStore(neverSubscribe, isRecordingSupported, serverFalse);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);

  const liveRef = useRef(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isLive = true;
    fetch(`/api/voice-bio?candidateId=${candidateId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("voice-bio load failed"))))
      .then((d) => {
        if (!isLive) return;
        setBio({ hasVoiceBio: Boolean(d.hasVoiceBio), audio: d.audio ?? null });
      })
      .catch(() => {
        if (!isLive) return;
        // Load failure shouldn't hide the recorder — offer it optimistically.
        setBio({ hasVoiceBio: false, audio: null });
      });
    return () => {
      isLive = false;
    };
  }, [candidateId]);

  const clearTimers = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  };

  const stopStreamTracks = (stream: MediaStream) => {
    try {
      stream.getTracks().forEach((tr) => tr.stop());
    } catch {
      /* best-effort */
    }
  };

  const stopRecording = () => {
    clearTimers();
    setRecording(false);
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        /* already inactive */
      }
    }
  };

  // Unmount: never leave a mic open or a timer running; guard every setState.
  useEffect(() => {
    return () => {
      liveRef.current = false;
      clearTimers();
      const rec = recorderRef.current;
      if (rec) {
        rec.onstop = null;
        if (rec.state !== "inactive") {
          try {
            rec.stop();
          } catch {
            /* already stopped */
          }
        }
        stopStreamTracks(rec.stream);
      }
      recorderRef.current = null;
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {
          /* best-effort */
        }
      }
    };
  }, []);

  const startRecording = async () => {
    setError(false);
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!liveRef.current) {
        stopStreamTracks(stream);
        return;
      }
      const mimeType = pickRecorderMime();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        clearTimers();
        stopStreamTracks(stream);
        if (!liveRef.current) return;
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size === 0 || blob.size > BIO_MAX_BLOB_BYTES) {
          setError(true);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!liveRef.current) return;
          const result = typeof reader.result === "string" ? reader.result : null;
          if (result && result.startsWith("data:audio/")) setPreview(result);
          else setError(true);
        };
        reader.onerror = () => {
          if (liveRef.current) setError(true);
        };
        try {
          reader.readAsDataURL(blob);
        } catch {
          if (liveRef.current) setError(true);
        }
      };
      rec.onerror = () => {
        if (!liveRef.current) return;
        clearTimers();
        stopStreamTracks(stream);
        setRecording(false);
        setError(true);
      };

      rec.start();
      setElapsed(0);
      setRecording(true);
      tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      autoStopRef.current = setTimeout(() => stopRecording(), BIO_MAX_SECONDS * 1000);
    } catch {
      // Permission denied / no device / recorder failure — inline message only.
      setError(true);
      setRecording(false);
    }
  };

  const upload = async () => {
    if (!preview || saving) return;
    setSaving(true);
    setError(false);
    try {
      const res = await fetch("/api/voice-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, audio: preview }),
      });
      if (!res.ok) throw new Error("voice-bio upload failed");
      const d = await res.json();
      if (!liveRef.current) return;
      setBio({ hasVoiceBio: Boolean(d.hasVoiceBio), audio: d.audio ?? preview });
      setPreview(null);
      setElapsed(0);
    } catch {
      if (liveRef.current) setError(true);
    } finally {
      if (liveRef.current) setSaving(false);
    }
  };

  const togglePlay = () => {
    const src = bio?.audio;
    if (!src) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(src);
        audioRef.current.onended = () => {
          if (liveRef.current) setPlaying(false);
        };
        audioRef.current.onerror = () => {
          if (liveRef.current) setPlaying(false);
        };
      } else if (audioRef.current.src !== src) {
        audioRef.current.src = src;
        setPlaying(false);
      }
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        const p = audioRef.current.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            if (liveRef.current) setPlaying(false);
          });
        }
        setPlaying(true);
      }
    } catch {
      if (liveRef.current) setPlaying(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-white/70 p-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
        <Mic className="h-3.5 w-3.5 text-emerald-700" />
        {t("bio.title", lang)}
      </div>
      <p className="mt-0.5 text-[10px] leading-relaxed text-stone-500">{t("bio.sub", lang)}</p>

      {!canRecord ? (
        // Graceful degradation: headless browsers / older Android — the rest of
        // the passport keeps working, no console errors.
        <p className="mt-2 text-xs italic text-stone-500">{t("bio.unsupported", lang)}</p>
      ) : recording ? (
        <button
          type="button"
          onClick={stopRecording}
          aria-label={t("common.stop", lang)}
          className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-500"
        >
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-white" />
          {tf("bio.recording", lang, { s: elapsed })}
        </button>
      ) : preview ? (
        <div className="mt-2 space-y-2">
          <audio controls src={preview} className="w-full" aria-label={t("bio.preview", lang)} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={upload}
              disabled={saving}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t("bio.save", lang)}
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setElapsed(0);
              }}
              className="min-h-[44px] flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-600 hover:border-emerald-500 hover:text-emerald-700"
            >
              {t("bio.retry", lang)}
            </button>
          </div>
        </div>
      ) : bio?.hasVoiceBio && bio.audio ? (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={t(playing ? "a11y.bioPause" : "a11y.bioPlay", lang)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-600"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {t("bio.play", lang)}
          </button>
          <button
            type="button"
            onClick={startRecording}
            className="min-h-[44px] flex-1 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
          >
            {t("bio.retry", lang)}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
        >
          <Mic className="h-4 w-4" />
          {t("bio.record", lang)}
        </button>
      )}

      {bio?.hasVoiceBio && !preview && (
        <p
          role="status"
          className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700"
        >
          <BadgeCheck className="h-3 w-3 shrink-0" /> {t("bio.saved", lang)}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-[10px] font-semibold text-red-700">{t("bio.error", lang)}</p>
      )}
    </div>
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
