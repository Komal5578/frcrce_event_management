import { expect, it } from "vitest";
import { cardModel, detailModel } from "@/app/(student)/student/_lib/view";
import type { EventView } from "@/lib/domain/views";

const ev = (o: Partial<EventView> = {}) => ({
  id: "e", title: "T", status: "open", capacity: 40, confirmed: 18, waitlisted: 3, my_reg: null, my_waitlist_pos: null, ...o,
}) as EventView;

it("open with seats: register", () => {
  const m = cardModel(ev());
  expect(m).toMatchObject({ seatsText: "22 seats left", status: "open", cta: "register", mine: null });
});
it("full: waitlist cta, full badge", () => {
  const m = cardModel(ev({ confirmed: 40 }));
  expect(m).toMatchObject({ seatsText: "0 seats left, waitlist open", status: "full", cta: "waitlist" });
});
it("registered never gets register (X5), even with seats", () => {
  const m = cardModel(ev({ my_reg: "confirmed" }));
  expect(m.cta).toBe("none");
  expect(m.mine?.key).toBe("registered");
});
it("waitlisted shows its number", () => {
  const m = cardModel(ev({ confirmed: 40, my_reg: "waitlisted", my_waitlist_pos: 4 }));
  expect(m.cta).toBe("none");
  expect(m.mine).toEqual({ key: "waitlisted", text: "Waitlisted, number 4" });
});
it("cancelled and not-open events offer nothing", () => {
  expect(cardModel(ev({ status: "cancelled" }))).toMatchObject({ cta: "none", status: "cancelled" });
  expect(cardModel(ev({ status: "ongoing" })).cta).toBe("none");
});
it("a cancelled registration may register again", () => {
  expect(cardModel(ev({ my_reg: "cancelled" })).cta).toBe("register");
});
it("detail text", () => {
  expect(detailModel(ev()).seatsDetail).toBe("22 of 40 seats left");
  expect(detailModel(ev({ confirmed: 40 })).waitlistNote).toBe("You would be number 4 on the waitlist");
  expect(detailModel(ev({ confirmed: 40, my_reg: "waitlisted", my_waitlist_pos: 2 })).waitlistNote).toBe("You are number 2 on the waitlist");
});
