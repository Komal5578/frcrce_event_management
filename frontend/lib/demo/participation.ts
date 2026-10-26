// DEMO DATA, NOT REAL
// All student names, roll numbers, and participation entries in this file are purely synthetic demo data.
// No real student names, roll numbers, or emails are ever stored or processed here.

export type Branch = "Computer" | "IT" | "EXTC" | "Mechanical" | "Chemical" | "FE";
export type Year = "FE" | "SE" | "TE" | "BE";
export type ParticipationStatus = "registered" | "participated" | "no-show";

export interface DemoStudent {
  id: string;
  name: string;
  branch: Branch;
  year: Year;
  rollCode: string;
}

export interface ParticipationRecord {
  studentId: string;
  councilId: string;
  eventId: string;
  status: ParticipationStatus;
  markedAt: string | null;
}

export const DEMO_STUDENT_ID = "a2000000-0000-0000-0000-000000000001"; // Matches default demo student Asha Patel

// 120 Obviously Fake Demo Students
const BRANCHES: Branch[] = ["Computer", "IT", "EXTC", "Mechanical", "Chemical", "FE"];
const YEARS: Year[] = ["FE", "SE", "TE", "BE"];

function generateFakeStudents(): DemoStudent[] {
  const students: DemoStudent[] = [
    {
      id: DEMO_STUDENT_ID,
      name: "Asha Patel (Demo Student)",
      branch: "Computer",
      year: "TE",
      rollCode: "DEMO-0001",
    },
  ];

  for (let i = 2; i <= 120; i++) {
    const pad = String(i).padStart(3, "0");
    const codePad = String(i).padStart(4, "0");
    const branch = BRANCHES[(i - 1) % BRANCHES.length];
    const year = YEARS[(i - 1) % YEARS.length];
    students.push({
      id: `stud-${pad}`,
      name: `Demo Student ${pad}`,
      branch,
      year,
      rollCode: `DEMO-${codePad}`,
    });
  }

  return students;
}

export const demoStudents: DemoStudent[] = generateFakeStudents();

export function getStudentById(id: string): DemoStudent | undefined {
  return demoStudents.find((s) => s.id === id);
}

// Initial default participation records matching council totals
function generateInitialParticipation(): ParticipationRecord[] {
  const records: ParticipationRecord[] = [];
  const now = new Date("2026-10-25T14:30:00Z").toISOString();

  // 1. Asha Patel (Demo Student) records across 5 councils:
  // - Student Council / Synergy: registered
  records.push({
    studentId: DEMO_STUDENT_ID,
    councilId: "student-council",
    eventId: "e1000000-0000-0000-0000-000000000005",
    status: "registered",
    markedAt: null,
  });

  // - IEEE CRCE / OHM MY GOD!: participated
  records.push({
    studentId: DEMO_STUDENT_ID,
    councilId: "ieee",
    eventId: "e1000000-0000-0000-0000-000000000001",
    status: "participated",
    markedAt: now,
  });

  // - CSI CRCE / The Double Cross: participated
  records.push({
    studentId: DEMO_STUDENT_ID,
    councilId: "csi",
    eventId: "e1000000-0000-0000-0000-000000000007",
    status: "participated",
    markedAt: now,
  });

  // - CodeStorm / Escape Room: registered
  records.push({
    studentId: DEMO_STUDENT_ID,
    councilId: "codestorm",
    eventId: "e1000000-0000-0000-0000-000000000006",
    status: "registered",
    markedAt: null,
  });

  // - eCell CRCE / Formula Unicorn: no-show
  records.push({
    studentId: DEMO_STUDENT_ID,
    councilId: "ecell",
    eventId: "e1000000-0000-0000-0000-000000000002",
    status: "no-show",
    markedAt: now,
  });

  // Helper to populate council event demo student participation
  // (Numbers agree with council totals: participated is never above registered)
  const addEventRecords = (
    councilId: string,
    eventId: string,
    startIdx: number,
    totalRegistered: number,
    totalParticipated: number
  ) => {
    for (let i = 0; i < totalRegistered; i++) {
      const student = demoStudents[(startIdx + i) % demoStudents.length];
      if (student.id === DEMO_STUDENT_ID) continue; // Asha Patel already handled

      const isParticipated = i < totalParticipated;
      const isNoShow = !isParticipated && i % 4 === 0;
      const status: ParticipationStatus = isParticipated
        ? "participated"
        : isNoShow
        ? "no-show"
        : "registered";

      records.push({
        studentId: student.id,
        councilId,
        eventId,
        status,
        markedAt: isParticipated ? now : null,
      });
    }
  };

  // Student Council / Synergy 2026 (18 students)
  addEventRecords("student-council", "e1000000-0000-0000-0000-000000000005", 2, 18, 14);
  // Student Council / AeroCraft (12 students)
  addEventRecords("student-council", "e1000000-0000-0000-0000-000000000011", 20, 12, 10);
  // Student Council / Royal Rumble (12 students)
  addEventRecords("student-council", "e1000000-0000-0000-0000-000000000013", 32, 12, 10);
  // Student Council / Valorant (15 students)
  addEventRecords("student-council", "e1000000-0000-0000-0000-000000000014", 44, 15, 12);
  // Student Council / FC 27 (12 students)
  addEventRecords("student-council", "e1000000-0000-0000-0000-000000000015", 59, 12, 9);
  // Student Council / CRMD (15 students)
  addEventRecords("student-council", "e1000000-0000-0000-0000-000000000017", 71, 15, 12);

  // IEEE CRCE / OHM MY GOD! (16 students)
  addEventRecords("ieee", "e1000000-0000-0000-0000-000000000001", 10, 16, 13);

  // CSI CRCE / The Double Cross (15 students)
  addEventRecords("csi", "e1000000-0000-0000-0000-000000000007", 25, 15, 12);

  // CodeStorm / Escape Room (17 students)
  addEventRecords("codestorm", "e1000000-0000-0000-0000-000000000006", 40, 17, 14);

  // Rotaract CRCE / Robowars (16 students)
  addEventRecords("rotaract", "e1000000-0000-0000-0000-000000000009", 57, 16, 13);

  // eCell CRCE / Formula Unicorn (16 students)
  addEventRecords("ecell", "e1000000-0000-0000-0000-000000000002", 73, 16, 12);

  // Robix CRCE / Agnirakshak (12 students)
  addEventRecords("robix", "e1000000-0000-0000-0000-000000000003", 89, 12, 10);

  // Project Cell / Hack into PCell (12 students)
  addEventRecords("project-cell", "e1000000-0000-0000-0000-000000000008", 101, 12, 9);

  // ASME CRCE / Techनीक (12 students)
  addEventRecords("asme", "e1000000-0000-0000-0000-000000000010", 6, 12, 10);

  // ACM CRCE / Shark Tank (14 students)
  addEventRecords("acm", "e1000000-0000-0000-0000-000000000012", 18, 14, 11);

  // Game Developers Association / Glitched (12 students)
  addEventRecords("gda", "e1000000-0000-0000-0000-000000000004", 30, 12, 9);

  // GDG CRCE / The World After the Fall (12 students)
  addEventRecords("gdg", "e1000000-0000-0000-0000-000000000016", 42, 12, 10);

  return records;
}

