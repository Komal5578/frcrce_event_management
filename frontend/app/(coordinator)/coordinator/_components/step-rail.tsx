import Link from "next/link";
import { TriangleAlert, Check } from "lucide-react";
import { LINK_BTN } from "./autosave-status";

export const STEPS = ["Details", "Venue and time", "Resources", "Tasks"] as const;
export type StepState = "done" | "todo" | "attention";
const WORD: Record<StepState, string> = { done: "Done", todo: "To do", attention: "Needs attention" };

/** Step rail: horizontal list from 768px, "Step n of 4" + progress + Steps details below. State is text + icon. */
export function StepRail({ eventId, current, states }: { eventId: string; current: number; states: StepState[] }) {
  const href = (n: number) => `/coordinator/${eventId}/edit?step=${n}`;
  const word = (i: number) => (i + 1 === current ? "Current" : WORD[states[i]]);
  const icon = (i: number) => (states[i] === "attention" ? <TriangleAlert size={16} aria-hidden="true" /> : states[i] === "done" && i + 1 !== current ? <Check size={16} aria-hidden="true" /> : null);
  return (
    <nav aria-label="Event steps" className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 md:hidden">
        <p className="text-body font-semibold">Step {current} of 4: {STEPS[current - 1]}</p>
        <progress max={4} value={current} aria-label={`Step ${current} of 4`} className="h-2 w-full accent-accent" />
        <details>
          <summary className="min-h-11 cursor-pointer py-2 text-label font-semibold underline">Steps</summary>
          <ol className="flex flex-col gap-2">
            {STEPS.map((name, i) => (
              <li key={name}>
                <Link href={href(i + 1)} aria-current={i + 1 === current ? "step" : undefined} className={`${LINK_BTN} w-full justify-start gap-2`}>
                  {i + 1}. {name}: {word(i)}{icon(i)}
                </Link>
              </li>
            ))}
          </ol>
        </details>
      </div>
      <ol className="hidden gap-3 md:grid md:grid-cols-4">
        {STEPS.map((name, i) => (
          <li key={name}>
            <Link href={href(i + 1)} aria-current={i + 1 === current ? "step" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-control border-b-4 bg-panel px-3 py-2 hover:bg-surface ${i + 1 === current ? "border-accent" : "border-border-card"}`}>
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-pill border-2 border-ink text-label font-semibold">{i + 1}</span>
              <span className="flex flex-col"><span className="text-body font-semibold">{name}</span>
                <span className="flex items-center gap-1 text-label">{icon(i)}{word(i)}</span></span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Footer for steps 3 and 4: Go back, one primary, Save and close (nothing to save: it is saved already). */
export function StepNav({ eventId, step, primary }: { eventId: string; step: 3 | 4; primary?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="order-first sm:order-2">
        {primary ?? <Link href={`/coordinator/${eventId}/edit?step=${step + 1}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-accent bg-accent px-4 py-2 text-label font-semibold text-white">Save and continue</Link>}
      </span>
      <Link href={`/coordinator/${eventId}/edit?step=${step - 1}`} className={`${LINK_BTN} sm:order-1`}>Go back</Link>
      <Link href="/coordinator" className="order-last inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-label font-semibold underline">Save and close</Link>
    </div>
  );
}
