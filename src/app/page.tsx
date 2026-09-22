"use client";

import { useState } from "react";
import { Languages, Waypoints } from "lucide-react";
import Landing from "@/components/ajira/landing";
import WorkerView from "@/components/ajira/worker-view";
import CoordinatorView from "@/components/ajira/coordinator-view";
import { t, type Lang } from "@/lib/i18n";

type View = "landing" | "worker" | "coordinator";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [lang, setLang] = useState<Lang>("en");
  const [focusRef, setFocusRef] = useState<string | null>(null);

  const goWorker = () => {
    setFocusRef(null);
    setView("worker");
  };

  const goCoordinator = () => {
    setFocusRef(null);
    setView("coordinator");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-stone-900">
      {/* header nav */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setView("landing")}
            className="flex items-center gap-2 font-black tracking-tight text-stone-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Waypoints className="h-4.5 w-4.5" />
            </span>
            <span className="text-base">
              Ferrix<span className="text-emerald-700"> Africa</span>
            </span>
            <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 sm:inline">
              AI prepares · People place
            </span>
          </button>

          <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            {(
              [
                ["landing", t("nav.home", lang)],
                ["worker", t("nav.worker", lang)],
                ["coordinator", t("nav.coordinator", lang)],
              ] as [View, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => (v === "worker" ? goWorker() : v === "coordinator" ? goCoordinator() : setView("landing"))}
                className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors sm:px-3 sm:text-xs ${
                  view === v
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100"
                } ${v === "landing" ? "hidden sm:block" : ""}`}
              >
                {v === "worker" ? (
                  <>
                    <span className="sm:hidden">Worker</span>
                    <span className="hidden sm:inline">{label}</span>
                  </>
                ) : (
                  label
                )}
              </button>
            ))}
            <button
              onClick={() => setLang(lang === "en" ? "sw" : "en")}
              className="ml-0.5 inline-flex items-center gap-1 rounded-full border border-emerald-600 px-2 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 sm:ml-1 sm:px-3 sm:text-xs"
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="sm:hidden">{lang === "en" ? "SW" : "EN"}</span>
              <span className="hidden sm:inline">{t("lang.toggle", lang)}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* main */}
      <main className="flex-1">
        {view === "landing" && (
          <Landing lang={lang} onStartWorker={goWorker} onStartCoordinator={goCoordinator} />
        )}
        {view === "worker" && (
          <WorkerView
            lang={lang}
            onHandoff={() => {
              setView("coordinator");
            }}
          />
        )}
        {view === "coordinator" && <CoordinatorView lang={lang} focusRef={focusRef} />}
      </main>

      {/* sticky footer */}
      <footer className="mt-auto border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
          <p className="text-xs text-stone-500">{t("footer.note", lang)}</p>
        </div>
      </footer>
    </div>
  );
}
