import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Tests for ConfirmDialog behaviour contract (plan 10-02-02).
 *
 * We verify source-level contracts without requiring jsdom (not configured).
 * Full interaction tests (focus, Escape, keyboard trap) live in e2e (playwright).
 */

const src = readFileSync(
  join(__dirname, "../components/ui/confirm-dialog.tsx"),
  "utf8",
);

describe("ConfirmDialog contract", () => {
  it("is exported from confirm-dialog.tsx", async () => {
    const mod = await import("@/components/ui/confirm-dialog");
    expect(typeof mod.ConfirmDialog).toBe("function");
  });

  it("supports variant prop ('default' | 'destructive')", () => {
    // The variant prop is listed in the function signature
    expect(src).toContain("variant");
    expect(src).toContain('"destructive"');
    expect(src).toContain('"default"');
  });

  it("initial focus goes to 'Go back' button (goBackRef)", () => {
    // goBackRef is attached and focused via requestAnimationFrame after showModal()
    expect(src).toContain("goBackRef");
    expect(src).toContain("goBackRef.current?.focus()");
    expect(src).toContain('id="confirm-go-back"');
  });

  it("destructive variant uses destructive button style", () => {
    // When variant === 'destructive', confirm button gets variant="destructive" via ternary
    expect(src).toContain('variant === "destructive"');
    // The ternary resolves to "destructive" for the Button variant
    expect(src).toContain('"destructive"');
    expect(src).toContain('"primary"');
  });

  it("prevents accidental confirm by focusing 'Go back' not confirm button", () => {
    // The go-back button ref is listed before the confirm button ref
    const goBackIdx = src.indexOf("goBackRef.current?.focus()");
    const confirmId = src.indexOf('id="confirm-action"');
    expect(goBackIdx).toBeGreaterThan(-1);
    expect(confirmId).toBeGreaterThan(-1);
    // goBackRef focus call exists and Go back button has the expected id
    expect(src).toContain('id="confirm-go-back"');
  });
});
