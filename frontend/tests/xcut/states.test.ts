// tests/xcut/states.test.ts — static guard for XCUT-03 (loading, empty, error states)

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.resolve(__dirname, "../../app");

function findFiles(dir: string, filename: string): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findFiles(full, filename));
    } else if (entry.name === filename) {
      results.push(full);
    }
  }
  return results;
}

function hasAncestorFile(pageFile: string, targetFile: string): boolean {
  let curr = path.dirname(pageFile);
  while (curr.startsWith(APP_DIR)) {
    if (fs.existsSync(path.join(curr, targetFile))) {
      return true;
    }
    if (curr === APP_DIR) break;
    curr = path.dirname(curr);
  }
  return false;
}

describe("XCUT-03: States guard", () => {
  it("root not-found, error, and global-error files exist", () => {
    expect(fs.existsSync(path.join(APP_DIR, "not-found.tsx")), "app/not-found.tsx exists").toBe(true);
    expect(fs.existsSync(path.join(APP_DIR, "error.tsx")), "app/error.tsx exists").toBe(true);
    expect(fs.existsSync(path.join(APP_DIR, "global-error.tsx")), "app/global-error.tsx exists").toBe(true);
  });

  it("every page has an error.tsx ancestor", () => {
    const pages = findFiles(APP_DIR, "page.tsx");
    expect(pages.length).toBeGreaterThan(0);

    for (const page of pages) {
      const rel = path.relative(APP_DIR, page);
      const hasError = hasAncestorFile(page, "error.tsx");
      expect(hasError, `Page ${rel} must have an error.tsx ancestor`).toBe(true);
    }
  });

  it("every page except login, design, and root has a loading.tsx ancestor", () => {
    const pages = findFiles(APP_DIR, "page.tsx");
    const exempt = [
      path.join(APP_DIR, "page.tsx"),
      path.join(APP_DIR, "login/page.tsx"),
      path.join(APP_DIR, "design/page.tsx"),
    ];

    for (const page of pages) {
      if (exempt.includes(page)) continue;
      const rel = path.relative(APP_DIR, page);
      const hasLoading = hasAncestorFile(page, "loading.tsx");
      expect(hasLoading, `Page ${rel} must have a loading.tsx ancestor`).toBe(true);
    }
  });

  it("no error.tsx or global-error.tsx prints error.message", () => {
    const errorFiles = findFiles(APP_DIR, "error.tsx").concat(findFiles(APP_DIR, "global-error.tsx"));
    for (const file of errorFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const rel = path.relative(APP_DIR, file);
      expect(content.includes("error.message"), `File ${rel} must not contain error.message`).toBe(false);
    }
  });

  it("every list route contains designed empty-state copy or uses EmptyState", () => {
    const listRoutes = [
      { route: "app/(coordinator)/coordinator/page.tsx", empty: "No events yet" },
      { route: "app/(coordinator)/coordinator/tasks/page.tsx", empty: "No tasks yet" },
      { route: "app/(coordinator)/coordinator/notifications/page.tsx", empty: "Nothing new" },
      { route: "app/(coordinator)/coordinator/reports/page.tsx", empty: "No events match" },
      { route: "app/(admin)/admin/approvals/page.tsx", empty: "No events are waiting" },
      { route: "app/(admin)/admin/catalog/page.tsx", empty: "first venue" },
      { route: "app/(admin)/admin/reports/page.tsx", empty: "No events match" },
      { route: "app/(student)/student/page.tsx", empty: "No events match" },
      { route: "app/(student)/student/mine/page.tsx", empty: "You have not registered" },
      { route: "app/(student)/student/tasks/page.tsx", empty: "You have no tasks" },
      { route: "app/(student)/student/alerts/page.tsx", empty: "Nothing new" },
    ];

    const rootDir = path.resolve(APP_DIR, "..");
    for (const { route, empty } of listRoutes) {
      const filePath = path.join(rootDir, route);
      expect(fs.existsSync(filePath), `${route} exists`).toBe(true);
      let content = fs.readFileSync(filePath, "utf-8");

      // Also check sibling layout or _components in the same role folder
      const routeDir = path.dirname(filePath);
      const layoutFile = path.join(routeDir, "layout.tsx");
      if (fs.existsSync(layoutFile)) {
        content += " " + fs.readFileSync(layoutFile, "utf-8");
      }
      for (const compDir of [path.join(routeDir, "_components"), path.join(path.dirname(routeDir), "_components")]) {
        if (fs.existsSync(compDir)) {
          for (const f of fs.readdirSync(compDir)) {
            if (f.endsWith(".tsx")) {
              content += " " + fs.readFileSync(path.join(compDir, f), "utf-8");
            }
          }
        }
      }

      const hasHeading = content.toLowerCase().includes(empty.toLowerCase());
      const usesEmptyState = content.includes("EmptyState") || content.includes("ReportView");
      expect(
        hasHeading || usesEmptyState,
        `${route} must contain empty copy "${empty}" or use EmptyState / ReportView`,
      ).toBe(true);
    }
  });
});
