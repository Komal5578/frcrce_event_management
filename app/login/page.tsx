import { redirect } from "next/navigation";
import { getCurrentProfile, homeFor, isDemoEnabled } from "@/lib/auth";
import { TextSizeControl } from "@/components/ui/text-size-control";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(homeFor(profile.role));

  return (
    <div className="mx-auto flex w-full max-w-120 flex-col gap-6 px-4 py-6">
      <div className="flex justify-end">
        <TextSizeControl />
      </div>
      <main id="main" className="flex flex-col gap-6">
        <h1 className="text-display font-semibold">Sign in to College Events</h1>
        <LoginForm demoEnabled={isDemoEnabled()} />
        <p className="text-label text-muted">Demo accounts are for review only.</p>
      </main>
    </div>
  );
}
