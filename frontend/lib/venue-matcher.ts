/**
 * Venue Matcher for Crescendo Campus Map
 * 
 * Matches free-text event venues and titles against the 10-level reported building plan.
 * Matches using:
 * 1. Floor words ("4th Floor", "9th floor", etc.)
 * 2. Room numbers via unverified numbering hint (108 -> 1st floor, 6xx -> 6th floor, 8xx -> 8th floor)
 * 3. Specific keywords: Samvaad, Library, Chemistry Lab, Exam Cell, Office, Cafeteria, Canteen, GCR, Arena
 * 
 * Events with "TBA" go into "Venue not announced yet".
 * Events with venues outside the reported 10-level building guide (e.g. Auditorium, Seminar Halls, OAT, Sports Ground, Lab 3)
 * go into "Location not in floor guide yet". Do not guess a floor.
 */

import { floorEntities, campusFloors, type FloorEntity } from "./campus-map-data";
import { getEventLink } from "./eventLinks";
import type { EventItem } from "./types";

export interface MatchedEvent {
  id: string;
  title: string;
  venueName: string;
  venueLocation: string;
  department: string;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number | null;
  confirmed: number;
  seatsLeft: number | null;
  registrationUrl: string | null;
  rawEvent: EventItem;
  day: "29 Oct" | "30 Oct" | "Other";
  timeWindow: "now" | "next_hour" | "later" | "past";
  matchedFloorId?: string;
  matchedEntityId?: string;
  matchedEntityName?: string;
  matchReason?: string;
}

export interface VenueMatchResult {
  matchedEntityMap: Record<string, MatchedEvent[]>; // entityId -> events
  matchedFloorMap: Record<string, MatchedEvent[]>;  // floorId -> events
  unannouncedEvents: MatchedEvent[];                // Room TBA
  notInFloorGuideEvents: MatchedEvent[];            // Seminar halls, OAT, Ground, etc.
  onlineEvents: MatchedEvent[];                     // Online tournaments
  allEvents: MatchedEvent[];
}

export function normalizeVenueText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isTbaVenue(text: string): boolean {
  const norm = normalizeVenueText(text);
  return (
    norm.includes("tba") ||
    norm.includes("room tba") ||
    norm.includes("to be announced") ||
    norm.includes("not announced") ||
    norm.includes("venue tba")
  );
}

export function getFestivalDay(startsAt: string | null): "29 Oct" | "30 Oct" | "Other" {
  if (!startsAt) return "Other";
  const dt = new Date(startsAt);
  if (isNaN(dt.getTime())) return "Other";

  const dateStr = startsAt.slice(0, 10);
  if (dateStr.includes("2026-10-29") || dateStr.includes("10-29")) return "29 Oct";
  if (dateStr.includes("2026-10-30") || dateStr.includes("10-30")) return "30 Oct";

  const d = dt.getDate();
  const m = dt.getMonth();
  if (m === 9 && d === 29) return "29 Oct";
  if (m === 9 && d === 30) return "30 Oct";

  return "Other";
}

export function getTimeWindow(
  startsAt: string | null,
  endsAt: string | null,
  now = new Date("2026-10-29T11:00:00+05:30")
): "now" | "next_hour" | "later" | "past" {
  if (!startsAt) return "later";
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + 3 * 3600 * 1000;
  const current = now.getTime();

  if (isNaN(start)) return "later";

  if (current >= start && current <= end) {
    return "now";
  }
  if (current < start && start - current <= 60 * 60 * 1000) {
    return "next_hour";
  }
  if (current > end) {
    return "past";
  }
  return "later";
}

