import { redirect } from "next/navigation";
import { getCurrentProfile, homeFor } from "@/lib/auth";

export default async function Home() {
  const profile = await getCurrentProfile();
  redirect(profile ? homeFor(profile.role) : "/login");
}
