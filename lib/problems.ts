import { Problem } from "./types";

// 15 hand-picked problems tied to the three Eastern techniques.
// The demo cycles through these in order.
export const PROBLEMS: Problem[] = [
  // --- ABACUS (place value + grouping by 5s/10s) ---
  {
    id: "ab-1",
    concept: "abacus_build_23",
    technique: "abacus",
    prompt: "Sparky found 23 space rocks. Build 23 on the abacus by grouping 5s and 1s.",
    answer: 23,
    difficulty: 1,
    interestTag: "space",
    abacus: { target: 23 },
  },
  {
    id: "ab-2",
    concept: "abacus_build_47",
    technique: "abacus",
    prompt: "Feed Sparky 47 berries. Build 47 on the abacus.",
    answer: 47,
    difficulty: 2,
    interestTag: "animals",
    abacus: { target: 47 },
  },
  {
    id: "ab-3",
    concept: "abacus_add",
    technique: "input",
    prompt: "Sparky ate 8 space rocks in the morning and 7 more at night. Group by 5s: how many rocks total?",
    answer: 15,
    difficulty: 2,
  },

  // --- VEDIC (pattern shortcuts) ---
  {
    id: "ve-1",
    concept: "mult_x11",
    technique: "vedic",
    prompt: "Sparky's team scored 23 baskets. Each basket is worth 11 points. Use the ×11 trick.",
    answer: 253,
    difficulty: 3,
    interestTag: "sports",
    vedic: { kind: "x11", a: 23, b: 11 },
  },
  {
    id: "ve-2",
    concept: "mult_x11",
    technique: "vedic",
    prompt: "There are 36 planets, each with 11 moons. How many moons total? (×11 trick!)",
    answer: 396,
    difficulty: 3,
    interestTag: "space",
    vedic: { kind: "x11", a: 36, b: 11 },
  },
  {
    id: "ve-3",
    concept: "base10_complement",
    technique: "vedic",
    prompt: "Use the base-10 trick: 97 × 98 = ?",
    answer: 9506,
    difficulty: 4,
    vedic: { kind: "base10_complement", a: 97, b: 98 },
  },

  // --- LATTICE (2-digit × 2-digit as a grid) ---
  {
    id: "la-1",
    concept: "mult_2x2",
    technique: "lattice",
    prompt: "Sparky delivers 34 boxes of pizza to 27 planets. Solve 34 × 27 with the lattice.",
    answer: 918,
    difficulty: 4,
    interestTag: "space",
    lattice: { a: 34, b: 27 },
  },
  {
    id: "la-2",
    concept: "mult_2x2",
    technique: "lattice",
    prompt: "A zoo has 45 cages with 23 animals each. Solve 45 × 23 with the lattice.",
    answer: 1035,
    difficulty: 4,
    interestTag: "animals",
    lattice: { a: 45, b: 23 },
  },

  // --- WORD PROBLEMS (plain input, but scaffolded when wrong) ---
  {
    id: "wp-1",
    concept: "division_word",
    technique: "input",
    prompt: "Sparky needs 24 space rocks. Each asteroid has 6 rocks. How many asteroids do we need?",
    answer: 4,
    difficulty: 3,
    interestTag: "space",
  },
  {
    id: "wp-2",
    concept: "division_word",
    technique: "input",
    prompt: "72 basketballs are shared into 8 hoops. How many balls per hoop?",
    answer: 9,
    difficulty: 3,
    interestTag: "sports",
  },
  {
    id: "wp-3",
    concept: "multistep_word",
    technique: "input",
    prompt: "Sparky has 3 tanks with 15 fish each. He gives 5 fish to a friend. How many fish left?",
    answer: 40,
    difficulty: 4,
    interestTag: "animals",
  },
  {
    id: "wp-4",
    concept: "multiplication_word",
    technique: "input",
    prompt: "A rocket needs 12 gallons per launch. How much for 7 launches?",
    answer: 84,
    difficulty: 3,
    interestTag: "space",
  },
  {
    id: "wp-5",
    concept: "subtraction_word",
    technique: "input",
    prompt: "Sparky had 156 acorns and ate 89. How many left?",
    answer: 67,
    difficulty: 3,
    interestTag: "animals",
  },
  {
    id: "wp-6",
    concept: "addition_word",
    technique: "input",
    prompt: "A stadium has 245 fans on the left and 378 on the right. How many total?",
    answer: 623,
    difficulty: 3,
    interestTag: "sports",
  },
  {
    id: "wp-7",
    concept: "division_word",
    technique: "input",
    prompt: "144 stars are grouped into 12 galaxies. Stars per galaxy?",
    answer: 12,
    difficulty: 3,
    interestTag: "space",
  },
];

// The DEMO SCRIPT cherry-picks problems to guarantee the video hits all three
// techniques + a scaffolded moment. Change the order here to re-script the video.
export const DEMO_ORDER = ["ab-1", "ve-1", "wp-1", "la-1", "ve-3"];

export function getProblemById(id: string) {
  return PROBLEMS.find((p) => p.id === id);
}
