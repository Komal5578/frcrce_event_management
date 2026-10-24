"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

type Size = "small" | "medium" | "large";

// Prefs live on <html data-*> (set before paint by the inline script in layout.tsx) and in localStorage.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const attr = (name: string, d: string) => () => document.documentElement.getAttribute(name) ?? d;
function put(name: string, key: string, v: string) {
  document.documentElement.setAttribute(name, v);
  try { localStorage.setItem(key, v); } catch {}
  listeners.forEach((l) => l());
}

/** A- / A / A+ : only text scales; targets stay 44px. */
export function TextSizeControl({ onDark }: { onDark?: boolean }) {
  const s = useSyncExternalStore(subscribe, attr("data-text", "medium"), () => "medium") as Size;
  const opts: [Size, string, string][] = [["small", "A-", "Smaller text"], ["medium", "A", "Normal text"], ["large", "A+", "Larger text"]];
  return (
    <div role="group" aria-label="Text size" className={cn("inline-flex rounded-xl border p-0.5", onDark ? "border-white/25 bg-white/10" : "border-line bg-surface-2")}>
      {opts.map(([v, t, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={s === v}
          aria-label={label}
          onClick={() => put("data-text", "textSize", v)}
          className={cn(
            "min-h-11 min-w-11 rounded-[10px] px-2 text-sm font-bold transition",
            s === v ? (onDark ? "bg-ice text-neutral-950" : "bg-brand text-on-brand") : onDark ? "text-white/85 hover:bg-white/10" : "text-muted hover:text-ink",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({ onDark }: { onDark?: boolean }) {
  const dark = useSyncExternalStore(subscribe, attr("data-theme", "dark"), () => "dark") === "dark";
  return (
    <button
      type="button"
      onClick={() => put("data-theme", "theme", dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn("grid min-h-11 min-w-11 place-items-center rounded-xl border transition", onDark ? "border-white/25 bg-white/10 text-white hover:bg-white/20" : "border-line bg-surface-2 text-muted hover:text-ink")}
    >
      {dark ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
    </button>
  );
}
