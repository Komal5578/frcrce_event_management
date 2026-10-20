// Display time zone: ONE fixed college zone. [assumed A3] Asia/Kolkata (Mumbai, IST); change it here only.
// Stored times are UTC ISO strings (YYYY-MM-DDTHH:MM:SS.mmmZ); every user-facing time goes through this file.
export const DISPLAY_TZ = "Asia/Kolkata";

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TZ, hour12: false, ...o });
const F = {
  date: fmt({ weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
  short: fmt({ day: "2-digit", month: "short", year: "numeric" }),
  time: fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  parts: fmt({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }),
};
const parts = (f: Intl.DateTimeFormat, d: Date) => Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value])) as Record<string, string>;
const d0 = (iso: string) => new Date(iso);

/** "Fri 20 Feb 2026" */
export function formatDate(iso: string): string {
  const p = parts(F.date, d0(iso));
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
}
/** "08 Mar 2026" */
export function formatShortDate(iso: string): string {
  const p = parts(F.short, d0(iso));
  return `${p.day} ${p.month} ${p.year}`;
}
/** "17:00" */
export function formatTime(iso: string): string {
  const p = parts(F.time, d0(iso));
  return `${p.hour}:${p.minute}`;
}
export const formatDateTime = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`;
export function formatRange(startIso: string, endIso: string): string {
  return dayKey(startIso) === dayKey(endIso)
    ? `${formatDateTime(startIso)} to ${formatTime(endIso)}`
    : `${formatDateTime(startIso)} to ${formatDateTime(endIso)}`;
}
/** "YYYY-MM-DD" in the display zone. */
export function dayKey(iso: string): string {
  const p = parts(F.parts, d0(iso));
  return `${p.year}-${p.month}-${p.day}`;
}
/** Native-input values in the display zone. */
export function isoToInputs(iso: string): { date: string; time: string } {
  const p = parts(F.parts, d0(iso));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
/** Local date + time in DISPLAY_TZ -> stored ISO, or null when not a real date and time. */
export function localToIso(date: string, time: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date), t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m || !t) return null;
  const [y, mo, d, h, mi] = [m[1], m[2], m[3], t[1], t[2]].map(Number);
  if (h > 23 || mi > 59) return null;
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const chk = new Date(guess);
  if (chk.getUTCFullYear() !== y || chk.getUTCMonth() !== mo - 1 || chk.getUTCDate() !== d) return null;
  // zone offset at the guessed instant: read the guess back as local wall time, difference = offset
  const p = parts(F.parts, chk);
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  let utc = guess - (wall - guess);
  // second pass covers a zone whose offset differs at the corrected instant (DST edge)
  const q = parts(F.parts, new Date(utc));
  utc = guess - (Date.UTC(+q.year, +q.month - 1, +q.day, +q.hour, +q.minute, +q.second) - utc);
  return new Date(utc).toISOString();
}
/** "Today" | "Tomorrow" | null, by display-zone calendar day. */
export function relativeDay(iso: string, now: Date = new Date()): "Today" | "Tomorrow" | null {
  const k = dayKey(iso), today = dayKey(now.toISOString());
  if (k === today) return "Today";
  const next = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10) + 1)).toISOString().slice(0, 10);
  return k === next ? "Tomorrow" : null;
}
