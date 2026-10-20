// lib/csv.ts — pure RFC 4180 CSV writer with UTF-8 BOM and spreadsheet injection guard.
// No dependency on lib/db or any async code.

const INJECTION_RE = /^[=+\-@\t\r]/;

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  if (typeof value === "number") {
    // Numbers are never injection-guarded per spec (they cannot be formulas).
    return `"${value}"`;
  }
  const str = String(value);
  // Guard spreadsheet injection: strings starting with = + - @ tab or CR get a leading single quote.
  const guarded = INJECTION_RE.test(str) ? `'${str}` : str;
  // Wrap in double quotes, doubling any embedded double quotes.
  return `"${guarded.replace(/"/g, '""')}"`;
}

/**
 * Produce a UTF-8 BOM + RFC 4180 CSV string.
 * - Header row comes from cols[*].label.
 * - Data rows come from rows (cols[*].key maps to the value).
 * - Null/undefined values produce an empty quoted cell.
 * - String cells starting with = + - @ tab or CR get a leading ' (injection guard).
 * - Numbers are passed as-is (no injection prefix).
 * - All lines end with CRLF; a trailing CRLF is appended.
 * - Output begins with U+FEFF (BOM) so Excel opens it as UTF-8.
 */
export function toCsv(
  cols: { key: string; label: string }[],
  rows: Record<string, string | number | null>[],
): string {
  const header = cols.map((c) => cell(c.label)).join(",");
  const dataLines = rows.map((row) =>
    cols.map((c) => cell(row[c.key] ?? null)).join(","),
  );
  const lines = [header, ...dataLines];
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
