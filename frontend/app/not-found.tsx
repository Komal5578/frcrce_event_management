import Link from "next/link";
import { getCurrentProfile, homeFor } from "@/lib/auth";

export default async function NotFound() {
  let homeLink = "/login";
  let homeLabel = "Go to sign in";

  try {
    const profile = await getCurrentProfile();
    if (profile) {
      homeLink = homeFor(profile.role);
      homeLabel = "Go to my home";
    }
  } catch {
    // Fall back to login link if DB or session read fails
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-4">
        <h1 className="text-h1 font-bold text-ink">We can&apos;t find that page</h1>
        <p className="text-body text-muted">
          It may have moved, or you may not have access to it.
        </p>
        <Link
          href={homeLink}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-accent bg-accent px-4 py-2 text-label font-semibold text-white transition-colors duration-150 mt-2"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
