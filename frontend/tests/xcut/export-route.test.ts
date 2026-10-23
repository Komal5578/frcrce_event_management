// tests/xcut/export-route.test.ts — CSV export route handler unit & authorization tests

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { d1Shim, freshDb } from "../helpers/sqlite";
import { toCsv } from "@/lib/csv";
import { buildReport } from "@/lib/domain/reports";

let db: DatabaseSync;
vi.mock("@/lib/db", () => ({ getDb: () => d1Shim(db) }));

const mockProfile = vi.fn();
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    getCurrentProfile: () => mockProfile(),
  };
});

const COORD = { id: "a0000000-0000-0000-0000-000000000001", name: "Coordinator A", role: "coordinator" as const };
const ADMIN = { id: "a0000000-0000-0000-0000-000000000003", name: "Admin User", role: "admin" as const };
const STUDENT = { id: "a0000000-0000-0000-0000-000000000004", name: "Student S", role: "student" as const };

const adminRoute = () => import("@/app/(admin)/admin/reports/export/route");
const coordRoute = () => import("@/app/(coordinator)/coordinator/reports/export/route");

beforeEach(() => {
  db = freshDb({ seed: true });
  mockProfile.mockReset();
});

describe("CSV export route handlers", () => {
  it("returns 403 Not allowed when there is no session", async () => {
    mockProfile.mockResolvedValue(null);
    const { GET: adminGet } = await adminRoute();
    const { GET: coordGet } = await coordRoute();

    const resAdmin = await adminGet(new Request("http://localhost/admin/reports/export"));
    expect(resAdmin.status).toBe(403);
    expect(await resAdmin.text()).toBe("Not allowed");
    expect(resAdmin.headers.get("Cache-Control")).toBe("no-store");

    const resCoord = await coordGet(new Request("http://localhost/coordinator/reports/export"));
    expect(resCoord.status).toBe(403);
    expect(await resCoord.text()).toBe("Not allowed");
    expect(resCoord.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 403 Not allowed for student session on both routes", async () => {
    mockProfile.mockResolvedValue(STUDENT);
    const { GET: adminGet } = await adminRoute();
    const { GET: coordGet } = await coordRoute();

    const resAdmin = await adminGet(new Request("http://localhost/admin/reports/export"));
    expect(resAdmin.status).toBe(403);
    expect(await resAdmin.text()).toBe("Not allowed");

    const resCoord = await coordGet(new Request("http://localhost/coordinator/reports/export"));
    expect(resCoord.status).toBe(403);
    expect(await resCoord.text()).toBe("Not allowed");
  });

  it("returns 403 when coordinator attempts to call admin export route", async () => {
    mockProfile.mockResolvedValue(COORD);
    const { GET: adminGet } = await adminRoute();

    const res = await adminGet(new Request("http://localhost/admin/reports/export"));
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Not allowed");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("coordinator route returns 200 with CSV headers and matching body", async () => {
    mockProfile.mockResolvedValue(COORD);
    const { GET: coordGet } = await coordRoute();

    const res = await coordGet(new Request("http://localhost/coordinator/reports/export?status=open"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="events-report.csv"');
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);

    const body = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    const expectedReport = await buildReport({ id: COORD.id, role: COORD.role }, { status: "open" }, new Date());
    const expectedCsv = toCsv(expectedReport.columns, expectedReport.rows);
    expect(body).toBe(expectedCsv);
  });

  it("admin route returns 200 with CSV headers and matching body for admin", async () => {
    mockProfile.mockResolvedValue(ADMIN);
    const { GET: adminGet } = await adminRoute();

    const res = await adminGet(new Request("http://localhost/admin/reports/export"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="events-report.csv"');
    expect(res.headers.get("Cache-Control")).toBe("no-store");

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);

    const body = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    const expectedReport = await buildReport({ id: ADMIN.id, role: ADMIN.role }, {}, new Date());
    const expectedCsv = toCsv(expectedReport.columns, expectedReport.rows);
    expect(body).toBe(expectedCsv);
  });
});
