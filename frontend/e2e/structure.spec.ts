import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./auth";

// power-design web rules #2 (no h-scroll at 320/390), #4 (44px targets), #18 (landmarks, one h1, no skipped levels), WCAG 2.4.2 (page titles).
const routes: Record<"Student" | "Coordinator" | "Admin", string[]> = {
  Student: ["/student", "/student/events/e0000000-0000-0000-0000-000000000005", "/student/my", "/student/tasks", "/student/notifications"],
  Coordinator: ["/coordinator", "/coordinator/new", "/coordinator/events/e0000000-0000-0000-0000-000000000004", "/coordinator/calendar", "/coordinator/tasks", "/coordinator/notifications"],
  Admin: ["/admin", "/admin/approvals", "/admin/approvals/e0000000-0000-0000-0000-000000000002", "/admin/calendar", "/admin/catalog", "/admin/reports", "/admin/notifications"],
};

async function audit(page: Page) {
  await page.locator("h1").first().waitFor();
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const out: string[] = [];
    const h = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((e) => +e.tagName[1]);
    if (h.filter((n) => n === 1).length !== 1) out.push(`h1 count ${h.filter((n) => n === 1).length}`);
    h.forEach((n, i) => { if (i && n - h[i - 1] > 1) out.push(`heading jump h${h[i - 1]}→h${n}`); });
    if (!document.querySelector("main")) out.push("no <main>");
    if (document.title === "CampusEvent") out.push("generic page title");
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`horizontal scroll ${document.documentElement.scrollWidth}>${window.innerWidth}`);
    const r0 = (e: Element) => e.getBoundingClientRect().height;
    const vis = (e: Element) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    document.querySelectorAll<HTMLElement>("button, a[href], input:not([type=hidden]), select, textarea").forEach((e) => {
      if (!vis(e) || e.closest(".sr-only") || e.classList.contains("sr-only") || e.closest("nextjs-portal")) return;
      if (e.hasAttribute("data-dense") && r0(e) >= 24) return; // dense calendar chip: 24px+ for mouse, 44px on coarse pointers (CSS)
      if (e.hasAttribute("data-inline")) return; // inline text link inside a sentence (WCAG 2.5.8 exemption)
      const r = e.getBoundingClientRect();
      if (r.height < 43.5 || r.width < 43.5) out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 30)}"`);
    });
    return out;
  });
}

for (const role of ["Student", "Coordinator", "Admin"] as const) {
  const paths = routes[role];
  for (const vp of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`${role} screens: structure + targets @${vp.width}`, async ({ page }) => {
      await page.setViewportSize(vp);
      await signIn(page, role);
      const problems: string[] = [];
      for (const p of paths) {
        await page.goto(p);
        (await audit(page)).forEach((m) => problems.push(`${p}: ${m}`));
      }
      expect(problems).toEqual([]);
    });
  }
}

// The public sign-in screen gets the same checks (it is the first thing every role sees).
for (const vp of [{ width: 320, height: 700 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`Sign in: structure + targets @${vp.width}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto("/login");
    expect(await audit(page)).toEqual([]);
  });
}
