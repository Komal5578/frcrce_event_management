import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crescendo Campus Map | FrCRCE Events",
  description: "Interactive campus schematic and event routes for Crescendo at Fr. CRCE Bandra.",
};

export default async function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const cookieStore = await cookies();
  const session = cookieStore.get("session");

  if (!session || !session.value) {
    redirect("/login?next=/map&reason=map");
  }

  return (
    <div className="min-h-screen bg-[#F4EFE3] text-[#1E1A17] flex flex-col">
      {children}
    </div>
  );
}
