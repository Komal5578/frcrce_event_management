// DEMO AND REAL COUNCIL DATA
// Council head details are real for verified people.
// Student participation numbers are demo data stored in localStorage.
// DO NOT STORE emails, phone numbers, or roll numbers for council heads.

export interface CouncilHead {
  name: string;
  role: string; // Kept in one editable field for easy title adjustments
  photo?: string;
  verified: boolean;
}

export interface CrescendoEventRef {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  mapFloorId?: string;
  mapEntityId?: string;
}

export interface Council {
  id: string;
  slug: string;
  name: string;
  category: "Student Council" | "Professional society" | "Technical club" | "Student forum" | "Technical team";
  description: string;
  coreMembersCount: number;
  head: CouncilHead;
  applied: number;
  registered: number;
  participated: number;
  events: CrescendoEventRef[];
}

export const COUNCILS_DATA: Council[] = [
  // 1. Overall Student Council & Sub-councils
  {
    id: "student-council",
    slug: "student-council",
    name: "Student Council",
    category: "Student Council",
    description: "The apex student governing body at Fr. CRCE overseeing cultural, sports, technical, and literary affairs across all departments.",
    coreMembersCount: 28,
    head: {
      name: "Vedant Khanolkar",
      role: "Student Council Head",
      verified: true,
    },
    applied: 240,
    registered: 180,
    participated: 156,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000005",
        title: "Crescendo: Synergy 2026",
        date: "Sun, 1 Nov 2026",
        time: "9:00 AM – 8:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-ground",
        mapEntityId: "auditorium",
      },
      {
        id: "e1000000-0000-0000-0000-000000000011",
        title: "Crescendo: AeroCraft - Design & Innovation Challenge",
        date: "Fri, 30 Oct 2026",
        time: "10:00 AM – 4:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-seminar",
        mapEntityId: "sem-a",
      },
      {
        id: "e1000000-0000-0000-0000-000000000013",
        title: "Crescendo: Royal Rumble (Clash Royale)",
        date: "Thu, 29 Oct 2026",
        time: "10:00 AM – 5:00 PM",
        venue: "Online (Clash Royale)",
      },
      {
        id: "e1000000-0000-0000-0000-000000000014",
        title: "Crescendo: Valorant Vendetta",
        date: "Fri, 30 Oct 2026",
        time: "10:00 AM – 6:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-labs-6",
        mapEntityId: "lab-601",
      },
      {
        id: "e1000000-0000-0000-0000-000000000015",
        title: "Crescendo: CRCE FC 27 Showdown",
        date: "Sat, 31 Oct 2026",
        time: "10:00 AM – 5:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-seminar",
        mapEntityId: "sem-b",
      },
    ],
  },
  {
    id: "sc-technical",
    slug: "sc-technical",
    name: "Student Council (Technical)",
    category: "Student Council",
    description: "Coordinates technical competitions, hardware innovation hackathons, and aerospace engineering challenges during Crescendo.",
    coreMembersCount: 18,
    head: {
      name: "Vedant Khanolkar",
      role: "Student Council Head",
      verified: true,
    },
    applied: 125,
    registered: 95,
    participated: 82,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000005",
        title: "Crescendo: Synergy 2026",
        date: "Sun, 1 Nov 2026",
        time: "9:00 AM – 8:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-ground",
        mapEntityId: "auditorium",
      },
      {
        id: "e1000000-0000-0000-0000-000000000011",
        title: "Crescendo: AeroCraft - Design & Innovation Challenge",
        date: "Fri, 30 Oct 2026",
        time: "10:00 AM – 4:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-seminar",
        mapEntityId: "sem-a",
      },
    ],
  },
  {
    id: "sc-sports",
    slug: "sc-sports",
    name: "Student Council (Sports)",
    category: "Student Council",
    description: "Organises college sports championships and esports tournaments including Clash Royale, Valorant, and FC 27.",
    coreMembersCount: 16,
    head: {
      name: "Vedant Khanolkar",
      role: "Student Council Head",
      verified: true,
    },
    applied: 110,
    registered: 85,
    participated: 74,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000013",
        title: "Crescendo: Royal Rumble (Clash Royale)",
        date: "Thu, 29 Oct 2026",
        time: "10:00 AM – 5:00 PM",
        venue: "Online (Clash Royale)",
      },
      {
        id: "e1000000-0000-0000-0000-000000000014",
        title: "Crescendo: Valorant Vendetta",
        date: "Fri, 30 Oct 2026",
        time: "10:00 AM – 6:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-labs-6",
        mapEntityId: "lab-601",
      },
      {
        id: "e1000000-0000-0000-0000-000000000015",
        title: "Crescendo: CRCE FC 27 Showdown",
        date: "Sat, 31 Oct 2026",
        time: "10:00 AM – 5:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-seminar",
        mapEntityId: "sem-b",
      },
    ],
  },
  {
    id: "sc-literary",
    slug: "sc-literary",
    name: "Student Council (Literary)",
    category: "Student Council",
    description: "Hosts parliamentary and Oxford-style debates, literary symposiums, and the prestigious Conceicao Rodrigues Memorial Debate (CRMD).",
    coreMembersCount: 14,
    head: {
      name: "Vedant Khanolkar",
      role: "Student Council Head",
      verified: true,
    },
    applied: 80,
    registered: 60,
    participated: 54,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000017",
        title: "Conceicao Rodrigues Memorial Debate (CRMD)",
        date: "Fri, 6 Nov 2026",
        time: "10:00 AM – 2:00 PM",
        venue: "Main Auditorium",
        mapFloorId: "fl-ground",
        mapEntityId: "auditorium",
      },
    ],
  },
  {
    id: "sc-cultural",
    slug: "sc-cultural",
    name: "Student Council (Cultural)",
    category: "Student Council",
    description: "Directs music, dance, theatre, and artistic showcases including Euphoria: Battle of Beats and the Crescendo cultural nights.",
    coreMembersCount: 20,
    head: {
      name: "Vedant Khanolkar",
      role: "Student Council Head",
      verified: true,
    },
    applied: 95,
    registered: 70,
    participated: 65,
    events: [],
  },

  // 2. Verified Councils & Leaders
  {
    id: "rotaract",
    slug: "rotaract",
    name: "Rotaract CRCE",
    category: "Student forum",
    description: "Sponsored by the Rotary Club of Bombay Bandra, promoting youth leadership, heavy combat robotics (Robowars), and community welfare drives.",
    coreMembersCount: 24,
    head: {
      name: "Aaron D'Souza",
      role: "Head", // exact title to confirm
      verified: true,
    },
    applied: 98,
    registered: 80,
    participated: 68,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000009",
        title: "Crescendo: Robowars",
        date: "Fri, 30 Oct 2026",
        time: "10:00 AM – 6:00 PM",
        venue: "Campus Arena (Room TBA)",
        mapFloorId: "fl-ground",
        mapEntityId: "open-theatre",
      },
    ],
  },
  {
    id: "csi",
    slug: "csi",
    name: "CSI CRCE",
    category: "Professional society",
    description: "The Computer Society of India student branch at Fr. CRCE, curating technical detective challenges, cryptography heists, and software development competitions.",
    coreMembersCount: 22,
    head: {
      name: "Lehel Dsilva",
      role: "VCP",
      photo: "/images/heads/csi-crce.jpg",
      verified: true,
    },
    applied: 88,
    registered: 60,
    participated: 52,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000007",
        title: "Crescendo: The Double Cross (CSI-CRCE)",
        date: "Thu, 29 Oct 2026",
        time: "10:00 AM – 12:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-labs-6",
        mapEntityId: "lab-602",
      },
    ],
  },
  {
    id: "gdg",
    slug: "gdg",
    name: "GDG CRCE",
    category: "Technical club",
    description: "Google Developer Groups on campus, hosting the flagship Bit-n-Build hackathon, developer workshops, and strategic tech simulations.",
    coreMembersCount: 20,
    head: {
      name: "Shalom Mendes",
      role: "VCP",
      verified: true,
    },
    applied: 70,
    registered: 40,
    participated: 36,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000016",
        title: "The World After the Fall",
        date: "Thu, 29 Oct 2026",
        time: "10:00 AM – 2:00 PM",
        venue: "Classrooms 809-810",
        mapFloorId: "fl-class-8",
        mapEntityId: "cr-809",
      },
    ],
  },
  {
    id: "codestorm",
    slug: "codestorm",
    name: "CodeStorm",
    category: "Technical club",
    description: "The dedicated coding and competitive programming council, hosting algorithmic escape rooms, vibe-coding rounds, and campus tech hunts.",
    coreMembersCount: 19,
    head: {
      name: "Larissa Dabreo",
      role: "VCP",
      photo: "/images/heads/codestorm.jpg",
      verified: true,
    },
    applied: 104,
    registered: 80,
    participated: 71,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000006",
        title: "Crescendo: Escape Room",
        date: "Fri, 30 Oct 2026",
        time: "9:00 AM – 4:00 PM",
        venue: "Labs 601-604",
        mapFloorId: "fl-labs-6",
        mapEntityId: "lab-601",
      },
    ],
  },
  {
    id: "tedx",
    slug: "tedx",
    name: "TEDxCRCE",
    category: "Student forum",
    description: "The college's independently organized TED event, providing a multidisciplinary platform for ideas worth spreading in tech, society, and innovation.",
    coreMembersCount: 18,
    head: {
      name: "Jeshrun Dethe",
      role: "VCP",
      photo: "/images/heads/tedxcrce.jpg",
      verified: true,
    },
    applied: 130,
    registered: 95,
    participated: 88,
    events: [],
  },
  {
    id: "ieee",
    slug: "ieee",
    name: "IEEE CRCE",
    category: "Professional society",
    description: "The Institute of Electrical and Electronics Engineers student chapter, running the renowned OHM MY GOD! electronics challenge and technical symposia.",
    coreMembersCount: 25,
    head: {
      name: "Arjun Kharche",
      role: "VCP",
      photo: "/images/heads/ieee-crce.jpg",
      verified: true,
    },
    applied: 85,
    registered: 60,
    participated: 54,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000001",
        title: "Crescendo: OHM MY GOD!",
        date: "Fri, 30 Oct 2026",
        time: "10:00 AM – 4:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-seminar",
        mapEntityId: "sem-a",
      },
    ],
  },
  {
    id: "robix",
    slug: "robix",
    name: "Robix CRCE",
    category: "Technical team",
    description: "Specialized robotics council engineering autonomous fire-fighting machines, sensor circuits, and path-finding rovers.",
    coreMembersCount: 15,
    head: {
      name: "Amon D'Souza",
      role: "VCP",
      verified: true,
    },
    applied: 62,
    registered: 48,
    participated: 41,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000003",
        title: "Crescendo: Agnirakshak - Autonomous Fire Fighting Bot Challenge",
        date: "Thu, 29 Oct 2026",
        time: "10:45 AM – 3:45 PM",
        venue: "Campus Arena (Room TBA)",
        mapFloorId: "fl-ground",
        mapEntityId: "open-theatre",
      },
    ],
  },

  // 3. Unverified Demo Councils (clearly suffixed with '(demo)' and verified: false)
  {
    id: "project-cell",
    slug: "project-cell",
    name: "Project Cell",
    category: "Technical team",
    description: "Student research and hardware fabrication group behind the ESP32 IoT treasure hunt and SYSTEM//BREAK terminal challenge.",
    coreMembersCount: 14,
    head: {
      name: "Devang Joshi (demo)",
      role: "Council Lead (demo)",
      verified: false,
    },
    applied: 78,
    registered: 60,
    participated: 50,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000008",
        title: "Crescendo: Hack Into PCell v2.0",
        date: "Thu, 29 Oct 2026",
        time: "9:00 AM – 1:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-labs-6",
        mapEntityId: "lab-603",
      },
    ],
  },
  {
    id: "asme",
    slug: "asme",
    name: "ASME CRCE",
    category: "Professional society",
    description: "American Society of Mechanical Engineers chapter, hosting the Techनीक engineering showdown, Marble Run, and bridge stress testing.",
    coreMembersCount: 17,
    head: {
      name: "Manas Sawant (demo)",
      role: "Chairperson (demo)",
      verified: false,
    },
    applied: 82,
    registered: 60,
    participated: 51,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000010",
        title: "Crescendo: Techनीक by ASME CRCE",
        date: "Thu, 29 Oct 2026",
        time: "9:00 AM – 1:00 PM",
        venue: "4th Floor (Techनीक arena)",
        mapFloorId: "fl-seminar",
        mapEntityId: "sem-b",
      },
    ],
  },
  {
    id: "ecell",
    slug: "ecell",
    name: "eCell CRCE",
    category: "Student forum",
    description: "The Entrepreneurship Cell fostering business ventures, angel pitch battles, and the Formula Unicorn corporate auction challenge.",
    coreMembersCount: 20,
    head: {
      name: "Tanvi Kulkarni (demo)",
      role: "Convener (demo)",
      verified: false,
    },
    applied: 115,
    registered: 90,
    participated: 78,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000002",
        title: "Crescendo: Formula Unicorn 2026",
        date: "Thu, 29 Oct 2026",
        time: "10:00 AM – 3:00 PM",
        venue: "Seminar Hall A",
        mapFloorId: "fl-seminar",
        mapEntityId: "sem-a",
      },
    ],
  },
  {
    id: "gda",
    slug: "gda",
    name: "Game Developers Association",
    category: "Technical club",
    description: "Game design, graphics pipeline development, and competitive debugging hackathons.",
    coreMembersCount: 16,
    head: {
      name: "Aditya Rane (demo)",
      role: "President (demo)",
      verified: false,
    },
    applied: 74,
    registered: 60,
    participated: 49,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000004",
        title: "Crescendo: Glitched",
        date: "Thu, 29 Oct 2026",
        time: "10:00 AM – 1:00 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-labs-6",
        mapEntityId: "lab-604",
      },
    ],
  },
  {
    id: "acm",
    slug: "acm",
    name: "ACM CRCE",
    category: "Professional society",
    description: "Association for Computing Machinery student chapter organizing Shark Tank startup presentations and peer code reviews.",
    coreMembersCount: 18,
    head: {
      name: "Siddharth Nair (demo)",
      role: "Chairperson (demo)",
      verified: false,
    },
    applied: 84,
    registered: 68,
    participated: 58,
    events: [
      {
        id: "e1000000-0000-0000-0000-000000000012",
        title: "Crescendo: Fr.CRCE Shark Tank 2026",
        date: "Fri, 30 Oct 2026",
        time: "9:00 AM – 4:30 PM",
        venue: "Fr. CRCE Campus (Room TBA)",
        mapFloorId: "fl-seminar",
        mapEntityId: "sem-a",
      },
    ],
  },
  {
    id: "abadha",
    slug: "abadha",
    name: "Team Abadha CRCE",
    category: "Technical team",
    description: "The SAE E-BAJA collegiate design team developing electric all-terrain vehicles (ATVs).",
    coreMembersCount: 22,
    head: {
      name: "Pranav Mhatre (demo)",
      role: "Team Captain (demo)",
      verified: false,
    },
    applied: 55,
    registered: 40,
    participated: 34,
    events: [],
  },
  {
    id: "robocon",
    slug: "robocon",
    name: "Team Robocon",
    category: "Technical team",
    description: "Fr. CRCE's collegiate robotics team competing at the national ABU Robocon championship.",
    coreMembersCount: 20,
    head: {
      name: "Kunal Jadhav (demo)",
      role: "Team Lead (demo)",
      verified: false,
    },
    applied: 65,
    registered: 45,
    participated: 39,
    events: [],
  },
  {
    id: "iiie",
    slug: "iiie",
    name: "IIIE-XCRCE",
    category: "Professional society",
    description: "Indian Institution of Industrial Engineering student chapter holding production engineering seminars.",
    coreMembersCount: 15,
    head: {
      name: "Nikhil Shinde (demo)",
      role: "President (demo)",
      verified: false,
    },
    applied: 50,
    registered: 35,
    participated: 28,
    events: [],
  },
  {
    id: "nss",
    slug: "nss",
    name: "NSS CRCE",
    category: "Student forum",
    description: "National Service Scheme volunteer chapter organizing Bandra beach cleanups and blood donation drives.",
    coreMembersCount: 30,
    head: {
      name: "Pooja Deshmukh (demo)",
      role: "Program Officer (demo)",
      verified: false,
    },
    applied: 105,
    registered: 80,
    participated: 72,
    events: [],
  },
  {
    id: "hawki",
    slug: "hawki",
    name: "Hawk-I CRCE",
    category: "Technical team",
    description: "Cybersecurity research group hosting the SummerCon CTF and ethical hacking workshops.",
    coreMembersCount: 16,
    head: {
      name: "Omkar Varma (demo)",
      role: "Head (demo)",
      verified: false,
    },
    applied: 68,
    registered: 50,
    participated: 44,
    events: [],
  },
];

