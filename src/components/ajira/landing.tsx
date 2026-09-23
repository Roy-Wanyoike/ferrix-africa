"use client";

import { motion } from "framer-motion";
import { ArrowRight, Briefcase, GraduationCap, HeartHandshake, Quote } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { PERSONAS } from "@/lib/data";
import TrustPipeline from "./trust-pipeline";

interface Props {
  lang: Lang;
  onStartWorker: () => void;
  onStartCoordinator: () => void;
}

export default function Landing({ lang, onStartWorker, onStartCoordinator }: Props) {
  return (
    <div className="flex flex-col">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #10b981 0, transparent 40%), radial-gradient(circle at 80% 70%, #f59e0b 0, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("hero.badge", lang)}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight"
          >
            {t("hero.title1", lang)}
            <br />
            <span className="text-amber-400">{t("hero.title2", lang)}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-stone-300"
          >
            {t("hero.sub", lang)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <button
              onClick={onStartWorker}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-bold text-stone-950 transition-all hover:bg-emerald-400 hover:gap-3"
            >
              {t("hero.cta.worker", lang)}
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onStartCoordinator}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-600 px-7 py-3.5 text-sm font-bold text-stone-200 transition-colors hover:border-amber-400 hover:text-amber-300"
            >
              {t("hero.cta.coordinator", lang)}
            </button>
          </motion.div>

          {/* persona strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 flex flex-wrap items-center gap-2"
          >
            {PERSONAS.map((p) => (
              <span
                key={p.key}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${p.chipColor}`}
              >
                <span aria-hidden>{p.emoji}</span>
                {lang === "sw" ? p.labelSw : p.label}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- THEMES ---------- */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="sr-only">{t("themes.heading", lang)}</h2>
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            {t("hero.thememap", lang)}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: Briefcase, title: t("theme.jobs.title", lang), body: t("theme.jobs.body", lang), accent: "text-emerald-700 bg-emerald-100" },
              { icon: GraduationCap, title: t("theme.literacy.title", lang), body: t("theme.literacy.body", lang), accent: "text-amber-700 bg-amber-100" },
              { icon: HeartHandshake, title: t("theme.access.title", lang), body: t("theme.access.body", lang), accent: "text-stone-800 bg-stone-200" },
            ].map((th, i) => (
              <motion.div
                key={th.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-6"
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${th.accent}`}>
                  <th.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-stone-900">{th.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{th.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- TRUST PIPELINE ---------- */}
      <section className="bg-stone-100 border-y border-stone-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">{t("how.title", lang)}</h2>
          <p className="mt-2 mb-8 max-w-2xl text-sm sm:text-base text-stone-600">{t("how.sub", lang)}</p>
          <TrustPipeline lang={lang} />
        </div>
      </section>

      {/* ---------- CLOSING QUOTE ---------- */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <Quote className="mx-auto h-8 w-8 text-amber-500" />
          <p className="mt-4 text-xl sm:text-3xl font-bold leading-snug text-stone-900">
            “{t("closing.quote", lang)}”
          </p>
          <button
            onClick={onStartWorker}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
          >
            {t("hero.cta.worker", lang)}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
