/**
 * External Unstop registration links for Crescendo & CRCE events.
 * Maps event IDs, slugs, and normalized titles to their official Unstop listings.
 */

export const EVENT_LINKS_BY_ID: Record<string, string> = {
  // Database UUIDs (e1000000-0000-0000-0000-000000000001 to 016)
  "e1000000-0000-0000-0000-000000000001": "https://unstop.com/competitions/ohm-my-god-ieeexwie-crce-crescendo-fr-crce-students-council-1766636",
  "e1000000-0000-0000-0000-000000000002": "https://unstop.com/competitions/formula-unicorn-2026-e-cell-crce-crescendo-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1766688",
  "e1000000-0000-0000-0000-000000000003": "https://unstop.com/competitions/agnirakshak-autonomous-fire-extinguisher-bot-challenge-crescendo-robix-frcrce-1765973",
  "e1000000-0000-0000-0000-000000000004": "https://unstop.com/hackathons/glitched-crescendo-gda-frcrce-1766721",
  "e1000000-0000-0000-0000-000000000005": "https://unstop.com/hackathons/synergy-2026-crescendo-26-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767480",
  "e1000000-0000-0000-0000-000000000006": "https://unstop.com/hackathons/escape-room-crescendo-codestorm-1766724",
  "e1000000-0000-0000-0000-000000000007": "https://unstop.com/competitions/csi-crce-presents-the-double-cross-crescendo-fr-crce-students-council-1765055",
  "e1000000-0000-0000-0000-000000000008": "https://unstop.com/competitions/hack-into-pcell-v20-crescendo-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1766733",
  "e1000000-0000-0000-0000-000000000009": "https://unstop.com/competitions/robowars-crescendo-2026-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767051",
  "e1000000-0000-0000-0000-000000000010": "https://unstop.com/competitions/technaka-by-asme-crce-crescendo-fr-crce-students-council-1766716",
  "e1000000-0000-0000-0000-000000000011": "https://unstop.com/competitions/aerocraft-design-innovation-challenge-crescendo-fr-crce-students-council-1766715",
  "e1000000-0000-0000-0000-000000000012": "https://unstop.com/competitions/frcrce-shark-tank-2026-crescendo-frcrce-acm-student-chapter-1766671",
  "e1000000-0000-0000-0000-000000000013": "https://unstop.com/events/royal-rumble-crescendo-2026-fr-crce-students-council-1772702",
  "e1000000-0000-0000-0000-000000000014": "https://unstop.com/events/valorant-vendetta-crescendo-2026-fr-crce-students-council-1772694",
  "e1000000-0000-0000-0000-000000000015": "https://unstop.com/events/crce-fc-27-showdown-crescendo-2026-fr-crce-students-council-1772704",
  "e1000000-0000-0000-0000-000000000016": "https://unstop.com/p/the-world-after-the-fall-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767452",

  // Noticeboard fallback / sample IDs
  "fb-1": "https://unstop.com/competitions/ohm-my-god-ieeexwie-crce-crescendo-fr-crce-students-council-1766636",
  "sample-1": "https://unstop.com/competitions/ohm-my-god-ieeexwie-crce-crescendo-fr-crce-students-council-1766636",
  "fb-2": "https://unstop.com/competitions/formula-unicorn-2026-e-cell-crce-crescendo-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1766688",
  "sample-2": "https://unstop.com/competitions/formula-unicorn-2026-e-cell-crce-crescendo-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1766688",
  "fb-3": "https://unstop.com/competitions/agnirakshak-autonomous-fire-extinguisher-bot-challenge-crescendo-robix-frcrce-1765973",
  "fb-4": "https://unstop.com/hackathons/synergy-2026-crescendo-26-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767480",
  "sample-3": "https://unstop.com/hackathons/synergy-2026-crescendo-26-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767480",
  "fb-5": "https://unstop.com/hackathons/escape-room-crescendo-codestorm-1766724",
  "fb-6": "https://unstop.com/competitions/robowars-crescendo-2026-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767051",
  "sample-6": "https://unstop.com/competitions/robowars-crescendo-2026-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767051",
};

export const EVENT_KEYWORDS_MAP: { pattern: RegExp; url: string }[] = [
  { pattern: /ohm\s+my\s+god/i, url: "https://unstop.com/competitions/ohm-my-god-ieeexwie-crce-crescendo-fr-crce-students-council-1766636" },
  { pattern: /formula\s+unicorn/i, url: "https://unstop.com/competitions/formula-unicorn-2026-e-cell-crce-crescendo-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1766688" },
  { pattern: /agnirakshak/i, url: "https://unstop.com/competitions/agnirakshak-autonomous-fire-extinguisher-bot-challenge-crescendo-robix-frcrce-1765973" },
  { pattern: /glitched/i, url: "https://unstop.com/hackathons/glitched-crescendo-gda-frcrce-1766721" },
  { pattern: /synergy/i, url: "https://unstop.com/hackathons/synergy-2026-crescendo-26-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767480" },
  { pattern: /escape\s+room/i, url: "https://unstop.com/hackathons/escape-room-crescendo-codestorm-1766724" },
  { pattern: /double\s+cross/i, url: "https://unstop.com/competitions/csi-crce-presents-the-double-cross-crescendo-fr-crce-students-council-1765055" },
  { pattern: /hack\s+into\s+pcell/i, url: "https://unstop.com/competitions/hack-into-pcell-v20-crescendo-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1766733" },
  { pattern: /robowars/i, url: "https://unstop.com/competitions/robowars-crescendo-2026-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767051" },
  { pattern: /techनीक|technaka|techneek/i, url: "https://unstop.com/competitions/technaka-by-asme-crce-crescendo-fr-crce-students-council-1766716" },
  { pattern: /aerocraft/i, url: "https://unstop.com/competitions/aerocraft-design-innovation-challenge-crescendo-fr-crce-students-council-1766715" },
  { pattern: /shark\s+tank/i, url: "https://unstop.com/competitions/frcrce-shark-tank-2026-crescendo-frcrce-acm-student-chapter-1766671" },
  { pattern: /royal\s+rumble|clash\s+royale/i, url: "https://unstop.com/events/royal-rumble-crescendo-2026-fr-crce-students-council-1772702" },
  { pattern: /valorant\s+vendetta/i, url: "https://unstop.com/events/valorant-vendetta-crescendo-2026-fr-crce-students-council-1772694" },
  { pattern: /fc\s*27/i, url: "https://unstop.com/events/crce-fc-27-showdown-crescendo-2026-fr-crce-students-council-1772704" },
  { pattern: /world\s+after\s+the\s+fall/i, url: "https://unstop.com/p/the-world-after-the-fall-fr-conceicao-rodrigues-college-of-engineering-frcrce-bandra-1767452" },
];

/**
 * Returns the Unstop registration link for an event, or null if none is available yet.
 */
export function getEventLink(event: { id?: string; title?: string; url?: string | null; link?: string | null }): string | null {
  if (event.url && typeof event.url === "string" && event.url.startsWith("http")) {
    return event.url;
  }
  if (event.link && typeof event.link === "string" && event.link.startsWith("http")) {
    return event.link;
  }
  if (event.id && EVENT_LINKS_BY_ID[event.id]) {
    return EVENT_LINKS_BY_ID[event.id];
  }
  if (event.title) {
    for (const entry of EVENT_KEYWORDS_MAP) {
      if (entry.pattern.test(event.title)) {
        return entry.url;
      }
    }
  }
  return null;
}
