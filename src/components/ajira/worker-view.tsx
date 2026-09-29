"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Mic,
  MoreVertical,
  Phone,
  RefreshCcw,
  Send,
  Sparkles,
  Volume2,
} from "lucide-react";
import { PERSONAS, STAGE_ORDER, SUGGESTIONS, SIGNAL_RULES, type ChatStage, type Lang, type Persona } from "@/lib/data";
import { t, tf } from "@/lib/i18n";
import { speak, stopSpeaking } from "@/lib/speech";
import type { AnalyzeResponse, ChatMsg } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  AssetPanel,
  HandoffPanel,
  MatchList,
  ProfileCard,
  SignalsPanel,
  TrackRecordPanel,
} from "./worker-panels";

interface Props {
  lang: Lang;
  onHandoff: (caseRef: string) => void;
}

const isSwahili = (text: string) =>
  /\b(na|ya|wa|kwa|mimi|habari|asante|sasa|nataka|nko|niko|hii|yangu|unataka|vipi|kazi|pesa|msaada)\b/i.test(
    text
  );

// Environment-constant feature detection via useSyncExternalStore: the server
// snapshot is always `false`, so SSR/hydration render the disabled toggle and
// supported browsers enable it right after mount — no mismatch, no effects.
const neverSubscribe = () => () => {};
const serverFalse = () => false;

// Minimal structural typing for the (non-standard) Web Speech recognition API.
interface SRResult {
  0: { transcript: string };
  length: number;
}
interface SREvent {
  results: { 0: SRResult; length: number };
}
interface SRInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type SRCtor = new () => SRInstance;

const getSRCtor = (): SRCtor | null => {
  try {
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  } catch {
    return null;
  }
};

function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && getSRCtor() !== null;
}

