const loc = "en-GB";

export const d = (v: string | Date | null | undefined) => (v ? new Date(v) : null);

export const fmtDay = (v: string | null | undefined) =>
  v ? new Intl.DateTimeFormat(loc, { weekday: "short", day: "numeric", month: "short" }).format(new Date(v)) : "Date to be set";

export const fmtDate = (v: string | null | undefined) =>
  v ? new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric" }).format(new Date(v)) : "Date to be set";

export const fmtTime = (v: string | null | undefined) =>
  v ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(v)) : "";

export const fmtRange = (a: string | null | undefined, b: string | null | undefined) =>
  a ? `${fmtTime(a)}${b ? ` – ${fmtTime(b)}` : ""}` : "Time to be set";

export const fmtStamp = (v: string | null | undefined) => (v ? `${fmtDay(v)}, ${fmtTime(v)}` : "Date to be set");

export function dateBlock(v: string | null | undefined) {
  if (!v) return { day: "–", mon: "TBD" };
  const x = new Date(v);
  return {
    day: String(x.getDate()),
    mon: new Intl.DateTimeFormat(loc, { month: "short" }).format(x),
  };
}

export function relative(v: string | null | undefined) {
  if (!v) return "";
  const ms = new Date(v).getTime() - Date.now();
  const mins = Math.round(ms / 60000);
  const abs = Math.abs(mins);
  const unit = abs < 60 ? [abs, "minute"] : abs < 1440 ? [Math.round(abs / 60), "hour"] : [Math.round(abs / 1440), "day"];
  const label = `${unit[0]} ${unit[1]}${unit[0] === 1 ? "" : "s"}`;
  if (abs < 1) return "now";
  return mins > 0 ? `in ${label}` : `${label} ago`;
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const toLocalInput = (v: string | null | undefined) => {
  if (!v) return "";
  const x = new Date(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};

export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const initials = (name: string) =>
  name
    .replace(/^(Dr\.?|Prof\.?)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
