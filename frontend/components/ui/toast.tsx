"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type T = { id: number; text: string; kind: "ok" | "err"; undo?: () => void };
const Ctx = createContext<{ flash: (text: string, o?: { kind?: "ok" | "err"; undo?: () => void }) => void }>({ flash: () => {} });
export const useFlash = () => useContext(Ctx).flash;

/** Plain-language feedback after every action. Polite live region; errors are assertive. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const dismiss = (id: number) => setItems((l) => l.filter((x) => x.id !== id));
  const flash = useCallback((text: string, o: { kind?: "ok" | "err"; undo?: () => void } = {}) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l.slice(-2), { id, text, kind: o.kind ?? "ok", undo: o.undo }]);
    setTimeout(() => dismiss(id), o.undo ? 7000 : 5000);
  }, []);
  return (
    <Ctx.Provider value={{ flash }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              role={t.kind === "err" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-[15px] font-medium text-white shadow-pop ring-1 ring-white/10"
            >
              {t.kind === "ok" ? <CheckCircle2 className="size-5 shrink-0 text-ok-bright" aria-hidden /> : <XCircle className="size-5 shrink-0 text-bad-bright" aria-hidden />}
              <span className="flex-1">{t.text}</span>
              {t.undo ? (
                <button className="min-h-11 rounded-lg px-3 font-bold text-sky hover:bg-white/10" onClick={() => { t.undo?.(); dismiss(t.id); }}>Undo</button>
              ) : null}
              <button aria-label="Dismiss" className="grid min-h-11 min-w-11 place-items-center rounded-lg hover:bg-white/10" onClick={() => dismiss(t.id)}>
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