export default function WorkerView({ lang, onHandoff }: Props) {
  const { toast } = useToast();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [stage, setStage] = useState<ChatStage>("greet");
  const [mode, setMode] = useState<"idle" | "live" | "fallback">("idle");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  // ---- Voice interview (optional, default OFF; typed flow untouched) ----
  const [voiceMode, setVoiceMode] = useState(false);
  const srSupported = useSyncExternalStore(
    neverSubscribe,
    isSpeechRecognitionSupported,
    serverFalse
  );
  const [vtListening, setVtListening] = useState(false);
  const [vtTranscript, setVtTranscript] = useState<string | null>(null);
  const [vtError, setVtError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);
  const vtRecogRef = useRef<SRInstance | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };
  useEffect(scrollToBottom, [messages, sending]);

  // Legacy inline utterance (per-message listen button, auto-read toggle).
  // Kept byte-identical in behavior; the interview/panels use speech.ts instead.
  const speakInline = (text: string) => {
    stopSpeaking(); // clear speech.ts observable state if a passport/match is playing
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "sw" ? "sw-KE" : "en-US";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch {
      /* TTS unavailable — silent */
    }
  };

  // ---- Voice interview plumbing ----

  // The current interview question is the copilot's latest reply — the exact
  // same text the chat flow produced, one turn at a time.
  const currentQuestion =
    messages.length > 0 && messages[messages.length - 1].role === "assistant"
      ? messages[messages.length - 1].content
      : null;

  // In voice-interview mode the copilot speaks the question out loud; changing
  // turn/lang/mode (or unmounting) cancels playback via the cleanup.
  useEffect(() => {
    if (!voiceMode || !currentQuestion) return;
    speak(currentQuestion, lang);
    return () => stopSpeaking();
  }, [voiceMode, currentQuestion, lang]);

  // Safety net: never leave speech running after the view goes away.
  useEffect(() => () => stopSpeaking(), []);

  // AI signals from user messages (client-side keyword spotting)
  const signals: string[] = (() => {
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length === 0) return [];
    const out: string[] = [];
    const joined = userMsgs.map((m) => m.content).join(" ");
    out.push(`${t("signals.language", lang)}: ${isSwahili(joined) ? "Kiswahili" : "English"}`);
    for (const rule of SIGNAL_RULES) {
      if (rule.keywords.some((k) => joined.toLowerCase().includes(k))) {
        out.push(rule.label);
      }
    }
    return out;
  })();

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("chat failed");
    return res.json();
  };

  const start = async (p: Persona | null, text: string) => {
    if (sending) return; // FE-12: same double-submit guard as send()
    setPersona(p);
    setSending(true);
    try {
      const data = await post({ persona: p?.key, message: text, language: lang });
      setCandidateId(data.candidateId);
      setMessages(data.messages);
      setStage(data.stage);
      setMode(data.mode === "live" ? "live" : "fallback");
    } catch {
      toast({ title: t("toast.network.title", lang), description: t("toast.network.body", lang) });
    } finally {
      setSending(false);
    }
  };

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;
    setInput("");
    if (!candidateId) return start(persona, clean);

    const tmpId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tmpId, role: "user", content: clean }]);
    setSending(true);
    try {
      const data = await post({ candidateId, message: clean, language: lang });
      setMessages(data.messages);
      setStage(data.stage);
      setMode(data.mode === "live" ? "live" : "fallback");
      // Voice interview speaks the reply itself (effect above) — avoid doubling.
      if (autoSpeak && !voiceMode && data.mode === "live") {
        const last = data.messages[data.messages.length - 1];
        if (last?.role === "assistant") speakInline(last.content);
      }
    } catch {
      setMessages((m) => m.filter((msg) => msg.id !== tmpId)); // FE-12: roll back optimistic bubble
      setInput(clean);
      toast({ title: t("toast.send.title", lang), description: t("toast.send.body", lang) });
    } finally {
      setSending(false);
    }
  };

  const restart = () => {
    setCandidateId(null);
    setPersona(null);
    setMessages([]);
    setStage("greet");
    setMode("idle");
    setResult(null);
    setInput("");
    // Reset any in-flight voice-interview turn.
    try {
      vtRecogRef.current?.stop();
    } catch {
      /* not listening */
    }
    setVtListening(false);
    setVtTranscript(null);
    setVtError(false);
    stopSpeaking();
  };

  const analyze = async () => {
    if (!candidateId || analyzing) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast({
        title: `${t("toast.case.created", lang)}: ${data.case.ref}`,
        description: t("toast.case.body", lang),
      });
    } catch {
      toast({ title: t("toast.analyze.title", lang), description: t("toast.analyze.body", lang) });
    } finally {
      setAnalyzing(false);
    }
  };

  const mic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: t("voice.unavailable", lang) });
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    try {
      const rec = new SR();
      recogRef.current = rec;
      rec.lang = lang === "sw" ? "sw-KE" : "en-US";
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript ?? "";
        if (text) send(text);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => {
        setListening(false);
        toast({ title: t("voice.unavailable", lang) });
      };
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      toast({ title: t("voice.unavailable", lang) });
    }
  };

  const suggestions = SUGGESTIONS[stage][lang];

  // Voice interview: capture ONE answer via SpeechRecognition, show the
  // transcript, let the worker confirm before advancing the same chat machine.
  const vtMic = () => {
    const SR = getSRCtor();
    if (!SR) return; // toggle is disabled when unsupported — belt and braces
    if (vtListening) {
      try {
        vtRecogRef.current?.stop();
      } catch {
        /* already stopped */
      }
      setVtListening(false);
      return;
    }
    stopSpeaking(); // don't make the mic hear the question it just asked
    setVtError(false);
    setVtTranscript(null);
    try {
      const rec = new SR();
      vtRecogRef.current = rec;
      rec.lang = lang === "sw" ? "sw-KE" : "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: SREvent) => {
        const text = e.results?.[0]?.[0]?.transcript ?? "";
        if (text) setVtTranscript(text);
      };
      rec.onend = () => setVtListening(false);
      rec.onerror = () => {
        setVtListening(false);
        setVtError(true);
      };
      rec.start();
      setVtListening(true);
    } catch {
      setVtListening(false);
      setVtError(true);
    }
  };

  const confirmAnswer = () => {
    if (!vtTranscript || sending) return;
    const said = vtTranscript;
    setVtTranscript(null);
    send(said); // same path as the typed flow → same stage machine, same profile
  };

  const interviewTotal = STAGE_ORDER.length - 1; // "ready" is not a question
  const interviewIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">{t("worker.title", lang)}</h1>
          <p className="text-sm text-stone-500">{t("worker.sub", lang)}</p>
        </div>
        <button
          onClick={restart}
          className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-600 hover:border-emerald-500 hover:text-emerald-700 sm:min-h-[36px] sm:py-1.5"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> {t("worker.restart", lang)}
        </button>
      </div>

      {/* persona chooser */}
      {!candidateId && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{t("worker.startAs", lang)}</span>
          {PERSONAS.map((p) => (
            <button
              key={p.key}
              onClick={() => start(p, p.quickStart)}
              disabled={sending}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-transform hover:scale-[1.03] disabled:opacity-50 ${p.chipColor}`}
            >
              <span aria-hidden>{p.emoji}</span>
              {lang === "sw" ? p.labelSw : p.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* ---------- PHONE ---------- */}
        <div className="mx-auto w-full max-w-[400px]">
          <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-stone-900 bg-[#ECE5DD] shadow-2xl">
            {/* WA header */}
            <div className="flex items-center gap-2.5 bg-[#075E54] px-3.5 py-3 text-white">
              <ArrowLeft className="h-4 w-4 opacity-80" />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-black">
                FX
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-bold">
                  Ferrix{persona ? ` · ${persona.name}` : ""}
                </div>
                <div className="text-[10px] opacity-80">
                  {listening ? t("voice.listening", lang) : t("chat.online", lang)}
                </div>
              </div>
              <Phone className="h-4 w-4 opacity-80" />
              <MoreVertical className="h-4 w-4 opacity-80" />
            </div>

            {/* encrypted chip */}
            <div className="bg-[#ECE5DD] pt-2">
              <div className="mx-auto flex w-fit items-center gap-1 rounded bg-[#FFECD2] px-2.5 py-1 text-[9px] text-stone-600">
                <span aria-hidden="true">🔒</span>
                {t("chat.demoNotice", lang)}
              </div>
            </div>

            {/* chat area */}
            <div ref={scrollRef} className="h-[400px] space-y-2 overflow-y-auto px-3 py-2 sm:h-[440px]">
              {messages.length === 0 && !sending && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Sparkles className="h-7 w-7 text-stone-500" />
                  <p className="max-w-[220px] text-xs text-stone-500">
                    {t("chat.empty", lang)}
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[13px] leading-snug shadow-sm ${
                      m.role === "user"
                        ? "rounded-tr-sm bg-[#DCF8C6] text-stone-900"
                        : "rounded-tl-sm bg-white text-stone-900"
                    }`}
                  >
                    <span className="whitespace-pre-wrap">{m.content}</span>
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[8px] text-stone-600">
                      {m.role === "assistant" && (
                        <button
                          onClick={() => speakInline(m.content)}
                          aria-label={t("a11y.listen", lang)}
                          className="relative -my-2.5 -ml-1.5 rounded p-2 text-stone-500 hover:bg-stone-100 after:absolute after:-inset-2 after:content-['']"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {t("chat.now", lang)}
                    </div>
                  </div>
                </motion.div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-xl rounded-tl-sm bg-white px-3 py-2.5 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* quick replies */}
            {messages.length > 0 && !sending && !result && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-600/40 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* build profile CTA */}
            {stage === "ready" && !result && (
              <div className="px-3 pb-2">
                <button
                  onClick={analyze}
                  disabled={analyzing}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-stone-950 hover:bg-amber-300 disabled:opacity-60"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("common.loading", lang)}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> {t("chat.build", lang)}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* composer */}
            <div className="flex items-center gap-2 bg-[#F0F0F0] px-2.5 py-2">
              <button
                onClick={mic}
                aria-label={t("a11y.voice", lang)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                  listening ? "bg-rose-500 text-white animate-pulse" : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder={t("chat.placeholder", lang)}
                aria-label={t("chat.placeholder", lang)}
                className="h-9 min-w-0 flex-1 rounded-full bg-white px-3.5 text-[13px] outline-none placeholder:text-stone-500"
              />
              <button
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                aria-label={t("a11y.send", lang)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* voice interview — optional turn-based intake (default OFF) */}
          {voiceMode && !result && (
            <div className="mt-3 rounded-2xl border-2 border-emerald-500 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Volume2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-stone-800">{t("interview.toggle", lang)}</h2>
                {stage !== "ready" && currentQuestion && (
                  <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {tf("interview.question", lang, {
                      n: interviewIndex + 1,
                      total: interviewTotal,
                    })}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-stone-500">{t("interview.sub", lang)}</p>

              {currentQuestion ? (
                <>
                  <div className="mt-3 rounded-xl bg-[#ECE5DD] p-3">
                    <p className="whitespace-pre-wrap text-[13px] leading-snug text-stone-900">
                      {currentQuestion}
                    </p>
                  </div>

                  {vtTranscript ? (
                    <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        {t("interview.yourAnswer", lang)}
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-stone-900">{vtTranscript}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={confirmAnswer}
                          disabled={sending}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {t("interview.confirm", lang)}
                        </button>
                        <button
                          onClick={() => setVtTranscript(null)}
                          disabled={sending}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                        >
                          {t("interview.retry", lang)}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={vtMic}
                        disabled={sending}
                        aria-label={t(vtListening ? "a11y.interviewStop" : "a11y.interviewMic", lang)}
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
                          vtListening
                            ? "animate-pulse bg-rose-500 text-white"
                            : "bg-emerald-700 text-white hover:bg-emerald-600"
                        }`}
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                      <div className="text-xs font-semibold text-stone-600">
                        {vtListening ? t("voice.listening", lang) : t("interview.tapToAnswer", lang)}
                      </div>
                    </div>
                  )}
                  {vtError && (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      {t("voice.unavailable", lang)}
                    </p>
                  )}
                  {stage === "ready" && (
                    <p className="mt-3 text-xs font-bold text-emerald-700">
                      {t("interview.done", lang)}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-3 text-xs italic text-stone-500">{t("interview.startHint", lang)}</p>
              )}
            </div>
          )}

          {/* auto-speak toggle */}
          <label className="mx-auto mt-3 flex min-h-[44px] w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-stone-500">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="h-3.5 w-3.5 accent-emerald-600"
            />
            {t("chat.autoRead", lang)}
          </label>

          {/* voice interview toggle */}
          <label
            className={`mx-auto mt-1 flex min-h-[44px] w-fit items-center gap-2 text-xs font-semibold ${
              srSupported ? "cursor-pointer text-stone-500" : "text-stone-400"
            }`}
          >
            <input
              type="checkbox"
              checked={voiceMode}
              disabled={!srSupported}
              onChange={(e) => setVoiceMode(e.target.checked)}
              className="h-3.5 w-3.5 accent-emerald-600"
            />
            {t("interview.toggle", lang)}
          </label>
          {!srSupported && (
            <p className="mx-auto mt-0.5 max-w-[340px] text-center text-[10px] leading-relaxed text-stone-500">
              {t("interview.unsupported", lang)}
            </p>
          )}
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="space-y-5">
          <SignalsPanel signals={signals} lang={lang} mode={mode} />
          {candidateId && (
            <TrackRecordPanel
              candidateId={candidateId}
              lang={lang}
              workerName={persona?.name}
            />
          )}
          {result && <ProfileCard profile={result.profile} lang={lang} />}
          {result && <MatchList matches={result.matches} lang={lang} />}
          {result && candidateId && <AssetPanel candidateId={candidateId} lang={lang} />}
          {result && (
            <HandoffPanel
              caseRef={result.case.ref}
              lang={lang}
              onOpenCoordinator={() => onHandoff(result.case.ref)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
