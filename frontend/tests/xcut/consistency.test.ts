// tests/xcut/consistency.test.ts — static guard for XCUT-05 (terminology, status vocabulary, icon accessibility)

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const APP_DIR = path.join(ROOT_DIR, "app");
const COMPONENTS_DIR = path.join(ROOT_DIR, "components");

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

// Documented allow-lists
const STATUS_TOKEN_ALLOWED_FILES = [
  "components/ui/status-badge.tsx",
  "components/ui/alert.tsx", // Alert component intentionally shares approved/open/pending/cancelled status colors
  "components/ui/attention-list.tsx", // Calm check icon reuses text-status-open-fg
];

describe("XCUT-05: Consistency guard", () => {
  it("status color tokens appear only in designated UI components", () => {
    const tsxFiles = findTsxFiles(APP_DIR).concat(findTsxFiles(COMPONENTS_DIR));
    const tokenRegex = /\b(text|bg)-status-[a-z]+-(fg|bg)\b/g;

    const violations: string[] = [];
    for (const file of tsxFiles) {
      const rel = path.relative(ROOT_DIR, file);
      if (STATUS_TOKEN_ALLOWED_FILES.includes(rel)) continue;

      const content = fs.readFileSync(file, "utf-8");
      let match;
      while ((match = tokenRegex.exec(content)) !== null) {
        violations.push(`${rel}: ${match[0]}`);
      }
    }

    expect(
      violations,
      `Status colors should only be used in designated badge/alert components:\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  it("banned action and status synonyms are not used on action buttons or status labels", () => {
    const tsxFiles = findTsxFiles(APP_DIR).concat(findTsxFiles(COMPONENTS_DIR));

    // Banned button labels:
    // - "Delete" instead of "Cancel" or "Retire"
    // - "Approved" on an action button instead of "Approve"
    const bannedButtonPatterns = [
      /<(button|Button|Link|a)\b[^>]*>[^<]*\bDelete\b[^<]*<\/(button|Button|Link|a)>/i,
      /<(button|Button|Link|a)\b[^>]*>[^<]*\bApproved\b[^<]*<\/(button|Button|Link|a)>/i,
    ];

    const violations: string[] = [];
    for (const file of tsxFiles) {
      const rel = path.relative(ROOT_DIR, file);
      const content = fs.readFileSync(file, "utf-8");

      for (const pattern of bannedButtonPatterns) {
        const match = content.match(pattern);
        if (match) {
          violations.push(`${rel}: ${match[0]}`);
        }
      }
    }

    expect(
      violations,
      `Banned synonyms found on interactive buttons:\n${violations.join("\n")}`,
    ).toEqual([]);
  });

  it("lucide icon usages in app/ have aria-hidden or an accessible label", () => {
    const tsxFiles = findTsxFiles(APP_DIR);
    // Matches JSX components with uppercase names that resemble Lucide icons: <IconName ... />
    // Lucide icons should carry aria-hidden="true" or be enclosed inside accessible buttons
    const unhiddenIconRegex = /<([A-Z][a-zA-Z0-9]+)\s+([^>]*?)(\/?>)/g;

    // Filter to known lucide components imported from lucide-react
    const violations: string[] = [];
    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const lucideImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/);
      if (!lucideImportMatch) continue;

      const icons = lucideImportMatch[1]
        .split(",")
        .map((s) => s.trim().split(" as ")[0].trim())
        .filter((s) => s && s !== "type LucideIcon");

      for (const icon of icons) {
        const iconTagRegex = new RegExp(`<${icon}\\b([^>]*?)(\\/?)(>)`, "g");
        let m;
        while ((m = iconTagRegex.exec(content)) !== null) {
          const attrs = m[1];
          if (!attrs.includes("aria-hidden") && !attrs.includes("{...icon}")) {
            violations.push(`${path.relative(ROOT_DIR, file)}: <${icon} ${attrs.trim()}/>`);
          }
        }
      }
    }

    expect(
      violations,
      `Lucide icons missing aria-hidden="true":\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});
