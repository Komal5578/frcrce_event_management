"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeFor, useMe } from "@/lib/session";

export default function Index() {
  const router = useRouter();
  const { me, signedOut } = useMe();
  useEffect(() => {
    if (signedOut) router.replace("/login");
    else if (me) router.replace(homeFor(me.role));
  }, [me, signedOut, router]);
  return <div role="status" className="grid min-h-dvh place-items-center text-muted">Loading…</div>;
}
