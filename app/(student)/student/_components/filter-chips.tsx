"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { Params } from "../_lib/filter";

function Chip({ name, label, on }: { name: string; label: string; on: boolean }) {
  return (
    <label className="relative inline-flex">
      <input type="checkbox" name={name} defaultChecked={on} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      <span className="inline-flex min-h-11 items-center gap-2 rounded-pill border-2 border-border-ui bg-surface px-4 text-label font-semibold peer-checked:border-accent peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent [&_svg]:hidden peer-checked:[&_svg]:block">
        <Check size={16} aria-hidden="true" />
        {label}
      </span>
    </label>
  );
}

/** GET form: the URL is the filter state. `f=1` marks a submitted form so unticked chips stay off. */
export function FilterChips({ p, types, venues, departments, echo }: {
  p: Params; types: string[]; venues: string[]; departments: string[]; echo: string;
}) {
  const more = useRef<HTMLDetailsElement>(null);
  // Always open from 768px; collapsed below. Set directly on the element (no state).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => { if (more.current) more.current.open = mq.matches; };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <form method="get" role="search" className="flex flex-col gap-4">
      <input type="hidden" name="f" value="1" />
      <Field label="Search events">
        <Input type="search" name="q" defaultValue={p.q} enterKeyHint="search" autoComplete="off" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Chip name="week" label="This week" on={p.week} />
        <Chip name="open" label="Open only" on={p.open} />
        <Chip name="seats" label="Has seats" on={p.seats} />
      </div>
      <details ref={more}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-label font-semibold text-accent md:hidden">More filters</summary>
        <div className="mt-2 grid gap-4 md:mt-0 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Type">
            <Select name="type" defaultValue={p.type}>
              <option value="">Any type</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Venue">
            <Select name="venue" defaultValue={p.venue}>
              <option value="">Any venue</option>
              {venues.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Department">
            <Select name="department" defaultValue={p.department}>
              <option value="">Any department</option>
              {departments.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="From date"><Input type="date" name="from" defaultValue={p.from} /></Field>
          <Field label="To date"><Input type="date" name="to" defaultValue={p.to} /></Field>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="secondary">Apply filters</Button>
        <Link href="/student?f=1" className="inline-flex min-h-11 items-center text-label font-semibold text-accent underline">Clear filters</Link>
      </div>
      <p aria-live="polite" className="text-label text-muted">{echo}</p>
    </form>
  );
}
