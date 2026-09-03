import { Problem } from "./types";

// Hand-verified seed bank. Each problem trains exactly one Math Power (skillId)
// and is tagged to Common Core so the Tutor Brief can cite standards.
// Production replaces this with LLM-generated variants where CODE picks the
// numbers and the LLM writes the story (see README → Architecture).

export const PROBLEMS: Problem[] = [
  // ---------- MAKE-10 (Mental Abacus family) ----------
  {
    id: "ab-3",
    concept: "abacus_add",
    skillId: "make10",
    ccss: ["2.OA.B.2", "3.NBT.A.2"],
    technique: "input",
    prompt:
      "8 + 7 = ? Use the 'make-10' trick: give 2 from the 7 to the 8 to make 10, then add what's left.",
    answer: 15,
    difficulty: 1,
  },
  {
    id: "ab-4",
    concept: "abacus_add",
    skillId: "make10",
    ccss: ["2.OA.B.2", "3.NBT.A.2"],
    technique: "input",
    prompt:
      "Sparky found 9 space rocks, then 6 more. 9 + 6 = ? (Make-10: give 1 from the 6 to the 9.)",
    answer: 15,
    difficulty: 1,
    interestTag: "space",
  },

  // ---------- ABACUS VISION ----------
  {
    id: "ab-1",
    concept: "abacus_build_23",
    skillId: "abacus",
    ccss: ["2.NBT.A.1"],
    technique: "abacus",
    prompt:
      "Build the number 23 on the abacus. Each column is a place value: tens on the left, ones on the right. Big top bead = 5, each bottom bead = 1.",
    answer: 23,
    difficulty: 1,
    interestTag: "space",
    abacus: { target: 23 },
  },
  {
    id: "ab-2",
    concept: "abacus_build_47",
    skillId: "abacus",
    ccss: ["2.NBT.A.1", "3.NBT.A.1"],
    technique: "abacus",
    prompt:
      "Build 47 on the abacus. Tip: use the top 5-bead in the ones column so you don't have to slide 7 little beads.",
    answer: 47,
    difficulty: 2,
    interestTag: "animals",
    abacus: { target: 47 },
  },

  // ---------- FAIR SHARE (division) ----------
  {
    id: "wp-1",
    concept: "division_word",
    skillId: "fairshare",
    ccss: ["3.OA.A.2", "3.OA.C.7"],
    technique: "input",
    prompt:
      "Sparky needs 24 space rocks. Each asteroid holds 6 rocks. How many asteroids does he need to visit? (24 ÷ 6)",
    answer: 4,
    difficulty: 3,
    interestTag: "space",
  },
  {
    id: "wp-2",
    concept: "division_word",
    skillId: "fairshare",
    ccss: ["3.OA.A.2", "3.OA.C.7"],
    technique: "input",
    prompt:
      "A coach shares 72 basketballs equally into 8 hoops. How many balls end up in each hoop? (72 ÷ 8)",
    answer: 9,
    difficulty: 3,
    interestTag: "sports",
  },
  {
    id: "wp-7",
    concept: "division_word",
    skillId: "fairshare",
    ccss: ["3.OA.A.2", "4.NBT.B.6"],
    technique: "input",
    prompt:
      "144 stars are grouped into 12 galaxies, evenly. How many stars per galaxy? (Hint: 12 × 10 = 120 is a good anchor.)",
    answer: 12,
    difficulty: 3,
    interestTag: "space",
  },

  // ---------- BREAK-APART (multiplication) ----------
  {
    id: "wp-4",
    concept: "multiplication_word",
    skillId: "breakapart",
    ccss: ["3.OA.B.5", "3.OA.C.7"],
    technique: "input",
    prompt:
      "A rocket uses 12 gallons of fuel per launch. How many gallons for 7 launches? (Try the break-apart trick: 7 = 5 + 2.)",
    answer: 84,
    difficulty: 3,
    interestTag: "space",
  },

  // ---------- TWO-STEP ----------
  {
    id: "wp-3",
    concept: "multistep_word",
    skillId: "twostep",
    ccss: ["3.OA.D.8"],
    technique: "input",
    prompt:
      "Sparky owns 3 tanks with 15 fish each. He gives 5 fish to a friend. How many fish does he have left? (Multiply first, then subtract.)",
    answer: 40,
    difficulty: 4,
    interestTag: "animals",
  },

  // ---------- ROUND & ADJUST ----------
  {
    id: "wp-5",
    concept: "subtraction_word",
    skillId: "roundadjust",
    ccss: ["3.NBT.A.2"],
    technique: "input",
    prompt:
      "Sparky had 156 acorns and ate 89. How many are left? (Try 'round to 90 then adjust'.)",
    answer: 67,
    difficulty: 3,
    interestTag: "animals",
  },

  // ---------- PARTIAL SUMS ----------
  {
    id: "wp-6",
    concept: "addition_word",
    skillId: "partialsums",
    ccss: ["3.NBT.A.2"],
    technique: "input",
    prompt:
      "A stadium has 245 fans on the left side and 378 on the right. How many total? (Try adding the hundreds first, then the rest.)",
    answer: 623,
    difficulty: 3,
    interestTag: "sports",
  },

  // ---------- ×11 TRICK (Vedic) ----------
  {
    id: "ve-1",
    concept: "mult_x11",
    skillId: "x11",
    ccss: ["4.NBT.B.5"],
    technique: "vedic",
    prompt:
      "23 × 11 the fast way. Split the digits (2 _ 3), add them (2+3), drop the sum in the middle. Try it!",
    answer: 253,
    difficulty: 3,
    interestTag: "sports",
    vedic: { kind: "x11", a: 23, b: 11 },
  },
  {
    id: "ve-2",
    concept: "mult_x11",
    skillId: "x11",
    ccss: ["4.NBT.B.5"],
    technique: "vedic",
    prompt:
      "36 × 11 using the ×11 trick. Split 3 and 6, add them, drop the sum between.",
    answer: 396,
    difficulty: 3,
    interestTag: "space",
    vedic: { kind: "x11", a: 36, b: 11 },
  },

  // ---------- LATTICE ----------
  {
    id: "la-1",
    concept: "mult_2x2",
    skillId: "lattice",
    ccss: ["4.NBT.B.5"],
    technique: "lattice",
    prompt:
      "34 × 27 using the lattice (box) method. Split each number into tens + ones, multiply each cell, then add all four cells together.",
    answer: 918,
    difficulty: 4,
    interestTag: "space",
    lattice: { a: 34, b: 27 },
  },
  {
    id: "la-2",
    concept: "mult_2x2",
    skillId: "lattice",
    ccss: ["4.NBT.B.5"],
    technique: "lattice",
    prompt:
      "45 × 23 with the lattice. 45 = 40 + 5. 23 = 20 + 3. Fill the 4 cells, then add.",
    answer: 1035,
    difficulty: 4,
    interestTag: "animals",
    lattice: { a: 45, b: 23 },
  },

  // ---------- NEAR-100 (Vedic) ----------
  {
    id: "ve-3",
    concept: "base10_complement",
    skillId: "near100",
    ccss: ["4.NBT.B.5", "5.NBT.B.5"],
    technique: "vedic",
    prompt:
      "97 × 98 = ? Both numbers are close to 100. Find each 'deficit' (100 − number), cross-subtract, and multiply the deficits.",
    answer: 9506,
    difficulty: 4,
    vedic: { kind: "base10_complement", a: 97, b: 98 },
  },
];

// The DEMO SCRIPT. Ordered so a 90-second video hits: two Make-10 solves →
// first mastery badge + pet evolves → a wrong division answer → scaffold
// ladder → second Fair-Share solve → mastery → Vedic → Lattice.
export const DEMO_ORDER = [
  "ab-3", // make10 — correct
  "ab-4", // make10 — correct → MASTERED → evolve to Sprite
  "wp-1", // fairshare — get it WRONG on purpose → scaffold
  "wp-2", // fairshare — correct
  "ab-1", // abacus
  "ve-1", // x11
  "la-1", // lattice
  "wp-4", // breakapart
  "ve-3", // near100
];

export function getProblemById(id: string) {
  return PROBLEMS.find((p) => p.id === id);
}
