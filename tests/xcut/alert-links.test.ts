// tests/xcut/alert-links.test.ts — verifies alertHref mappings match real route files

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { alertHref } from "@/lib/alert-links";
import type { Role } from "@/lib/auth";
import type { AlertKind } from "@/lib/domain/alerts";

// Helper to check if a pathname matches an existing page.tsx under app/
function routeExists(pathname: string): boolean {
  const appDir = path.resolve(__dirname, "../../app");

  // Collect all page.tsx files
  function findPages(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let pages: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        pages = pages.concat(findPages(full));
      } else if (entry.name === "page.tsx") {
        pages.push(full);
      }
    }
    return pages;
  }

  const allPages = findPages(appDir);

  // Convert page filepath to route pattern
  // E.g. app/(admin)/admin/approvals/[id]/page.tsx -> /admin/approvals/:id
  const routePatterns = allPages.map((pageFile) => {
    let rel = path.relative(appDir, pageFile);
    // remove /page.tsx
    rel = rel.replace(/(^|\/)page\.tsx$/, "");
    // remove route groups like (admin), (coordinator), (student)
    rel = rel.replace(/\([^)]+\)\/?/g, "");
    if (!rel.startsWith("/")) rel = "/" + rel;
    // normalize /admin/ -> /admin
    if (rel.length > 1 && rel.endsWith("/")) rel = rel.slice(0, -1);
    // convert [id] to regex
    const regexPattern = "^" + rel.replace(/\[([^\]]+)\]/g, "[^/]+") + "$";
    return new RegExp(regexPattern);
  });

  return routePatterns.some((pattern) => pattern.test(pathname));
}

describe("alertHref route mapping", () => {
  const roles: Role[] = ["admin", "coordinator", "student"];
  const kinds: AlertKind[] = ["clash", "lowreg", "overdue"];
  const sampleEventId = "e-123456";

  for (const role of roles) {
    for (const kind of kinds) {
      it(`returns an existing route for role=${role}, kind=${kind}`, () => {
        const href = alertHref(role, kind, sampleEventId);
        expect(href).toMatch(/^\/[a-z0-9\-_/]+$/);
        expect(routeExists(href)).toBe(true);
      });
    }
  }
});
