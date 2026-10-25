"use client";

import { motion } from "motion/react";
import { ArrowRight, GraduationCap, LockKeyhole, Pin, ShieldCheck, UserCog } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Tape } from "@/components/board/Tape";
import { PrimaryButton } from "@/components/board/PrimaryButton";
import { Field, Input } from "@/components/ui/field";
import { TextSizeControl, ThemeToggle } from "@/components/ui/prefs";
import { api, errText } from "@/lib/api";
import { cn } from "@/lib/cn";
import { homeFor } from "@/lib/session";
import type { Me, Role } from "@/lib/types";

const roles: { role: Role; title: string; goal: string; icon: typeof GraduationCap; color: string }[] = [
  {
    role: "student",
    title: "Student",
    goal: "Discover events and grab seats in 1 click.",
    icon: GraduationCap,
    color: "bg-[#B5DDD4] text-[#1E1A17]",
  },
  {
    role: "coordinator",
    title: "Coordinator / Faculty",
    goal: "Plan, submit and run college events.",
    icon: UserCog,
    color: "bg-[#F2B93B] text-[#1E1A17]",
  },
  {
    role: "admin",
    title: "Administrator",
    goal: "Review bookings and prevent venue clashes.",
    icon: ShieldCheck,
    color: "bg-[#EF4B35] text-white",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const reason = searchParams.get("reason");

  const [busy, setBusy] = useState<Role | "email" | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const done = (me: Me) => {
    if (
      next &&
      (next === "/map" ||
        next.startsWith("/map?") ||
        next.startsWith("/map/") ||
        next === `/${me.role}` ||
        next.startsWith(`/${me.role}/`))
    ) {
      router.replace(next);
    } else {
      router.replace(homeFor(me.role));
    }
  };

  async function demo(role: Role) {
    setBusy(role);
    setError("");
    try {
      done(await api<Me>("/api/auth/demo-login", { method: "POST", json: { role } }));
    } catch (e) {
      setError(errText(e));
      setBusy(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", json: { email, password } });
      done(await api<Me>("/api/auth/me"));
    } catch (err) {
      setError(errText(err));
      setBusy(null);
    }
  }

  return (
    <div className="relative min-h-screen text-[#1E1A17] flex flex-col justify-between py-6 px-4 sm:px-6 overflow-x-hidden">
      {/* Background Image: Bandra-Worli Sea Link overlooking FrCRCE, Bandra Bandstand */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/images/bandra-sealink.png"
          alt="Bandra-Worli Sea Link at Night overlooking FrCRCE, Bandra Bandstand Mumbai"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Atmospheric overlays: warm dark ink tint + subtle vignette to keep the noticeboard crisp and legible */}
        <div className="absolute inset-0 bg-[#1E1A17]/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E1A17]/75 via-transparent to-[#1E1A17]/85" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 max-w-4xl mx-auto w-full flex items-center justify-between pb-4">
        <Link
          href="/"
          className="flex items-center gap-2 group font-grotesk text-base font-black text-[#F4EFE3] bg-[#1E1A17]/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-[2px_2px_0px_#1E1A17] hover:bg-[#1E1A17] transition-all"
        >
          <div className="grid size-7 place-items-center rounded bg-[#EF4B35] text-white border border-[#1E1A17] shadow-[1px_1px_0px_#1E1A17]">
            <Pin className="size-3.5 -rotate-45" />
          </div>
          <span>FrCRCE Events</span>
        </Link>
        <div className="flex items-center gap-2 bg-[#1E1A17]/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-[#F4EFE3]">
          <TextSizeControl />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Noticeboard Area with a Single Flyer-Style Card on the Board */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-6 sm:py-10">
        {/* Noticeboard Panel Backdrop */}
        <div
          className={cn(
            "relative w-full max-w-xl rounded-2xl sm:rounded-3xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-6 sm:p-10",
            "shadow-[4px_6px_0px_rgba(30,26,23,0.18)]"
          )}
          style={{
            backgroundImage: "radial-gradient(#1E1A17 0.85px, transparent 0.85px)",
            backgroundSize: "18px 18px",
          }}
        >
          {/* Cork Frame Pins at top */}
          <div
            aria-hidden="true"
            className="absolute top-3 left-3 size-3 rounded-full bg-[#EF4B35] border border-[#1E1A17]"
          />
          <div
            aria-hidden="true"
            className="absolute top-3 right-3 size-3 rounded-full bg-[#EF4B35] border border-[#1E1A17]"
          />

          {/* THE SINGLE FLYER-STYLE CARD */}
          <div className="relative rounded-xl border-[1.5px] border-[#1E1A17] bg-[#F4EFE3] p-6 sm:p-8 shadow-[3px_6px_16px_rgba(30,26,23,0.12)] rotate-[-0.5deg]">
            {/* Masking tape on flyer top */}
            <Tape position="top" />

            <div className="text-center mb-6">
              <span className="font-script text-base sm:text-lg font-bold text-[#EF4B35] rotate-[-2deg] inline-block mb-1">
                ★ Campus Noticeboard Access
              </span>
              <h1 className="font-grotesk text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.01em] leading-[0.98] text-[#1E1A17]">
                Sign in to FrCRCE
              </h1>
              <p className="mt-2 text-sm font-semibold text-[#1E1A17]/75">
                Pick your role for 1-click demo entry, or use your college email.
              </p>
            </div>

            {reason === "map" || next?.startsWith("/map") ? (
              <div className="mb-5 p-3.5 rounded-lg border-[1.5px] border-[#EF4B35] bg-[#FDE9E6] text-xs font-bold text-[#1E1A17] shadow-[2px_2px_0px_#EF4B35] flex items-center gap-2.5">
                <div className="grid size-7 shrink-0 place-items-center rounded bg-[#EF4B35] text-white">
                  <Pin className="size-4 -rotate-45" />
                </div>
                <div>
                  <p className="font-grotesk font-black text-sm text-[#EF4B35]">
                    Sign in to see the Crescendo map.
                  </p>
                  <p className="text-xs text-[#1E1A17]/80 mt-0.5">
                    Select any role below for 1-click access to floor plans and event routes.
                  </p>
                </div>
              </div>
            ) : (reason === "auth" || next) && (
              <div className="mb-5 p-3 rounded-lg border border-[#EF4B35] bg-[#FDE9E6] text-xs font-bold text-[#EF4B35]">
                Please sign in to access the {next?.replace("/", "") ?? "student"} portal. Click below for 1-click demo entry!
              </div>
            )}

            {/* Quick Role Selection as Flyer Tickets */}
            <div className="space-y-2.5 mb-6" aria-label="1-Click Demo Access">
              {roles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => demo(r.role)}
                  disabled={busy !== null}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 p-3 rounded-lg border-[1.5px] border-[#1E1A17] bg-white",
                    "text-left transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_#1E1A17]",
                    "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1E1A17] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                    "disabled:opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded border border-[#1E1A17]", r.color)}>
                      <r.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <span className="font-grotesk text-sm font-extrabold text-[#1E1A17] block leading-tight">
                        {busy === r.role ? "Entering..." : `Continue as ${r.title}`}
                      </span>
                      <span className="text-xs text-[#1E1A17]/70 block truncate">
                        {r.goal}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-[#1E1A17]/60" />
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#1E1A17]/25" />
              </div>
              <span className="relative bg-[#F4EFE3] px-3 font-grotesk text-xs uppercase font-extrabold tracking-wider text-[#1E1A17]/70">
                Or enter with credentials
              </span>
            </div>

            {/* Credential Form */}
            <form onSubmit={submit} className="space-y-3.5" noValidate>
              <div>
                <label className="font-grotesk text-xs uppercase tracking-wider font-extrabold text-[#1E1A17] block mb-1">
                  College Email
                </label>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  className="w-full rounded-md border-[1.5px] border-[#1E1A17] bg-white px-3 py-2 text-sm font-semibold text-[#1E1A17] placeholder:text-[#1E1A17]/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1E1A17]"
                  required
                />
              </div>

              <div>
                <label className="font-grotesk text-xs uppercase tracking-wider font-extrabold text-[#1E1A17] block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border-[1.5px] border-[#1E1A17] bg-white px-3 py-2 text-sm font-semibold text-[#1E1A17] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#1E1A17]"
                  required
                />
              </div>

              {error && (
                <p role="alert" className="rounded border border-[#EF4B35] bg-[#FDE9E6] p-2.5 text-xs font-bold text-[#EF4B35]">
                  {error}
                </p>
              )}

              {/* Main CTA Button with hard offset shadow */}
              <div className="pt-2">
                <PrimaryButton
                  type="submit"
                  size="md"
                  variant="red"
                  className="w-full"
                  disabled={busy === "email" || !email || !password}
                >
                  {busy === "email" ? "Signing In..." : "Sign In to Board"}
                </PrimaryButton>
              </div>
            </form>

            <p className="mt-4 text-center text-xs font-semibold text-[#1E1A17]/60">
              Need access? Ask your department head or coordinator.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs font-semibold py-2">
        <span className="inline-block bg-[#1E1A17]/80 backdrop-blur-sm px-3.5 py-1 rounded-full border border-white/15 text-[#F4EFE3]/80">
          FrCRCE Events · Bandstand, Bandra (W) · Mumbai
        </span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex items-center justify-center p-6">
        <div className="max-w-sm w-full rounded-2xl border-[1.5px] border-[#1E1A17] bg-[#D9CBB3] p-8 text-center">
          <p className="font-grotesk text-lg font-bold">Loading Noticeboard Sign In...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
