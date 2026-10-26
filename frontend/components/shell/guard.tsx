"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { LogIn, Sparkles, Pin } from "lucide-react";
import { homeFor, useMe } from "@/lib/session";
import { api, errText } from "@/lib/api";
import type { Me, Role } from "@/lib/types";

/** One interface per role: wrong role goes home, signed-out goes to sign in. */
export function RoleGuard({ role, children }: { role: Role; children: (name: string) => ReactNode }) {
  const router = useRouter();
  const { me, loading, signedOut, mutate } = useMe();
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (signedOut) {
      // Allow user 2.5s to see the notice or use 1-click demo before auto-redirecting
      const timer = setTimeout(() => {
        router.replace(`/login?next=/${role}&reason=auth`);
      }, 2500);
      return () => clearTimeout(timer);
    } else if (me && me.role !== role) {
      router.replace(homeFor(me.role));
    }
  }, [me, signedOut, role, router]);

  const handleQuickDemo = async () => {
    setLoggingIn(true);
    setErrorMsg("");
    try {
      const actor = await api<Me>("/api/auth/demo-login", { method: "POST", json: { role } });
      await mutate(actor, { revalidate: true });
    } catch {
      try {
        const creds = {
          student: { email: "student@demo.college.test", password: "demo-password-2026" },
          coordinator: { email: "coordinator@demo.college.test", password: "demo-password-2026" },
          admin: { email: "admin@demo.college.test", password: "demo-password-2026" },
        }[role];
        await api("/api/auth/login", { method: "POST", json: creds });
        const actor = await api<Me>("/api/auth/me");
        await mutate(actor, { revalidate: true });
      } catch (err) {
        setErrorMsg(errText(err));
        setLoggingIn(false);
      }
    }
  };

  if (!me || me.role !== role) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#F4EFE3] text-[#1E1A17] p-6" role="status" aria-label="Loading">
        <div className="relative w-full max-w-md rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-6 sm:p-8 shadow-[4px_6px_0px_rgba(30,26,23,0.18)] text-center">
          {/* Cork Frame Pin */}
          <div className="absolute top-3 left-3 size-3 rounded-full bg-[#EF4B35] border border-[#1E1A17]" aria-hidden />
          <div className="absolute top-3 right-3 size-3 rounded-full bg-[#EF4B35] border border-[#1E1A17]" aria-hidden />

          <div className="mx-auto size-12 grid place-items-center rounded-xl bg-[#EF4B35] text-white border border-[#1E1A17] shadow-[2px_2px_0px_#1E1A17] mb-3">
            <Pin className="size-6 -rotate-45" />
          </div>

          <span className="font-script text-base font-bold text-[#EF4B35] block rotate-[-2deg]">
            ★ Campus Noticeboard Desk
          </span>
          <h2 className="font-grotesk text-2xl font-black text-[#1E1A17] mt-1">
            {role === "student" ? "Student Portal" : `${role.toUpperCase()} Portal`} Access
          </h2>
          <p className="mt-2 text-xs sm:text-sm font-semibold text-[#1E1A17]/80">
            {signedOut
              ? "You must be signed in to open this portal. Continuing with demo login..."
              : "Checking credentials..."}
          </p>

          {errorMsg && (
            <p className="mt-3 text-xs font-bold text-[#EF4B35] bg-[#FDE9E6] p-2 rounded border border-[#EF4B35]">
              {errorMsg}
            </p>
          )}

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loggingIn}
              className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-[#1E1A17] bg-[#EF4B35] text-white py-2.5 px-4 font-grotesk text-sm font-bold shadow-[2px_2px_0px_#1E1A17] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1E1A17] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {loggingIn ? "Entering Portal..." : `1-Click Demo Login (${role})`}
            </button>

            <Link
              href={`/login?next=/${role}&reason=auth`}
              className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg border border-[#1E1A17]/40 bg-white text-[#1E1A17] py-2 px-4 font-grotesk text-xs font-bold hover:bg-[#F4EFE3] transition-colors"
            >
              <LogIn className="size-3.5" />
              Sign in with email
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children(me.name)}</>;
}

