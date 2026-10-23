import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STATUS_META, StatusBadge, type StatusKey } from "@/components/ui/status-badge";

const css = readFileSync("app/globals.css", "utf8");
const entries = Object.entries(STATUS_META);

describe("status vocabulary", () => {
  it("has exactly the seventeen keys", () => {
    expect(Object.keys(STATUS_META).sort()).toEqual(
      [
      "approved", "cancelled", "clash", "completed", "doing", "done", "draft", "full", "lowreg", "ongoing", "open",
      "overdue", "pending", "registered", "returned", "todo", "waitlisted",
    ],
    );
  });

  it("has unique non-empty labels and unique icons", () => {
    const labels = entries.map(([, m]) => m.label);
    expect(labels.every((l) => l.length > 0)).toBe(true);
    expect(new Set(labels).size).toBe(entries.length);
    expect(new Set(entries.map(([, m]) => m.Icon)).size).toBe(entries.length);
  });

  it("has the seven phase-required labels verbatim", () => {
    const labels = entries.map(([, m]) => m.label);
    for (const l of ["Draft", "Pending approval", "Approved", "Open", "Ongoing", "Completed", "Cancelled"]) {
      expect(labels).toContain(l);
    }
  });

  it("uses only its own key's tokens, and they exist in globals.css", () => {
    for (const [key, m] of entries) {
      expect(m.className).toContain(`text-status-${key}-fg`);
      expect(m.className).toContain(`bg-status-${key}-bg`);
      expect(css).toContain(`--color-status-${key}-fg:`);
      expect(css).toContain(`--color-status-${key}-bg:`);
    }
  });

  it("rejects unknown keys at compile time", () => {
    // @ts-expect-error bogus is not a StatusKey
    const bad: StatusKey = "bogus";
    expect(bad).toBe("bogus");
    expect(typeof StatusBadge).toBe("function");
  });
});
