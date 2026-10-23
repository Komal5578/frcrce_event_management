import { getCurrentProfile } from "@/lib/auth";
import { buildReport } from "@/lib/domain/reports";
import { toCsv } from "@/lib/csv";
import { DomainError } from "@/lib/errors";

export async function GET(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return new Response("Not allowed", {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const url = new URL(req.url);
    const rawFilters = Object.fromEntries(url.searchParams.entries());
    const report = await buildReport(
      { id: profile.id, role: profile.role },
      rawFilters,
      new Date(),
    );
    const csv = toCsv(report.columns, report.rows);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="events-report.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof DomainError) {
      return new Response("Not allowed", {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return new Response("Could not create the report", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