export function getCouncils(): Council[] {
  return COUNCILS_DATA;
}

export function getCouncilById(id: string): Council | undefined {
  const norm = id.toLowerCase().trim();
  return COUNCILS_DATA.find(
    (c) =>
      c.id.toLowerCase() === norm ||
      c.slug.toLowerCase() === norm ||
      c.name.toLowerCase() === norm
  );
}

/**
 * Finds matching council for a department or coordinator name string
 */
export function findCouncilForDepartment(departmentOrCoordinator?: string | null): Council | undefined {
  if (!departmentOrCoordinator) return undefined;
  const str = departmentOrCoordinator.toLowerCase().trim();

  // Try exact slug or id match first
  const exact = COUNCILS_DATA.find((c) => c.id.toLowerCase() === str || c.slug.toLowerCase() === str);
  if (exact) return exact;

  // Specific keyword mappings
  if (str.includes("csi")) return getCouncilById("csi");
  if (str.includes("ieee") || str.includes("wie")) return getCouncilById("ieee");
  if (str.includes("codestorm")) return getCouncilById("codestorm");
  if (str.includes("tedx")) return getCouncilById("tedx");
  if (str.includes("rotaract")) return getCouncilById("rotaract");
  if (str.includes("gdg")) return getCouncilById("gdg");
  if (str.includes("robix")) return getCouncilById("robix");
  if (str.includes("ecell") || str.includes("e-cell")) return getCouncilById("ecell");
  if (str.includes("asme")) return getCouncilById("asme");
  if (str.includes("acm")) return getCouncilById("acm");
  if (str.includes("pcell") || str.includes("project cell")) return getCouncilById("project-cell");
  if (str.includes("game") || str.includes("gda")) return getCouncilById("gda");
  if (str.includes("abadha")) return getCouncilById("abadha");
  if (str.includes("robocon")) return getCouncilById("robocon");
  if (str.includes("iiie")) return getCouncilById("iiie");
  if (str.includes("nss")) return getCouncilById("nss");
  if (str.includes("hawk")) return getCouncilById("hawki");
  if (str.includes("technical")) return getCouncilById("sc-technical");
  if (str.includes("sports")) return getCouncilById("sc-sports");
  if (str.includes("literary")) return getCouncilById("sc-literary");
  if (str.includes("cultural")) return getCouncilById("sc-cultural");
  if (str.includes("student council") || str.includes("students' council") || str.includes("stuco")) {
    return getCouncilById("student-council");
  }

  // Name inclusion
  return COUNCILS_DATA.find((c) => c.name.toLowerCase().includes(str) || str.includes(c.name.toLowerCase()));
}
