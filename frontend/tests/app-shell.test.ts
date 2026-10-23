import { describe, expect, it } from "vitest";
import { isNavActive } from "@/components/ui/app-shell";

describe("isNavActive — navigation matching logic", () => {
  // ── Role home links must use exact match ────────────────────────────────

  it("marks /coordinator active when pathname === /coordinator", () => {
    expect(isNavActive("/coordinator", "/coordinator")).toBe(true);
  });

  it("does NOT mark /coordinator active when viewing /coordinator/new", () => {
    expect(isNavActive("/coordinator/new", "/coordinator")).toBe(false);
  });

  it("does NOT mark /coordinator active when viewing /coordinator/calendar", () => {
    expect(isNavActive("/coordinator/calendar", "/coordinator")).toBe(false);
  });

  it("does NOT mark /coordinator active when viewing /coordinator/events/123", () => {
    expect(isNavActive("/coordinator/events/123", "/coordinator")).toBe(false);
  });

  it("marks /admin active when pathname === /admin", () => {
    expect(isNavActive("/admin", "/admin")).toBe(true);
  });

  it("does NOT mark /admin active when viewing /admin/approvals", () => {
    expect(isNavActive("/admin/approvals", "/admin")).toBe(false);
  });

  it("marks /student active when pathname === /student", () => {
    expect(isNavActive("/student", "/student")).toBe(true);
  });

  it("does NOT mark /student active when viewing /student/mine", () => {
    expect(isNavActive("/student/mine", "/student")).toBe(false);
  });

  // ── Nested section links use prefix matching ─────────────────────────────

  it("marks /coordinator/events active when pathname === /coordinator/events", () => {
    expect(isNavActive("/coordinator/events", "/coordinator/events")).toBe(true);
  });

  it("marks /coordinator/events active when viewing /coordinator/events/123", () => {
    expect(isNavActive("/coordinator/events/123", "/coordinator/events")).toBe(true);
  });

  it("marks /coordinator/events active when viewing /coordinator/events/123/edit", () => {
    expect(isNavActive("/coordinator/events/123/edit", "/coordinator/events")).toBe(true);
  });

  it("does NOT mark /coordinator/events active when viewing /coordinator/calendar", () => {
    expect(isNavActive("/coordinator/calendar", "/coordinator/events")).toBe(false);
  });

  it("does NOT false-match /coordinator/events-archive with /coordinator/events", () => {
    // Prefix must end at a '/' boundary
    expect(isNavActive("/coordinator/events-archive", "/coordinator/events")).toBe(false);
  });

  it("marks /admin/approvals active when viewing /admin/approvals/42", () => {
    expect(isNavActive("/admin/approvals/42", "/admin/approvals")).toBe(true);
  });
});
