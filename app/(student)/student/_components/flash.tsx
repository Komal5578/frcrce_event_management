"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";

type Flash = { title: string; body?: string; link?: { href: string; label: string } };
const Ctx = createContext<(f: Flash) => void>(() => {});
export const useFlash = () => useContext(Ctx);

/** Success feedback that survives revalidation (the card or strip item that caused it may disappear). */
export function FlashProvider({ children }: { children: ReactNode }) {
  const [flash, setFlash] = useState<Flash | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const show = useCallback((f: Flash) => setFlash(f), []);
  useEffect(() => {
    if (flash) ref.current?.focus();
  }, [flash]);
  return (
    <Ctx.Provider value={show}>
      {flash && (
        <div className="mb-4">
          <Alert ref={ref} variant="success" title={flash.title}>
            {flash.body}
            {flash.link && (
              <>
                {" "}
                <Link href={flash.link.href} className="inline-flex min-h-11 items-center font-semibold text-accent underline">
                  {flash.link.label}
                </Link>
              </>
            )}
          </Alert>
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}
