import { redirect } from "next/navigation";
import { getCurrentProfile, homeFor, isDemoEnabled } from "@/lib/auth";
import { TextSizeControl } from "@/components/ui/text-size-control";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeFor(profile.role));

  const demoEnabled = isDemoEnabled();

  return (
    <div className="flex min-h-screen flex-col bg-panel">
      {/* Top utility bar */}
      <header className="flex items-center justify-between border-b border-border-card bg-surface px-6 py-4">
        <span className="text-label font-bold tracking-tight text-ink">College Events</span>
        <div className="flex items-center gap-2">
          <TextSizeControl />
          <ThemeToggle />
        </div>
      </header>

      {/* Main centered card */}
      <main id="main" className="flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md rounded-card border border-border-card bg-surface p-6 shadow-sm sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-display font-bold tracking-tight text-ink">Sign in</h1>
            <p className="text-label text-muted">
              Manage and discover college events across campus.
            </p>
          </div>

          <LoginForm demoEnabled={demoEnabled} />

          {demoEnabled && (
            <p className="text-fine text-center text-muted">
              Demo accounts are provided for testing and evaluation.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