export function matchEventsToVenues(rawEvents: EventItem[]): VenueMatchResult {
  const matchedEntityMap: Record<string, MatchedEvent[]> = {};
  const matchedFloorMap: Record<string, MatchedEvent[]> = {};
  const unannouncedEvents: MatchedEvent[] = [];
  const notInFloorGuideEvents: MatchedEvent[] = [];
  const onlineEvents: MatchedEvent[] = [];
  const allEvents: MatchedEvent[] = [];

  for (const f of campusFloors) {
    matchedFloorMap[f.id] = [];
  }
  for (const ent of floorEntities) {
    matchedEntityMap[ent.id] = [];
  }

  for (const raw of rawEvents) {
    const venueName = raw.venue_name ?? "";
    const venueLoc = raw.venue_location ?? "";
    const title = raw.title ?? "";
    const normVenue = normalizeVenueText(venueName);
    const normLoc = normalizeVenueText(venueLoc);
    const normTitle = normalizeVenueText(title);

    const regUrl = getEventLink({
      id: raw.id,
      title: raw.title,
      url: (raw as { url?: string }).url,
    });

    const seatsRemaining =
      raw.capacity != null
        ? Math.max(0, raw.capacity - (raw.confirmed ?? 0))
        : null;

    const matchedItem: MatchedEvent = {
      id: raw.id,
      title: raw.title,
      venueName: venueName || "To Be Announced",
      venueLocation: venueLoc || "Fr. CRCE Campus",
      department: raw.department ?? "Students' Council",
      startsAt: raw.starts_at ?? null,
      endsAt: raw.ends_at ?? null,
      capacity: raw.capacity ?? null,
      confirmed: raw.confirmed ?? 0,
      seatsLeft: seatsRemaining,
      registrationUrl: regUrl,
      rawEvent: raw,
      day: getFestivalDay(raw.starts_at ?? null),
      timeWindow: getTimeWindow(raw.starts_at ?? null, raw.ends_at ?? null),
    };

    allEvents.push(matchedItem);

    // 1. Explicitly Online
    if (
      normVenue.includes("online") ||
      normTitle.includes("royal rumble") ||
      normTitle.includes("clash royale")
    ) {
      onlineEvents.push(matchedItem);
      continue;
    }

    // 2. Room TBA
    if (isTbaVenue(normVenue) || isTbaVenue(normLoc)) {
      unannouncedEvents.push(matchedItem);
      continue;
    }

    // 3. Known venues not in the reported 10-level building guide
    // (Seminar Halls, Auditorium, OAT, Sports Ground, Main Gate, Lab 3)
    const isUnmappedCampusLocation =
      normVenue.includes("auditorium") ||
      normVenue.includes("seminar hall") ||
      normVenue.includes("open air") ||
      normVenue.includes("oat") ||
      normVenue.includes("sports ground") ||
      normVenue.includes("football ground") ||
      normVenue.includes("main gate") ||
      (normVenue === "lab 3" || normVenue.includes("lab 3"));

    if (isUnmappedCampusLocation) {
      notInFloorGuideEvents.push(matchedItem);
      continue;
    }

    // 4. Floor words & Keyword Matching
    let matchedEntity: FloorEntity | null = null;
    let matchReason = "";

    // Keyword: Samvaad -> 9th Floor
    if (normVenue.includes("samvaad") || normTitle.includes("samvaad")) {
      matchedEntity = floorEntities.find((e) => e.id === "9f-samvaad") ?? null;
      matchReason = "Matched keyword 'Samvaad' (9th Floor)";
    }
    // Keyword: Library -> 2nd Floor
    else if (normVenue.includes("library")) {
      matchedEntity = floorEntities.find((e) => e.id === "2f-library") ?? null;
      matchReason = "Matched keyword 'Library' (2nd Floor)";
    }
    // Keyword: Chemistry Lab -> 1st Floor
    else if (normVenue.includes("chemistry lab") || normVenue.includes("chem lab")) {
      matchedEntity = floorEntities.find((e) => e.id === "1f-chem-lab") ?? null;
      matchReason = "Matched keyword 'Chemistry Lab' (1st Floor)";
    }
    // Keyword: Office -> 1st Floor
    else if (normVenue.includes("college office") || normVenue === "office") {
      matchedEntity = floorEntities.find((e) => e.id === "1f-office") ?? null;
      matchReason = "Matched keyword 'Office' (1st Floor)";
    }
    // Keyword: Exam Cell -> 1st Floor
    else if (normVenue.includes("exam cell")) {
      matchedEntity = floorEntities.find((e) => e.id === "1f-exam-cell") ?? null;
      matchReason = "Matched keyword 'Exam Cell' (1st Floor)";
    }
    // Keyword: Cafeteria / Canteen -> 1st Floor
    else if (normVenue.includes("cafeteria") || normVenue.includes("canteen")) {
      matchedEntity = floorEntities.find((e) => e.id === "1f-cafeteria") ?? null;
      matchReason = "Matched keyword 'Cafeteria / Canteen' (1st Floor)";
    }
    // Keyword: GCR -> 4th Floor
    else if (normVenue.includes("gcr") || normVenue.includes("girls common room")) {
      matchedEntity = floorEntities.find((e) => e.id === "4f-gcr") ?? null;
      matchReason = "Matched keyword 'GCR' (4th Floor)";
    }
    // Keyword: Arena / 4th Floor / Techनीक
    else if (
      normVenue.includes("4th floor") ||
      normVenue.includes("arena") ||
      normTitle.includes("techनीक") ||
      normTitle.includes("technaka") ||
      normTitle.includes("techneek") ||
      normTitle.includes("asme")
    ) {
      matchedEntity = floorEntities.find((e) => e.id === "4f-arena") ?? null;
      matchReason = "Matched '4th Floor / Arena' (Techनीक by ASME CRCE)";
    }
    // Room number hint: 108 -> 1st Floor
    else if (normVenue.includes("108") || normTitle.includes("108")) {
      matchedEntity = floorEntities.find((e) => e.id === "1f-room-108") ?? null;
      matchReason = "Matched Room 108 via unverified 1xx floor hint";
    }
    // Room number hint: 6xx (e.g. 601-604) -> 6th Floor Labs
    else if (
      normVenue.includes("601") ||
      normVenue.includes("602") ||
      normVenue.includes("603") ||
      normVenue.includes("604") ||
      normVenue.includes("labs 601") ||
      normTitle.includes("escape room")
    ) {
      matchedEntity = floorEntities.find((e) => e.id === "6f-labs-main") ?? null;
      matchReason = "Matched Labs 601–604 via unverified 6xx room number hint";
    }
    // Room number hint: 8xx (e.g. 809-810) -> 8th Floor Classrooms
    else if (
      normVenue.includes("809") ||
      normVenue.includes("810") ||
      normVenue.includes("809-810") ||
      normTitle.includes("world after the fall")
    ) {
      matchedEntity = floorEntities.find((e) => e.id === "8f-classrooms") ?? null;
      matchReason = "Matched Classrooms 809–810 via unverified 8xx room number hint";
    }

    if (matchedEntity) {
      matchedItem.matchedFloorId = matchedEntity.floorId;
      matchedItem.matchedEntityId = matchedEntity.id;
      matchedItem.matchedEntityName = matchedEntity.name;
      matchedItem.matchReason = matchReason;

      matchedEntityMap[matchedEntity.id].push(matchedItem);
      matchedFloorMap[matchedEntity.floorId].push(matchedItem);
    } else {
      // Anything unmatched goes to "Location not in floor guide yet" rather than disappearing
      notInFloorGuideEvents.push(matchedItem);
    }
  }

  return {
    matchedEntityMap,
    matchedFloorMap,
    unannouncedEvents,
    notInFloorGuideEvents,
    onlineEvents,
    allEvents,
  };
}
