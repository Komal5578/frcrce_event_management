import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STATUS_META, StatusBadge, type StatusKey } from "@/components/ui/status-badge";

const css = readFileSync("app/globals.css", "utf8");
const entries = Object.entries(STATUS_META);

describe("status vocabulary", () => {
  it("has all required status keys from dom-status-vocabulary", () => {
    const keys = Object.keys(STATUS_META);
    // Event family
    for (const k of ["draft", "pending", "approved", "open", "ongoing", "completed", "cancelled", "full", "returned"]) {
      expect(keys, `missing event key: ${k}`).toContain(k);
    }
    // Task family
    for (const k of ["todo", "doing", "done", "overdue"]) {
      expect(keys, `missing task key: ${k}`).toContain(k);
    }
    // Registration family
    for (const k of ["registered", "waitlisted", "reg-cancelled"]) {
      expect(keys, `missing registration key: ${k}`).toContain(k);
    }
    // Alert family
    for (const k of ["alert-clash", "alert-low", "alert-overdue"]) {
      expect(keys, `missing alert key: ${k}`).toContain(k);
    }
  });

  it("has at least 19 keys (9 event + 4 task + 3 registration + 3 alert)", () => {
    expect(Object.keys(STATUS_META).length).toBeGreaterThanOrEqual(19);
  });

  it("all labels are non-empty strings", () => {
    const labels = entries.map(([, m]) => m.label);
    expect(labels.every((l) => l.length > 0)).toBe(true);
  });

  it("all icons are truthy (Lucide React components)", () => {
    for (const [key, m] of entries) {
      expect(m.Icon, `${key}.Icon must be defined`).toBeTruthy();
      // Lucide icons are object-shaped in Node/test envs (they can be objects or functions)
      expect(["function", "object"].includes(typeof m.Icon), `${key}.Icon must be a React component`).toBe(true);
    }
  });

  it("has the seven core event labels verbatim", () => {
    const labels = entries.map(([, m]) => m.label);
    for (const l of ["Draft", "Pending approval", "Approved", "Open", "Ongoing", "Completed", "Cancelled"]) {
      expect(labels, `missing core label: "${l}"`).toContain(l);
    }
  });

  it("uses own key's CSS tokens, and they exist in globals.css", () => {
    for (const [key, m] of entries) {
      expect(m.className).toContain(`text-status-${key}-fg`);
      expect(m.className).toContain(`bg-status-${key}-bg`);
      expect(css, `missing --color-status-${key}-fg in globals.css`).toContain(`--color-status-${key}-fg:`);
      expect(css, `missing --color-status-${key}-bg in globals.css`).toContain(`--color-status-${key}-bg:`);
    }
  });

  it("rejects unknown keys at compile time", () => {
    // @ts-expect-error bogus is not a StatusKey
    const bad: StatusKey = "bogus";
    expect(bad).toBe("bogus");
    expect(typeof StatusBadge).toBe("function");
  });
});
