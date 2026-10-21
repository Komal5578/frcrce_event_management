// tests/xcut/targets.test.ts — static guard for XCUT-04 (touch target size, rem sizing, focus rings)

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

// Allow-list for exceptions with explicit comments
const TARGET_SIZE_ALLOWLIST: { file: string; reason: string }[] = [
  // Example: native hidden checkboxes/inputs handled by labels with 44px targets
  { file: "peer sr-only", reason: "Hidden native inputs whose associated label element provides the 44px target" },
];

describe("XCUT-04: Target sizes, rem sizing and focus visibility", () => {
  it("all role layouts mount AppShell and AppShell mounts TextSizeControl", () => {
    const layouts = [
      "app/(admin)/layout.tsx",
      "app/(coordinator)/layout.tsx",
      "app/(student)/layout.tsx",
    ];

    for (const rel of layouts) {
      const content = fs.readFileSync(path.join(ROOT_DIR, rel), "utf-8");
      expect(content.includes("AppShell"), `${rel} must mount AppShell`).toBe(true);
    }

    const appShellContent = fs.readFileSync(
      path.join(COMPONENTS_DIR, "ui/app-shell.tsx"),
      "utf-8",
    );
    expect(
      appShellContent.includes("TextSizeControl"),
      "AppShell must mount TextSizeControl",
    ).toBe(true);
  });

  it("globals.css font-size tokens are rem-based", () => {
    const css = fs.readFileSync(path.join(APP_DIR, "globals.css"), "utf-8");
    // Verify typography scale tokens use rem
    expect(css).toMatch(/--text-body:\s*1rem;/);
    expect(css).toMatch(/--text-label:\s*0\.875rem;/);
    expect(css).toMatch(/--text-heading:\s*1\.25rem;/);
    expect(css).toMatch(/--text-display:\s*1\.75rem;/);

    // Assert no arbitrary text-[Npx] in app or components
    const tsxFiles = findTsxFiles(APP_DIR).concat(findTsxFiles(COMPONENTS_DIR));
    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      const match = content.match(/text-\[\d+px\]/);
      expect(match, `File ${path.relative(ROOT_DIR, file)} has arbitrary pixel font-size ${match?.[0]}`).toBeNull();
    }
  });

  it("globals.css contains :focus-visible with at least 2px outline", () => {
    const css = fs.readFileSync(path.join(APP_DIR, "globals.css"), "utf-8");
    expect(css.includes(":focus-visible"), "globals.css must define :focus-visible").toBe(true);
    expect(css).toMatch(/outline:\s*([2-9]|\d{2,})px/);
  });

  it("interactive elements do not use fixed heights below 44px", () => {
    const tsxFiles = findTsxFiles(APP_DIR).concat(findTsxFiles(COMPONENTS_DIR));
    const smallHeightRegex = /<(button|a|Link|select|input)\b[^>]*(className=["'][^"']*\b(h-6|h-7|h-8|h-9|h-10)\b[^"']*["'])[^>]*>/g;

    const violations: string[] = [];
    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf-8");
      let match;
      while ((match = smallHeightRegex.exec(content)) !== null) {
        // Check if allow-listed (e.g. sr-only hidden input)
        const elementMarkup = match[0];
        if (elementMarkup.includes("sr-only") || elementMarkup.includes("type=\"checkbox\"") || elementMarkup.includes("type=\"radio\"")) {
          // Native hidden input wrapped by label
          continue;
        }
        violations.push(`${path.relative(ROOT_DIR, file)}: ${match[0]}`);
      }
    }

    expect(violations, `Found interactive elements with height under 44px: \n${violations.join("\n")}`).toEqual([]);
  });
});
