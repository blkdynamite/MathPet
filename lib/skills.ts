// "Math Powers" — the skill map. Each power is a transferable strategy
// (drawn from Mental Abacus, Vedic shortcuts, and Lattice multiplication)
// that the pet "learns" as the child masters it.
//
// Mastery = MASTERY_THRESHOLD clean solves (correct, no scaffold) on that power.
// The demo uses 2 so a 90-second video can show a badge unlock; production
// would use 3–5 with spaced review (see README → Adaptive engine).

export type SkillId =
  | "make10"
  | "abacus"
  | "x11"
  | "near100"
  | "lattice"
  | "fairshare"
  | "breakapart"
  | "twostep"
  | "roundadjust"
  | "partialsums";

export type Skill = {
  id: SkillId;
  name: string;
  emoji: string;
  family: "Mental Abacus" | "Vedic" | "Lattice" | "Number Sense";
  oneLiner: string;      // shown to kids
  ccss: string[];        // Common Core State Standards
  order: number;         // position on the skill map
};

export const MASTERY_THRESHOLD = 2;

export const SKILLS: Skill[] = [
  {
    id: "make10",
    name: "Make-10",
    emoji: "🔟",
    family: "Mental Abacus",
    oneLiner: "Turn one number into a friendly 10, then add the rest.",
    ccss: ["2.OA.B.2", "3.NBT.A.2"],
    order: 1,
  },
  {
    id: "abacus",
    name: "Abacus Vision",
    emoji: "🧮",
    family: "Mental Abacus",
    oneLiner: "See numbers as beads: 5s on top, 1s below, one column per place value.",
    ccss: ["2.NBT.A.1", "3.NBT.A.1"],
    order: 2,
  },
  {
    id: "fairshare",
    name: "Fair Share",
    emoji: "🍕",
    family: "Number Sense",
    oneLiner: "Division asks 'how many groups fit?' Skip-count to find out.",
    ccss: ["3.OA.A.2", "3.OA.A.3", "3.OA.C.7"],
    order: 3,
  },
  {
    id: "breakapart",
    name: "Break-Apart",
    emoji: "🧩",
    family: "Number Sense",
    oneLiner: "Split a hard times fact into two easy ones (7 = 5 + 2).",
    ccss: ["3.OA.B.5", "3.OA.C.7"],
    order: 4,
  },
  {
    id: "twostep",
    name: "Two-Step",
    emoji: "🪜",
    family: "Number Sense",
    oneLiner: "Find the whole amount first, then take away or add.",
    ccss: ["3.OA.D.8"],
    order: 5,
  },
  {
    id: "roundadjust",
    name: "Round & Adjust",
    emoji: "🎯",
    family: "Vedic",
    oneLiner: "Subtract a round number, then fix the difference.",
    ccss: ["3.NBT.A.2", "4.NBT.B.4"],
    order: 6,
  },
  {
    id: "partialsums",
    name: "Partial Sums",
    emoji: "📚",
    family: "Vedic",
    oneLiner: "Add the hundreds, then the tens, then the ones.",
    ccss: ["3.NBT.A.2", "4.NBT.B.4"],
    order: 7,
  },
  {
    id: "x11",
    name: "×11 Trick",
    emoji: "✨",
    family: "Vedic",
    oneLiner: "Split the digits, add them, drop the sum in the middle.",
    ccss: ["4.NBT.B.5"],
    order: 8,
  },
  {
    id: "lattice",
    name: "Lattice Master",
    emoji: "🔲",
    family: "Lattice",
    oneLiner: "Break 2-digit × 2-digit into a 4-cell grid, then add.",
    ccss: ["4.NBT.B.5", "5.NBT.B.5"],
    order: 9,
  },
  {
    id: "near100",
    name: "Near-100 Trick",
    emoji: "💯",
    family: "Vedic",
    oneLiner: "When both numbers are close to 100, use their deficits.",
    ccss: ["4.NBT.B.5", "5.NBT.B.5"],
    order: 10,
  },
];

export function getSkill(id: SkillId) {
  return SKILLS.find((s) => s.id === id)!;
}

export type SkillProgress = Record<SkillId, { cleanSolves: number; attempts: number; scaffolds: number }>;

export function emptyProgress(): SkillProgress {
  return Object.fromEntries(
    SKILLS.map((s) => [s.id, { cleanSolves: 0, attempts: 0, scaffolds: 0 }])
  ) as SkillProgress;
}

export function isMastered(p: SkillProgress, id: SkillId) {
  return (p[id]?.cleanSolves ?? 0) >= MASTERY_THRESHOLD;
}

export function masteredCount(p: SkillProgress) {
  return SKILLS.filter((s) => isMastered(p, s.id)).length;
}

// Pet evolution stages, driven by mastered powers (not XP).
export type PetStage = 0 | 1 | 2 | 3;
export const STAGE_NAMES: Record<PetStage, string> = {
  0: "Hatchling",
  1: "Sprite",
  2: "Wizard",
  3: "Sage",
};
export function stageFor(mastered: number): PetStage {
  if (mastered >= 5) return 3;
  if (mastered >= 3) return 2;
  if (mastered >= 1) return 1;
  return 0;
}
