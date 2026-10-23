// tests/xcut/csv.test.ts — RFC 4180 CSV tests for lib/csv.ts
// The RFC 4180 round-trip parser lives only here (not in production code).

import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

// ---------------------------------------------------------------------------
// Local RFC 4180 parser (test-only — NOT exported)
// Handles: quoted cells, escaped double-quotes, CRLF/LF line endings,
// and embedded newlines inside quoted fields.
// ---------------------------------------------------------------------------
function parseCsv(raw: string): string[][] {
  // Strip leading BOM if present.
  const src = raw.startsWith("\uFEFF") ? raw.slice(1) : raw;
  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;

  while (i < src.length) {
    if (src[i] === '"') {
      // Quoted cell — scan for the closing quote, allowing embedded CRLF/LF.
      i++; // skip opening quote
      let val = "";
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') { val += '"'; i += 2; } // escaped quote
          else { i++; break; } // closing quote
        } else {
          val += src[i++];
        }
      }
      row.push(val);
      // After closing quote: expect , or CR LF or LF or end.
      if (src[i] === ",") i++;
    } else if (src[i] === "\r" && src[i + 1] === "\n") {
      // CRLF row boundary.
      if (row.length > 0 || src[i - 1] !== "\n") rows.push(row);
      row = [];
      i += 2;
    } else if (src[i] === "\n") {
      // LF row boundary.
      rows.push(row);
      row = [];
      i++;
    } else {
      // Unquoted cell (our writer always quotes; included for robustness).
      let val = "";
      while (i < src.length && src[i] !== "," && src[i] !== "\r" && src[i] !== "\n") {
        val += src[i++];
      }
      row.push(val);
      if (src[i] === ",") i++;
    }
  }
  // Flush last row if not empty.
  if (row.length > 0) rows.push(row);
  return rows;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const COLS = [
  { key: "title", label: "Title" },
  { key: "count", label: "Count" },
  { key: "note", label: "Note" },
];

function row(title: string, count: string | number | null, note: string | null) {
  return { title, count, note };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("toCsv", () => {
  it("starts with UTF-8 BOM (U+FEFF)", () => {
    const csv = toCsv(COLS, []);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("uses CRLF line endings and ends with CRLF", () => {
    const csv = toCsv(COLS, [row("A", 1, null)]);
    // All line endings must be CRLF.
    expect(csv).toContain("\r\n");
    // Should not have bare LF (except as part of CRLF).
    const withoutCRLF = csv.replace(/\r\n/g, "");
    expect(withoutCRLF).not.toContain("\n");
    // Must end with CRLF.
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("header row uses column labels", () => {
    const parsed = parseCsv(toCsv(COLS, []));
    expect(parsed[0]).toEqual(["Title", "Count", "Note"]);
  });

  it("wraps all cells in double quotes", () => {
    const csv = toCsv([{ key: "v", label: "V" }], [{ v: "hello" }]);
    // After BOM and header, data line should be "hello".
    const lines = csv.slice(1).split("\r\n").filter(Boolean);
    expect(lines[1]).toBe('"hello"');
  });

  it("doubles embedded double-quotes", () => {
    const csv = toCsv([{ key: "v", label: "V" }], [{ v: 'say "hello"' }]);
    const parsed = parseCsv(csv);
    expect(parsed[1][0]).toBe('say "hello"');
  });

  it("handles comma in cell value (round-trip)", () => {
    const csv = toCsv(COLS, [row("Event, Annual", 10, null)]);
    const parsed = parseCsv(csv);
    expect(parsed[1][0]).toBe("Event, Annual");
  });

  it("handles embedded newline in title (round-trip)", () => {
    const csv = toCsv([{ key: "v", label: "V" }], [{ v: "line1\nline2" }]);
    // After round-trip, value should be preserved (parser handles multiline quoted).
    const parsed = parseCsv(csv);
    expect(parsed[1][0]).toBe("line1\nline2");
  });

  it("guards formula injection: =SUM(1) gets leading single-quote", () => {
    const csv = toCsv([{ key: "v", label: "V" }], [{ v: "=SUM(1)" }]);
    const parsed = parseCsv(csv);
    // The stored value has the ' prefix, which is the injection guard.
    expect(parsed[1][0]).toBe("'=SUM(1)");
  });

  it("guards @x injection string", () => {
    const csv = toCsv([{ key: "v", label: "V" }], [{ v: "@x" }]);
    const parsed = parseCsv(csv);
    expect(parsed[1][0]).toBe("'@x");
  });

  it("numeric -1 is NOT injection-guarded (stays negative number)", () => {
    const csv = toCsv([{ key: "v", label: "V" }], [{ v: -1 }]);
    const parsed = parseCsv(csv);
    // No leading quote; the numeric value is just "-1".
    expect(parsed[1][0]).toBe("-1");
    expect(parsed[1][0].startsWith("'")).toBe(false);
  });

  it("null cell becomes empty quoted cell", () => {
    const csv = toCsv(COLS, [row("A", null, null)]);
    const parsed = parseCsv(csv);
    expect(parsed[1][2]).toBe("");
  });

  it("round-trip: parse(toCsv(cols, rows)) equals rows stringified", () => {
    const data = [
      row("Workshop, Annual", 42, "All good"),
      row('Quote: "test"', 0, null),
      row("=ATTACK()", 7, "@formula"),
    ];
    const csv = toCsv(COLS, data);
    const parsed = parseCsv(csv);
    // Skip header row (index 0).
    for (let i = 0; i < data.length; i++) {
      const dataRow = data[i];
      const parsedRow = parsed[i + 1];
      // Title: injection prefix may be there for formula strings; strip it for comparison.
      const expectedTitle = dataRow.title;
      const parsedTitle = parsedRow[0].startsWith("'") ? parsedRow[0].slice(1) : parsedRow[0];
      expect(parsedTitle).toBe(expectedTitle);
      // Count.
      const expectedCount = dataRow.count === null ? "" : String(dataRow.count);
      expect(parsedRow[1]).toBe(expectedCount);
      // Note.
      const parsedNote = parsedRow[2].startsWith("'") ? parsedRow[2].slice(1) : parsedRow[2];
      expect(parsedNote).toBe(dataRow.note ?? "");
    }
  });
});
