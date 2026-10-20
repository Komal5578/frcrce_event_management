// Phase 4 owner of this folder overwrites this stub; layout guard via requireRole must stay.
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth";

export default async function Page() {
  const profile = await requireRole('admin');
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-display font-semibold">Admin home</h1>
      <p className="text-body">{profile.name}</p>
      <Alert variant="info" title="Your admin screens are not built yet">
        Your admin screens arrive in the next build step. Use the menu or sign out to try another role.
      </Alert>
    </div>
  );
}
