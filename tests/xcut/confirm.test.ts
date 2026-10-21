// tests/xcut/confirm.test.ts — static guard for XCUT-06 (Review & Confirm dialog and feedback)

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const APP_DIR = path.join(ROOT_DIR, "app");

function findTsxFiles(dir: string): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findTsxFiles(full));
    } else if (entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

// Irreversible actions from actions.ts files that require ConfirmDialog
const IRREVERSIBLE_ACTIONS = [
  { name: "submitAction", label: "Submit for approval", specRow: "Coordinator submit draft" },
  { name: "advanceAction", label: "Advance event lifecycle", specRow: "Coordinator open / start / complete event" },
  { name: "cancelAction", label: "Cancel event", specRow: "Coordinator cancel event" },
  { name: "changeAction", label: "Submit change request", specRow: "Coordinator submit change request" },
  { name: "approveAction", label: "Approve event", specRow: "Admin approve event" },
  { name: "returnAction", label: "Return event with reason", specRow: "Admin return event" },
  { name: "registerAction", label: "Register / Join waitlist", specRow: "Student register for event" },
  { name: "cancelRegistrationAction", label: "Cancel registration", specRow: "Student cancel registration" },
];

// Reversible actions exempted from ConfirmDialog
const EXEMPT_ACTIONS = [
  { name: "startDraft", reason: "Starting a draft creates an editable draft row (reversible)" },
  { name: "saveDraftAction", reason: "Autosaving drafts is ongoing and non-destructive" },
  { name: "addTaskAction", reason: "Adding a task can be deleted or edited" },
  { name: "setTaskAction", reason: "Toggling a task status has immediate Undo support" },
  { name: "setAllocationAction", reason: "Adjusting resource counts is freely reversible" },
  { name: "saveVenueAction", reason: "Catalog editing for venues" },
  { name: "saveResourceAction", reason: "Catalog editing for resources" },
];

describe("XCUT-06: Confirm guard", () => {
  it("all irreversible actions are gated by ConfirmDialog", () => {
    const tsxFiles = findTsxFiles(APP_DIR);

    for (const action of IRREVERSIBLE_ACTIONS) {
      // Find all files calling or importing this action
      const callers = tsxFiles.filter((file) => {
        const content = fs.readFileSync(file, "utf-8");
        return content.includes(action.name);
      });

      for (const caller of callers) {
        const content = fs.readFileSync(caller, "utf-8");
        const rel = path.relative(ROOT_DIR, caller);

        // Caller must either directly import ConfirmDialog, or import a dedicated flow component
        // (confirm-flow, cancel-flow, register-flow, decision-card) that embeds ConfirmDialog
        const hasConfirm =
          content.includes("ConfirmDialog") ||
          content.includes("ConfirmFlow") ||
          content.includes("DecisionCard") ||
          content.includes("CancelFlow") ||
          content.includes("RegisterFlow");

        expect(
          hasConfirm,
          `${rel} calls irreversible action "${action.name}" (${action.label}) but does not reference ConfirmDialog or a confirm flow wrapper`,
        ).toBe(true);
      }
    }
  });

  it("all files referencing ConfirmDialog reference success feedback (Alert or role='status')", () => {
    const tsxFiles = findTsxFiles(APP_DIR);
    const dialogFiles = tsxFiles.filter((file) => {
      const content = fs.readFileSync(file, "utf-8");
      return content.includes("ConfirmDialog");
    });

    for (const file of dialogFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const rel = path.relative(ROOT_DIR, file);

      // Must import Alert or use role="status" or role="alert" or flash feedback
      const hasFeedback =
        content.includes("Alert") ||
        content.includes('role="status"') ||
        content.includes('role="alert"') ||
        content.includes("flash") ||
        content.includes("toast");

      expect(
        hasFeedback,
        `${rel} uses ConfirmDialog but is missing success feedback (Alert or role="status")`,
      ).toBe(true);
    }
  });

  it("Return with reason flow enforces a non-empty reason before confirmation", () => {
    // Check decision-card.tsx for required reason validation
    const decisionCardPath = path.join(APP_DIR, "(admin)/admin/_components/decision-card.tsx");
    expect(fs.existsSync(decisionCardPath)).toBe(true);
    const content = fs.readFileSync(decisionCardPath, "utf-8");

    expect(content).toMatch(/reason\.trim\(\)/);
  });
});
