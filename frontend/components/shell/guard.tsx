"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { homeFor, useMe } from "@/lib/session";
import type { Role } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

/** One interface per role: wrong role goes home, signed-out goes to sign in. */
export function RoleGuard({ role, children }: { role: Role; children: (name: string) => ReactNode }) {
  const router = useRouter();
  const { me, loading, signedOut } = useMe();
  useEffect(() => {
    if (signedOut) router.replace("/login");
    else if (me && me.role !== role) router.replace(homeFor(me.role));
  }, [me, signedOut, role, router]);
  if (!me || me.role !== role)
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas p-8" role="status" aria-label="Loading">
        <div className="w-full max-w-md space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          {!loading && !signedOut ? null : null}
        </div>
      </div>
    );
  return <>{children(me.name)}</>;
}
