"use client";

import { motion } from "motion/react";
import { ArrowRight, CalendarPlus, CheckCheck, ClipboardList, Eye, GraduationCap, Hand, KeyRound, ShieldCheck, Ticket, UserCog, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BRAND, BrandMark } from "@/components/shell/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Stepper } from "@/components/ui/stepper";
import { TextSizeControl, ThemeToggle } from "@/components/ui/prefs";
import { api, errText } from "@/lib/api";
import { cn } from "@/lib/cn";
import { homeFor } from "@/lib/session";
import type { Me, Role } from "@/lib/types";

const roles: { role: Role; title: string; goal: string; icon: typeof GraduationCap; tone: string }[] = [
  { role: "student", title: "Student", goal: "Find an event and register in a few taps.", icon: GraduationCap, tone: "bg-ice text-neutral-950" },
  { role: "coordinator", title: "Coordinator", goal: "Get an event approved and running.", icon: UserCog, tone: "bg-brand text-on-brand" },
  { role: "admin", title: "Admin", goal: "Approve safely, with clashes surfaced first.", icon: ShieldCheck, tone: "border border-line-strong bg-surface-2 text-ink" },
];

const flow = [
  { label: "Plan", icon: CalendarPlus },
  { label: "Approve", icon: CheckCheck },
  { label: "Register", icon: Ticket },
  { label: "Run tasks", icon: ClipboardList },
];

const principles = [
  { icon: Eye, title: "Always know the state", body: "Every status shows an icon, a word and a colour." },
  { icon: Hand, title: "Confirm before you commit", body: "Review & Confirm on every irreversible step." },
  { icon: Users2, title: "One screen per goal", body: "Each role sees only what its job needs." },
  { icon: KeyRound, title: "Clashes are impossible", body: "A venue can never be double-booked." },
];

export default function Login() {
  const router = useRouter();
  const [busy, setBusy] = useState<Role | "email" | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const done = (me: Me) => router.replace(homeFor(me.role));

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
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="on-navy relative hidden flex-col justify-between overflow-hidden hero-dark p-12 text-white lg:flex">
        <div className="relative flex items-center gap-3">
          <BrandMark onDark className="size-11" />
          <span className="display text-[30px]">{BRAND}</span>
        </div>
        <div className="relative max-w-xl">
          <h2 className="display text-[clamp(2.5rem,1.4rem+3vw,4.25rem)]">
            Every college event, from idea to attendance.
          </h2>
          <p className="mt-4 max-w-md text-lg text-navy-ink">
            One place to plan, approve, register and keep track, without the group chats.
          </p>
          <div className="mt-8 rounded-2xl bg-white/[.06] p-4">
            <p className="mb-3 text-sm font-semibold text-navy-ink">How an event travels</p>
            <Stepper steps={flow} current={1} tight />
          </div>
        </div>
        <ul className="relative grid grid-cols-2 gap-3">
          {principles.map((p, i) => (
            <motion.li key={p.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07 }} className="flex gap-3 rounded-2xl bg-white/[.05] p-3.5 border border-white/10">
              <p.icon className="mt-0.5 size-5 shrink-0 text-sky" aria-hidden />
              <div><p className="text-sm font-bold">{p.title}</p><p className="mt-0.5 text-[13px] text-navy-ink">{p.body}</p></div>
            </motion.li>
          ))}
        </ul>
      </section>

      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:invisible"><BrandMark /><span className="display hidden text-[24px] min-[420px]:inline">{BRAND}</span></div>
          <div className="flex items-center gap-2"><TextSizeControl /><ThemeToggle /></div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-[clamp(1.75rem,1.4rem+1.2vw,2.25rem)] font-semibold tracking-[-0.03em]">Sign in</h1>
          <p className="mt-1 text-[15px] text-muted">Pick your role to jump straight in, or use your college email.</p>

          <ul className="mt-6 space-y-3" aria-label="Sign in as">
            {roles.map((r, i) => (
              <motion.li key={r.role} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07, type: "spring", stiffness: 340, damping: 30 }}>
                <button
                  onClick={() => demo(r.role)}
                  disabled={busy !== null}
                  aria-busy={busy === r.role}
                  className="group flex min-h-[4.5rem] w-full items-center gap-4 rounded-[20px] bg-surface p-3.5 text-left border border-line transition duration-150 hover:-translate-y-0.5 hover:border-ink hover:shadow-lift active:scale-[.985] disabled:opacity-60"
                >
                  <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", r.tone)}><r.icon className="size-6" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{busy === r.role ? "Signing in…" : `Continue as ${r.title}`}</span>
                    <span className="block text-[13.5px] text-muted">{r.goal}</span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-faint transition group-hover:translate-x-1 group-hover:text-ink" aria-hidden />
                </button>
              </motion.li>
            ))}
          </ul>

          <p className="my-6 text-center text-sm font-semibold text-muted">or sign in with your college email</p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="College email" required>
              {(id) => <Input id={id} type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />}
            </Field>
            <Field label="Password" required>
              {(id) => <Input id={id} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
            </Field>
            {error ? <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p> : null}
            <Button type="submit" full size="lg" loading={busy === "email"} disabled={!email || !password}>Sign in</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
