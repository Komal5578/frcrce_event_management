"use client";

import { useSyncExternalStore } from "react";
import { Button } from "./button";

// Same key and values as the inline script in app/layout.tsx. Anything else in storage is ignored (T-03-11).
const SIZES = {
  small: { px: "14px", text: "A-", aria: "Smaller text" },
  medium: { px: "16px", text: "A", aria: "Default text" },
  large: { px: "20px", text: "A+", aria: "Larger text" },
} as const;
type Size = keyof typeof SIZES;

const listeners = new Set<() => void>();

function read(): Size {
  try {
    const saved = localStorage.getItem("textSize");
    if (saved === "small" || saved === "medium" || saved === "large") return saved;
  } catch {
    /* storage blocked: default */
  }
  return "medium";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

function save(next: Size) {
  document.documentElement.style.fontSize = SIZES[next].px;
  try {
    localStorage.setItem("textSize", next);
  } catch {
    /* storage blocked: size still applies for this visit */
  }
  listeners.forEach((cb) => cb());
}

export function TextSizeControl() {
  const size = useSyncExternalStore(subscribe, read, () => "medium" as Size);
  const choose = save;

  return (
    <div role="group" aria-label="Text size" className="flex gap-2">
      {(Object.keys(SIZES) as Size[]).map((key) => (
        <Button
          key={key}
          variant={size === key ? "primary" : "secondary"}
          aria-label={SIZES[key].aria}
          aria-pressed={size === key}
          onClick={() => choose(key)}
        >
          {SIZES[key].text}
        </Button>
      ))}
    </div>
  );
}
