import { Problem } from "./types";

// 15 hand-picked problems tied to the three Eastern techniques.
// The demo cycles through these in order.
export const PROBLEMS: Problem[] = [
  // --- ABACUS (place value + grouping by 5s/10s) ---
  {
    id: "ab-1",
    concept: "abacus_build_23",
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
    technique: "abacus",
    prompt:
      "Build 47 on the abacus. Tip: use the top 5-bead in the ones column so you don't have to slide 7 little beads.",
    answer: 47,
    difficulty: 2,
    interestTag: "animals",
    abacus: { target: 47 },
  },
  {
    id: "ab-3",
    concept: "abacus_add",
    technique: "input",
    prompt:
      "8 + 7 = ? Use the 'make-10' trick: give 2 from the 7 to the 8 to make 10, then add what's left.",
    answer: 15,
    difficulty: 2,
  },

  // --- VEDIC (pattern shortcuts) ---
  {
    id: "ve-1",
    concept: "mult_x11",
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
    technique: "vedic",
    prompt:
      "36 × 11 using the ×11 trick. Split 3 and 6, add them, drop the sum between.",
    answer: 396,
    difficulty: 3,
    interestTag: "space",
    vedic: { kind: "x11", a: 36, b: 11 },
  },
  {
    id: "ve-3",
    concept: "base10_complement",
    technique: "vedic",
    prompt:
      "97 × 98 = ? Both numbers are close to 100. Find each 'deficit' (100 − number), cross-subtract, and multiply the deficits.",
    answer: 9506,
    difficulty: 4,
    vedic: { kind: "base10_complement", a: 97, b: 98 },
  },

  // --- LATTICE (2-digit × 2-digit as a grid) ---
  {
    id: "la-1",
    concept: "mult_2x2",
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
    technique: "lattice",
    prompt:
      "45 × 23 with the lattice. 45 = 40 + 5. 23 = 20 + 3. Fill the 4 cells, then add.",
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
    prompt:
      "Sparky needs 24 space rocks. Each asteroid holds 6 rocks. How many asteroids does he need to visit? (24 ÷ 6)",
    answer: 4,
    difficulty: 3,
    interestTag: "space",
  },
  {
    id: "wp-2",
    concept: "division_word",
    technique: "input",
    prompt:
      "A coach shares 72 basketballs equally into 8 hoops. How many balls end up in each hoop? (72 ÷ 8)",
    answer: 9,
    difficulty: 3,
    interestTag: "sports",
  },
  {
    id: "wp-3",
    concept: "multistep_word",
    technique: "input",
    prompt:
      "Sparky owns 3 tanks with 15 fish each. He gives 5 fish to a friend. How many fish does he have left? (Multiply first, then subtract.)",
    answer: 40,
    difficulty: 4,
    interestTag: "animals",
  },
  {
    id: "wp-4",
    concept: "multiplication_word",
    technique: "input",
    prompt:
      "A rocket uses 12 gallons of fuel per launch. How many gallons for 7 launches? (Try the break-apart trick: 7 = 5 + 2.)",
    answer: 84,
    difficulty: 3,
    interestTag: "space",
  },
  {
    id: "wp-5",
    concept: "subtraction_word",
    technique: "input",
    prompt:
      "Sparky had 156 acorns and ate 89. How many are left? (Try 'round to 90 then adjust'.)",
    answer: 67,
    difficulty: 3,
    interestTag: "animals",
  },
  {
    id: "wp-6",
    concept: "addition_word",
    technique: "input",
    prompt:
      "A stadium has 245 fans on the left side and 378 on the right. How many total? (Try adding the hundreds first, then the rest.)",
    answer: 623,
    difficulty: 3,
    interestTag: "sports",
  },
  {
    id: "wp-7",
    concept: "division_word",
    technique: "input",
    prompt:
      "144 stars are grouped into 12 galaxies, evenly. How many stars per galaxy? (Hint: 12 × 10 = 120 is a good anchor.)",
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
