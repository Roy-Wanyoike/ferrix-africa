"use client";

import { UserCheck, ScanSearch, ShieldCheck, ClipboardCheck, FileClock } from "lucide-react";
import { motion } from "framer-motion";
import { t, type Lang } from "@/lib/i18n";

const steps = [
  { icon: ScanSearch, key: "pipe.1", sub: "pipe.1d", color: "bg-emerald-600", light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { icon: ShieldCheck, key: "pipe.2", sub: "pipe.2d", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { icon: UserCheck, key: "pipe.3", sub: "pipe.3d", color: "bg-amber-500", light: "bg-amber-50 text-amber-800 border-amber-300" },
  { icon: ClipboardCheck, key: "pipe.4", sub: "pipe.4d", color: "bg-stone-700", light: "bg-stone-100 text-stone-800 border-stone-300" },
  { icon: FileClock, key: "pipe.5", sub: "pipe.5d", color: "bg-stone-500", light: "bg-stone-100 text-stone-700 border-stone-300" },
];

export default function TrustPipeline({ lang }: { lang: Lang }) {
  return (
    <div className="w-full">
      <div className="hidden lg:grid grid-cols-5 gap-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`relative rounded-2xl border p-4 ${s.light}`}
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.color} text-white mb-3`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="text-sm font-bold leading-tight">{t(s.key, lang)}</div>
            <div className="mt-1 text-xs leading-snug opacity-80">{t(s.sub, lang)}</div>
            {i < steps.length - 1 && (
              <div className="hidden lg:flex absolute top-1/2 -right-[15px] h-7 w-7 -translate-y-1/2 rounded-full bg-background border-2 border-stone-300 items-center justify-center text-[11px] text-stone-500 font-bold z-10">
                →
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Mobile: vertical */}
      <div className="lg:hidden flex flex-col gap-3">
        {steps.map((s) => (
          <div key={s.key} className={`rounded-2xl border p-4 flex gap-3 items-start ${s.light}`}>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.color} text-white`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">{t(s.key, lang)}</div>
              <div className="mt-1 text-xs leading-snug opacity-80">{t(s.sub, lang)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
