import { Scaffold } from "./types";

// Pre-generated fallbacks per problem id. The demo cannot go down on an API
// call. Each scaffold teaches a STRATEGY on a smaller number, then applies it
// back. Written by (well, with) a middle-school-math-teacher hat on: concrete
// → representational → abstract, using a transferable trick every time.
//
// Content rules — enforced by `npm run eval`:
//   1. Every rung's arithmetic must re-derive its stated answer in code.
//   2. `bridge_back` must NOT restate the original answer as a bare number
//      (the child returns to the original problem and re-types it).
//   3. Reading level: sentence ≤ 22 words, word ≤ 14 chars.

export const SCAFFOLDS: Record<string, Scaffold> = {
  // ---------- ABACUS ----------
  "ab-1": {
    diagnosis: "Remember: each big top bead is worth 5, each bottom bead is worth 1.",
    encouragement: "Let's build the number one place value at a time.",
    scaffold: [
      {
        question: "First, in the ONES column, how many bottom beads (each worth 1) do you slide up to show 3?",
        answer: 3,
        technique_note: "3 ones = 3 bottom beads. No need for the top 5-bead yet.",
      },
      {
        question: "Now the TENS column: each bottom bead there is worth 10. How many bottom beads for 20?",
        answer: 2,
        technique_note: "20 = 2 tens.",
      },
    ],
    bridge_back: "Now stack those two columns together on the abacus. You've got it!",
  },
  "ab-2": {
    diagnosis: "For 47 the trick is to use the 5-bead in the ones column.",
    encouragement: "Big top bead = 5. It saves you from sliding 5 little beads.",
    scaffold: [
      {
        question: "In the ONES: pull down the top 5-bead. How many more 1-beads do you add to reach 7?",
        answer: 2,
        technique_note: "5 + 2 = 7. That's the trick.",
      },
      {
        question: "In the TENS: how many bottom beads (each worth 10) do you need to make 40?",
        answer: 4,
        technique_note: "40 = 4 tens.",
      },
    ],
    bridge_back: "Set the tens and the ones together on the abacus. That's your target!",
  },
  "ab-3": {
    diagnosis: "8 + 7 crosses 10, so let's use the 'make-10' trick.",
    encouragement: "Turn one number into a friendly 10, then add what's left.",
    scaffold: [
      {
        question: "8 wants to become 10. How many more does 8 need?",
        answer: 2,
        technique_note: "8 + 2 = 10. That 2 comes out of the 7.",
      },
      {
        question: "We borrowed 2 from the 7, so 5 is left. What is 10 + 5?",
        answer: 15,
        technique_note: "Once one number is 10, adding is easy.",
      },
    ],
    bridge_back: "That's the make-10 trick. Now go back and answer the original — the number you just found is it.",
  },
  "ab-4": {
    diagnosis: "9 + 6 also crosses 10. Same make-10 trick, one bead more.",
    encouragement: "Give a little from one number to make the other a 10.",
    scaffold: [
      {
        question: "9 wants to be 10. How many more does 9 need?",
        answer: 1,
        technique_note: "Take that 1 out of the 6.",
      },
      {
        question: "6 gave away 1, so 5 is left. What is 10 + 5?",
        answer: 15,
        technique_note: "10 + anything is easy.",
      },
    ],
    bridge_back: "You just used make-10 twice in a row. Type your answer into the original.",
  },

  // ---------- VEDIC ----------
  "ve-1": {
    diagnosis: "The ×11 trick works on any 2-digit number. Let's slow it down.",
    encouragement: "Three steps: split, add, drop.",
    scaffold: [
      {
        question: "Split 23 into its digits: 2 and 3. What is 2 + 3?",
        answer: 5,
        technique_note: "This sum is going to sit in the MIDDLE of the answer.",
      },
      {
        question: "Now 'drop' that sum between the 2 and the 3. What 3-digit number do you get?",
        answer: 253,
        technique_note: "2 _ 3 with 5 in the middle.",
      },
    ],
    bridge_back: "Split, add, drop — that's the whole trick. Now type your answer into the original.",
  },
  "ve-2": {
    diagnosis: "Same ×11 shortcut, bigger digits.",
    encouragement: "You've done this once. Split, add, drop.",
    scaffold: [
      {
        question: "The digits of 36 are 3 and 6. What is 3 + 6?",
        answer: 9,
        technique_note: "That 9 goes in the middle.",
      },
      {
        question: "Drop the 9 between the 3 and 6. What number is that?",
        answer: 396,
        technique_note: "3 _ 6 with 9 in the middle.",
      },
    ],
    bridge_back: "That's ×11 in three moves. Now type your answer into the original.",
  },
  "ve-3": {
    diagnosis: "The 'both close to 100' trick has three quick steps.",
    encouragement: "Find each number's distance from 100, then use them.",
    scaffold: [
      {
        question: "How far is 97 from 100? (100 − 97)",
        answer: 3,
        technique_note: "Call this the 'deficit' for 97.",
      },
      {
        question: "Cross-subtract: 97 minus the OTHER number's deficit (2). 97 − 2 = ?",
        answer: 95,
        technique_note: "This gives the first two digits of your answer.",
      },
    ],
    bridge_back: "You have the front (95). Multiply the two deficits (3 × 2) for the last two digits, then stick them together.",
  },

  // ---------- LATTICE ----------
  "la-1": {
    diagnosis: "Lattice breaks a hard product into 4 easy ones. Fill each cell, then add.",
    encouragement: "Split 34 into 30 + 4. Split 27 into 20 + 7.",
    scaffold: [
      {
        question: "The biggest cell: 30 × 20. (Hint: 3 × 2 = 6, then add both zeros.)",
        answer: 600,
        technique_note: "When multiplying whole tens, count the zeros.",
      },
      {
        question: "The smallest cell: 4 × 7 = ?",
        answer: 28,
        technique_note: "Just a times-table fact.",
      },
    ],
    bridge_back: "The other two cells are 30 × 7 = 210 and 4 × 20 = 80. Add all four cells, then type your answer.",
  },
  "la-2": {
    diagnosis: "Same lattice, different split. 45 = 40 + 5 and 23 = 20 + 3.",
    encouragement: "Four small products, then sum.",
    scaffold: [
      {
        question: "The big corner: 40 × 20 = ? (4 × 2 with two zeros)",
        answer: 800,
        technique_note: "Zeros first, then the digits.",
      },
      {
        question: "The tiny corner: 5 × 3 = ?",
        answer: 15,
        technique_note: "One-digit fact.",
      },
    ],
    bridge_back: "The other cells are 40 × 3 = 120 and 5 × 20 = 100. Add all four cells for your answer.",
  },

  // ---------- WORD PROBLEMS ----------
  "wp-1": {
    diagnosis: "You multiplied — but 'share into groups of 6' means DIVIDE. Sharing splits things apart.",
    encouragement: "Let's build up to it with a smaller number.",
    scaffold: [
      {
        question: "Warm up: how many groups of 6 fit in 12? (Think: 6 + 6 = 12.)",
        answer: 2,
        technique_note: "Division asks 'how many groups fit'.",
      },
      {
        question: "Now double it: how many groups of 6 fit in 24?",
        answer: 4,
        technique_note: "Twice the total means twice the groups.",
      },
    ],
    bridge_back: "You just found how many asteroids Sparky needs. Type it into the original.",
  },
  "wp-2": {
    diagnosis: "Sharing 72 balls into 8 hoops means dividing. Use the times table backwards.",
    encouragement: "Skip-count by 8s until you hit 72.",
    scaffold: [
      {
        question: "Skip-count: 8, 16, 24, 32, 40, 48, 56, 64, 72. How many numbers did you say?",
        answer: 9,
        technique_note: "Each 'skip' is one group of 8.",
      },
      {
        question: "So 8 × ? = 72",
        answer: 9,
        technique_note: "Division is the inverse of multiplication.",
      },
    ],
    bridge_back: "You just found how many balls end up in each hoop. Type it into the original.",
  },
  "wp-3": {
    diagnosis: "This is a TWO-step problem. Do the multiplying first, then the subtracting.",
    encouragement: "Order matters — always groups first, then take away.",
    scaffold: [
      {
        question: "Step 1: 3 tanks with 15 fish each — that's 3 × 15 = ?",
        answer: 45,
        technique_note: "First find the whole amount.",
      },
      {
        question: "Step 2: Now subtract the 5 given away. 45 − 5 = ?",
        answer: 40,
        technique_note: "Take away after you know the total.",
      },
    ],
    bridge_back: "You did it in two clean steps. Type your answer into the original.",
  },
  "wp-4": {
    diagnosis: "12 × 7 is hard to memorize, so break it apart.",
    encouragement: "Split the 7 into 5 + 2. Both are easier.",
    scaffold: [
      {
        question: "First: 12 × 5 = ? (Half of 12 × 10, which is 120.)",
        answer: 60,
        technique_note: "×5 is always half of ×10.",
      },
      {
        question: "Now: 12 × 2 = ?",
        answer: 24,
        technique_note: "Doubling is easy.",
      },
    ],
    bridge_back: "Add your two pieces (60 + 24) and type the total into the original.",
  },
  "wp-5": {
    diagnosis: "156 − 89 is close to 156 − 90, which is much easier. Round then adjust.",
    encouragement: "Round the tricky number, subtract, then fix.",
    scaffold: [
      {
        question: "Round 89 up to 90. Now: 156 − 90 = ?",
        answer: 66,
        technique_note: "Subtracting a round number is fast.",
      },
      {
        question: "You subtracted 1 too many (90 instead of 89). Add 1 back: 66 + 1 = ?",
        answer: 67,
        technique_note: "'Round then adjust' saves brain power.",
      },
    ],
    bridge_back: "That's the round-then-adjust trick. Type your answer into the original.",
  },
  "wp-6": {
    diagnosis: "Big addition? Break each number into hundreds, tens, and ones, then add the parts.",
    encouragement: "This is called 'partial sums' — teachers love it.",
    scaffold: [
      {
        question: "Add just the hundreds: 200 + 300 = ?",
        answer: 500,
        technique_note: "Hundreds first — big pieces.",
      },
      {
        question: "Now the rest: 45 + 78 = ?",
        answer: 123,
        technique_note: "Then the smaller pieces.",
      },
    ],
    bridge_back: "Add your two pieces (500 + 123) and type the total into the original.",
  },
  "wp-7": {
    diagnosis: "For 144 ÷ 12, use what you know about × 12.",
    encouragement: "Start with a friendly ×10, then close the gap.",
    scaffold: [
      {
        question: "12 × 10 = ? (An easy anchor.)",
        answer: 120,
        technique_note: "×10 is just adding a zero.",
      },
      {
        question: "How many more 12s reach 144 from 120? (12 × ? = 24)",
        answer: 2,
        technique_note: "Fill the gap: 144 − 120 = 24, so we need 24 ÷ 12 more.",
      },
    ],
    bridge_back: "Add your two counts (the 10 groups plus what you just found) and type the total into the original.",
  },
};
