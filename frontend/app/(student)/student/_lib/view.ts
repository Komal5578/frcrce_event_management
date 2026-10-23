import type { StatusKey } from "@/components/ui/status-badge";
import type { EventView } from "@/lib/domain/views";

export type Cta = "register" | "waitlist" | "none";
export type CardModel = {
  status: StatusKey;
  seatsText: string;
  cta: Cta;
  mine: { key: "registered" | "waitlisted"; text: string } | null;
};

const left = (e: EventView) => Math.max(0, (e.capacity ?? 0) - e.confirmed);
const isFull = (e: EventView) => e.status === "open" && e.confirmed >= (e.capacity ?? 0);

export function cardModel(e: EventView): CardModel {
  const n = left(e);
  const mine: CardModel["mine"] =
    e.my_reg === "confirmed" ? { key: "registered", text: "Registered" }
    : e.my_reg === "waitlisted" ? { key: "waitlisted", text: e.my_waitlist_pos ? `Waitlisted, number ${e.my_waitlist_pos}` : "Waitlisted" }
    : null;
  // X5: a registered or waitlisted student is never offered Register.
  const cta: Cta = mine || e.status !== "open" ? "none" : isFull(e) ? "waitlist" : "register";
  return {
    status: (isFull(e) ? "full" : e.status) as StatusKey,
    seatsText: n === 0 ? "0 seats left, waitlist open" : `${n} ${n === 1 ? "seat" : "seats"} left`,
    cta,
    mine,
  };
}

export function detailModel(e: EventView) {
  const m = cardModel(e);
  const seatsDetail = `${left(e)} of ${e.capacity ?? 0} seats left`;
  const waitlistNote = e.my_reg === "waitlisted" && e.my_waitlist_pos ? `You are number ${e.my_waitlist_pos} on the waitlist`
    : m.cta === "waitlist" ? `You would be number ${e.waitlisted + 1} on the waitlist` : null;
  return { ...m, seatsDetail, waitlistNote };
}
