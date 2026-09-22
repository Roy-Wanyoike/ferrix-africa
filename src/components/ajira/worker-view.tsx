"use client";

import { useEffect, useRef, useState } from "react";
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
import { PERSONAS, SUGGESTIONS, SIGNAL_RULES, type ChatStage, type Lang, type Persona } from "@/lib/data";
import { t } from "@/lib/i18n";
import type { AnalyzeResponse, ChatMsg } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  AssetPanel,
  HandoffPanel,
  MatchList,
  ProfileCard,
  SignalsPanel,
} from "./worker-panels";

interface Props {
  lang: Lang;
  onHandoff: () => void;
}

const isSwahili = (text: string) =>
  /\b(na|ya|wa|kwa|mimi|habari|asante|sasa|nataka|nko|niko|hii|yangu|unataka|vipi|kazi|pesa|msaada)\b/i.test(
    text
  );

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<any>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };
  useEffect(scrollToBottom, [messages, sending]);

  const speak = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "sw" ? "sw-KE" : "en-US";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch {
      /* TTS unavailable — silent */
    }
  };

  // AI signals from user messages (client-side keyword spotting)
  const signals: string[] = (() => {
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length === 0) return [];
    const out: string[] = [];
    const joined = userMsgs.map((m) => m.content).join(" ");
    out.push(`Language detected: ${isSwahili(joined) ? "Kiswahili" : "English"}`);
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
    setPersona(p);
    setSending(true);
    try {
      const data = await post({ persona: p?.key, message: text, language: lang });
      setCandidateId(data.candidateId);
      setMessages(data.messages);
      setStage(data.stage);
      setMode(data.mode === "live" ? "live" : "fallback");
    } catch {
      toast({ title: "Network hiccup", description: "The demo could not reach the AI — try again." });
    } finally {
      setSending(false);
    }
  };

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;
    setInput("");
    if (!candidateId) return start(persona, clean);

    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: clean }]);
    setSending(true);
    try {
      const data = await post({ candidateId, message: clean, language: lang });
      setMessages(data.messages);
      setStage(data.stage);
      setMode(data.mode === "live" ? "live" : "fallback");
      if (autoSpeak && data.mode === "live") {
        const last = data.messages[data.messages.length - 1];
        if (last?.role === "assistant") speak(last.content);
      }
    } catch {
      toast({ title: "Network hiccup", description: "Message not delivered — try again." });
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
        title: `Case ${data.case.ref} created`,
        description: "AI profile structured — now awaiting human verification.",
      });
    } catch {
      toast({ title: "Analysis failed", description: "Please try again." });
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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900">{t("worker.title", lang)}</h1>
          <p className="text-sm text-stone-500">{t("worker.sub", lang)}</p>
        </div>
        <button
          onClick={restart}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:border-emerald-500 hover:text-emerald-700"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Restart demo
        </button>
      </div>

      {/* persona chooser */}
      {!candidateId && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-stone-400">Start as:</span>
          {PERSONAS.map((p) => (
            <button
              key={p.key}
              onClick={() => start(p, p.quickStart)}
              disabled={sending}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-transform hover:scale-[1.03] disabled:opacity-50 ${p.chipColor}`}
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
                AC
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-bold">
                  Ajira Copilot{persona ? ` · ${persona.name}` : ""}
                </div>
                <div className="text-[10px] opacity-80">
                  {listening ? t("voice.listening", lang) : "AI · online"}
                </div>
              </div>
              <Phone className="h-4 w-4 opacity-80" />
              <MoreVertical className="h-4 w-4 opacity-80" />
            </div>

            {/* encrypted chip */}
            <div className="bg-[#ECE5DD] pt-2">
              <div className="mx-auto w-fit rounded bg-[#FFECD2] px-2.5 py-1 text-[9px] text-stone-600">
                🔒 Demo conversation — messages stay on this device
              </div>
            </div>

            {/* chat area */}
            <div ref={scrollRef} className="h-[400px] space-y-2 overflow-y-auto px-3 py-2 sm:h-[440px]">
              {messages.length === 0 && !sending && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Sparkles className="h-7 w-7 text-stone-400" />
                  <p className="max-w-[220px] text-xs text-stone-500">
                    Pick a persona above, or just start typing — the copilot mirrors your language.
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
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[8px] text-stone-400">
                      {m.role === "assistant" && (
                        <button
                          onClick={() => speak(m.content)}
                          aria-label="Listen"
                          className="rounded p-0.5 hover:bg-stone-100"
                        >
                          <Volume2 className="h-3 w-3" />
                        </button>
                      )}
                      now
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
                    className="rounded-full border border-emerald-600/40 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-stone-950 hover:bg-amber-300 disabled:opacity-60"
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
                aria-label="Voice input"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
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
                className="h-9 min-w-0 flex-1 rounded-full bg-white px-3.5 text-[13px] outline-none placeholder:text-stone-400"
              />
              <button
                onClick={() => send(input)}
                disabled={sending || !input.trim()}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* auto-speak toggle */}
          <label className="mx-auto mt-3 flex w-fit cursor-pointer items-center gap-2 text-xs font-semibold text-stone-500">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="h-3.5 w-3.5 accent-emerald-600"
            />
            Auto-read AI replies (voice accessibility)
          </label>
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="space-y-5">
          <SignalsPanel signals={signals} lang={lang} mode={mode} />
          {result && <ProfileCard profile={result.profile} lang={lang} />}
          {result && <MatchList matches={result.matches} lang={lang} />}
          {result && candidateId && <AssetPanel candidateId={candidateId} lang={lang} />}
          {result && (
            <HandoffPanel caseRef={result.case.ref} lang={lang} onOpenCoordinator={onHandoff} />
          )}
        </div>
      </div>
    </div>
  );
}
