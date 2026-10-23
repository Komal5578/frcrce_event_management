"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Clapperboard, ShieldCheck, Ticket } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { demoLogin, signIn, type LoginState } from "./actions";

const DEMOS = [
  { role: "coordinator", Icon: Clapperboard, label: "Continue as Coordinator", goal: "Plan and run events" },
  { role: "student", Icon: Ticket, label: "Continue as Student", goal: "Find and join events" },
  { role: "admin", Icon: ShieldCheck, label: "Continue as Admin", goal: "Approve and monitor" },
] as const;

const NONE: LoginState = {};

export function LoginForm({ demoEnabled }: { demoEnabled: boolean }) {
  const [demoState, demoAction, demoPending] = useActionState(demoLogin, NONE);
  const [formState, formAction, formPending] = useActionState(signIn, NONE);
  const [picked, setPicked] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const pending = demoPending || formPending;
  // Show the error from whichever form was submitted last.
  const error = demoState.error ?? formState.error;
  useEffect(() => {
    if (error) alertRef.current?.focus();
  }, [error, demoState, formState]);

  return (
    <>
      {error && (
        <Alert ref={alertRef} variant="error" title="Sign in did not work">
          {error}
        </Alert>
      )}
      {demoEnabled && (
        <section aria-labelledby="demo-heading" aria-busy={demoPending || undefined} className="flex flex-col gap-2">
          <h2 id="demo-heading" className="text-heading font-semibold">
            Demo access
          </h2>
          <p className="text-body">Pick a role to look around. No password needed.</p>
          <form action={demoAction} className="flex flex-col gap-2">
            {DEMOS.map(({ role, Icon, label, goal }) => (
              <Button
                key={role}
                type="submit"
                name="role"
                value={role}
                variant="secondary"
                size="lg"
                disabled={pending}
                onClick={() => setPicked(role)}
                className="w-full justify-start"
              >
                <Icon size={24} aria-hidden="true" />
                <span className="flex flex-col text-left">
                  <span>{demoPending && picked === role ? "Signing in..." : label}</span>
                  <span className="font-normal text-muted">{goal}</span>
                </span>
              </Button>
            ))}
          </form>
        </section>
      )}
      {demoEnabled && (
        <p className="flex items-center gap-3 text-label text-muted">
          <span aria-hidden="true" className="h-px flex-1 bg-border-card" />
          or sign in with your account
          <span aria-hidden="true" className="h-px flex-1 bg-border-card" />
        </p>
      )}
      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Email" error={formState.fieldErrors?.email}>
          <Input name="email" type="email" autoComplete="username" />
        </Field>
        <Field label="Password" error={formState.fieldErrors?.password}>
          <Input name="password" type={show ? "text" : "password"} autoComplete="current-password" />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-label">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-5" />
          Show password
        </label>
        <Button type="submit" disabled={pending}>
          {formPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </>
  );
}
