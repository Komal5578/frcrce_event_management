"use client";

import { MotionConfig } from "motion/react";
import { SWRConfig } from "swr";
import { ToastProvider } from "@/components/ui/toast";
import { fetcher } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SWRConfig value={{ fetcher, revalidateOnFocus: false, dedupingInterval: 2000 }}>
        <ToastProvider>{children}</ToastProvider>
      </SWRConfig>
    </MotionConfig>
  );
}
