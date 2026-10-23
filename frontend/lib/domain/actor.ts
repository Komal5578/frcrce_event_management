import type { Role } from "@/lib/auth";
import { DomainError } from "@/lib/errors";

/** Who is acting. Always built from the session on the server, never from request input. */
export type Actor = { id: string; role: Role };

export function requireActorRole(actor: Actor, ...roles: Role[]) {
  if (!roles.includes(actor.role)) throw new DomainError("NOT_ALLOWED", "You do not have permission to do that.");
}
