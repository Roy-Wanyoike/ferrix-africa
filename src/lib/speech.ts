// Speech-synthesis helper for Ferrix voice features ("Sikiliza Passport Yako",
// spoken match explanations, voice-interview prompts).
//
// Design rules:
// - SSR-safe: every entry point guards `window`, so importing/calling on the
//   server is a no-op — never a crash, never a console error.
// - Graceful degradation: on browsers without `speechSynthesis` (headless
//   crawlers, older Android WebViews) everything is a no-op and callers fall
//   back to the text UI.
// - Queue + cancel semantics: a new `speak()` cancels whatever is playing and
//   queues its own chunks; long text is chunked because some Android/Chrome
//   builds truncate single long utterances.
// - Observable state: `onSpeakingChange` lets buttons toggle play/stop without
//   polling. Listeners are isolated — one broken callback can't break speech.

export type SpeechLang = "en" | "sw";

type SpeakingListener = (speaking: boolean) => void;

const listeners = new Set<SpeakingListener>();
let speakingState = false;
// Session token: increments on every speak()/stopSpeaking() so stale utterance
// callbacks from a cancelled playback can never flip the observable state.
let session = 0;
let keepAlive: ReturnType<typeof setInterval> | null = null;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function setSpeaking(next: boolean) {
  if (speakingState === next) return;
  speakingState = next;
  for (const listener of Array.from(listeners)) {
    try {
      listener(next);
    } catch {
      /* a broken listener must not break playback */
    }
  }
}

/** Subscribe to play/stop state. Returns an unsubscribe function. */
export function onSpeakingChange(cb: SpeakingListener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Helpers for React `useSyncExternalStore` consumers — speaking lives outside
// React, and feature support is an environment constant discovered only on the
// client (server snapshot is always `false` → SSR-safe, hydration-safe).
export function subscribeSpeaking(onStoreChange: () => void): () => void {
  return onSpeakingChange(onStoreChange);
}

export function getSpeakingSnapshot(): boolean {
  return speakingState;
}

export function getSpeakingServerSnapshot(): boolean {
  return false;
}

/** Stop and clear any queued speech. Safe on servers / unsupported browsers. */
export function stopSpeaking(): void {
  session += 1;
  stopKeepAlive();
  setSpeaking(false);
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* cancel is best-effort */
  }
}

// Chrome throttles/pauses long synthesised speech; a periodic no-op resume()
// keeps playback alive. resume() on a non-paused synth is harmless elsewhere.
function startKeepAlive() {
  if (keepAlive !== null) return;
  keepAlive = setInterval(() => {
    try {
      window.speechSynthesis.resume();
    } catch {
      /* best-effort keepalive */
    }
  }, 10_000);
}

function stopKeepAlive() {
  if (keepAlive !== null) {
    clearInterval(keepAlive);
    keepAlive = null;
  }
}

function normalizeVoiceLang(v: SpeechSynthesisVoice): string {
  return v.lang.toLowerCase().replace("_", "-");
}

/**
 * Pick the best installed voice. `sw` prefers a real `sw-KE` voice; when none
 * is installed (the common case on Chrome/Android today) we return null so the
 * utterance still carries lang="sw-KE" and the platform default voice reads
 * it — audible output instead of silence.
 */
function pickVoice(lang: SpeechLang): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  let voices: SpeechSynthesisVoice[] = [];
  try {
    voices = window.speechSynthesis.getVoices();
  } catch {
    return null;
  }
  if (voices.length === 0) return null;
  if (lang === "sw") {
    return voices.find((v) => normalizeVoiceLang(v).startsWith("sw")) ?? null;
  }
  return (
    voices.find((v) => normalizeVoiceLang(v) === "en-us") ??
    voices.find((v) => normalizeVoiceLang(v).startsWith("en")) ??
    null
  );
}

/** Word-boundary chunks (≤180 chars) — queue-friendly, no regex lookbehind. */
function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 180) return clean ? [clean] : [];
  const chunks: string[] = [];
  let buf = "";
  for (const word of clean.split(" ")) {
    const candidate = buf ? `${buf} ${word}` : word;
    if (candidate.length > 180) {
      if (buf) chunks.push(buf);
      buf = word;
    } else {
      buf = candidate;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

/**
 * Speak `text` aloud. Cancels any previous playback first, then queues the
 * utterances. `lang === "sw"` targets a `sw-KE` voice when installed and
 * otherwise degrades to the platform default voice (see pickVoice).
 */
export function speak(text: string, lang: SpeechLang = "en"): void {
  if (!isSpeechSupported()) return;
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return;

  const synth = window.speechSynthesis;
  const mySession = ++session;
  stopKeepAlive();
  try {
    synth.cancel();
  } catch {
    /* best-effort cancel */
  }

  const utterLang = lang === "sw" ? "sw-KE" : "en-US";
  const voice = pickVoice(lang);
  const chunks = chunkText(clean);

  // Chrome ignores speak() calls issued in the same tick as cancel() — defer
  // one tick so "tap stop, then play" and "play A, then play B" both work.
  window.setTimeout(() => {
    if (mySession !== session || !isSpeechSupported()) return;
    try {
      for (let i = 0; i < chunks.length; i++) {
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = utterLang;
        if (voice) u.voice = voice;
        u.rate = 0.95;
        u.pitch = 1;
        if (i === 0) {
          u.onstart = () => {
            if (mySession === session) setSpeaking(true);
          };
        }
        if (i === chunks.length - 1) {
          u.onend = () => {
            if (mySession === session) {
              stopKeepAlive();
              setSpeaking(false);
            }
          };
        }
        u.onerror = () => {
          if (mySession === session) {
            stopKeepAlive();
            setSpeaking(false);
          }
        };
        window.speechSynthesis.speak(u);
      }
      startKeepAlive();
      setSpeaking(true);
    } catch {
      stopKeepAlive();
      setSpeaking(false);
    }
  }, 50);
}
