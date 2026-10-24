import type { ReactNode } from "react";

export type Art = "calendar" | "inbox" | "tasks" | "bell" | "search";

// Flat, token-coloured spot illustrations for empty states (no gradients, no shadows).
const parts: Record<Art, ReactNode> = {
  calendar: (
    <>
      <rect x="38" y="30" width="84" height="76" rx="12" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2.5" />
      <path d="M38 52h84" stroke="var(--line-strong)" strokeWidth="2.5" />
      <rect x="38" y="30" width="84" height="22" rx="12" fill="var(--brand)" />
      <rect x="38" y="42" width="84" height="10" fill="var(--brand)" />
      <path d="M58 22v16M102 22v16" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="80" cy="82" r="14" fill="var(--good-soft)" stroke="var(--good)" strokeWidth="2.5" />
      <path d="M73 82l5 5 10-11" fill="none" stroke="var(--good)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  inbox: (
    <>
      <path d="M36 70l14-34h60l14 34v30a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8z" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M36 70h30l6 12h16l6-12h30" fill="none" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="80" cy="32" r="14" fill="var(--good-soft)" stroke="var(--good)" strokeWidth="2.5" />
      <path d="M73 32l5 5 10-11" fill="none" stroke="var(--good)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  tasks: (
    <>
      <rect x="44" y="24" width="72" height="88" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2.5" />
      <rect x="64" y="16" width="32" height="16" rx="6" fill="var(--purple)" />
      {[50, 70, 90].map((y, i) => (
        <g key={y}>
          <rect x="54" y={y - 6} width="12" height="12" rx="3" fill={i === 0 ? "var(--good)" : "var(--surface)"} stroke={i === 0 ? "var(--good)" : "var(--line-strong)"} strokeWidth="2" />
          <rect x="74" y={y - 3} width={i === 0 ? 30 : 36 - i * 6} height="6" rx="3" fill={i === 0 ? "var(--line-strong)" : "var(--line)"} />
        </g>
      ))}
      <path d="M57 50l3 3 5-6" fill="none" stroke="var(--on-brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  bell: (
    <>
      <path d="M80 24c-18 0-28 14-28 32 0 20-8 24-12 30h80c-4-6-12-10-12-30 0-18-10-32-28-32z" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M70 96a10 10 0 0 0 20 0" fill="none" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="80" cy="20" r="5" fill="var(--line-strong)" />
      <path d="M108 30h12l-12 12h12M120 14h8l-8 8h8" fill="none" stroke="var(--faint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  search: (
    <>
      <rect x="30" y="34" width="84" height="64" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2.5" />
      <rect x="42" y="48" width="40" height="7" rx="3.5" fill="var(--line)" />
      <rect x="42" y="64" width="56" height="7" rx="3.5" fill="var(--line)" />
      <circle cx="104" cy="86" r="20" fill="var(--brand-soft)" stroke="var(--brand)" strokeWidth="4" />
      <path d="M119 101l14 14" stroke="var(--brand)" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
};

export function Illustration({ art }: { art: Art }) {
  return (
    <svg viewBox="0 0 160 124" className="h-32 w-40" aria-hidden>
      <ellipse cx="80" cy="112" rx="48" ry="6" fill="var(--line)" />
      {parts[art]}
    </svg>
  );
}