export const INITIAL_PARTICIPATION_RECORDS = generateInitialParticipation();

const STORAGE_KEY = "demo-v2";

/**
 * Reads participation records safely from localStorage
 */
export function getStoredParticipation(): ParticipationRecord[] {
  if (typeof window === "undefined") {
    return INITIAL_PARTICIPATION_RECORDS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PARTICIPATION_RECORDS));
      return INITIAL_PARTICIPATION_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_PARTICIPATION_RECORDS;
  } catch (err) {
    console.error("Failed to read demo-v2 from localStorage:", err);
    return INITIAL_PARTICIPATION_RECORDS;
  }
}

/**
 * Saves participation records safely to localStorage and fires a custom event
 */
export function saveStoredParticipation(records: ParticipationRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent("demo-v2-updated"));
  } catch (err) {
    console.error("Failed to save demo-v2 to localStorage:", err);
  }
}

/**
 * Marks participation for a single student in an event
 */
export function markStudentStatus(
  studentId: string,
  eventId: string,
  status: ParticipationStatus
): ParticipationRecord[] {
  const current = getStoredParticipation();
  const next = current.map((r) => {
    if (r.studentId === studentId && r.eventId === eventId) {
      return {
        ...r,
        status,
        markedAt: status === "participated" ? new Date().toISOString() : r.markedAt,
      };
    }
    return r;
  });
  saveStoredParticipation(next);
  return next;
}

/**
 * Marks all registered students in an event as participated
 */
export function markAllRegisteredAsParticipated(eventId: string): ParticipationRecord[] {
  const current = getStoredParticipation();
  const now = new Date().toISOString();
  const next = current.map((r) => {
    if (r.eventId === eventId && r.status === "registered") {
      return {
        ...r,
        status: "participated" as const,
        markedAt: now,
      };
    }
    return r;
  });
  saveStoredParticipation(next);
  return next;
}

/**
 * Resets demo data back to original default state
 */
export function resetDemoData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PARTICIPATION_RECORDS));
    window.dispatchEvent(new CustomEvent("demo-v2-updated"));
  } catch (err) {
    console.error("Failed to reset demo-v2 in localStorage:", err);
  }
}
