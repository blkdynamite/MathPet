import { Scaffold } from "./types";

// Pre-generated fallbacks per problem id. The demo cannot go down on an API call.
// Each scaffold teaches a STRATEGY on a smaller number, then applies it to the
// original problem. Written from a middle-school-math-teacher perspective:
// concrete → representational → abstract, using a transferable trick every time.

export const SCAFFOLDS: Record<string, Scaffold> = {
  // ---------- ABACUS ----------
  "ab-1": {
    diagnosis: "Almost! Remember: each big top bead is worth 5, each bottom bead is worth 1.",
    encouragement: "Let's build 23 one place value at a time.",
    scaffold: [
      {
        question: "First, build 3 in the ONES column. How many bottom beads (each worth 1) do you slide up?",
        answer: 3,
        technique_note: "3 ones = 3 bottom beads. No need for the top 5-bead yet.",
      },
      {
        question: "Now the TENS column. Each bottom bead there is worth 10. How many do you need for 20?",
        answer: 2,
        technique_note: "20 = 2 tens.",
      },
    ],
    bridge_back: "Put them together: 2 tens + 3 ones = 23. Now build it on the abacus!",
  },
  "ab-2": {
    diagnosis: "For 47 you need to use the 5-bead trick in the ones column.",
    encouragement: "Big top bead = 5. It saves you from sliding 5 little beads.",
    scaffold: [
      {
        question: "In the ONES: pull down the top 5-bead. How many more 1-beads do you slide up to reach 7?",
        answer: 2,
        technique_note: "5 + 2 = 7. That's the trick.",
      },
      {
        question: "In the TENS: how many bottom beads (each worth 10) do you need for 40?",
        answer: 4,
        technique_note: "40 = 4 tens.",
      },
    ],
    bridge_back: "4 tens + one 5-bead + 2 ones = 47. Build it!",
  },
  "ab-3": {
    diagnosis: "8 + 7 is tricky because it crosses 10. Let's use the 'make-10' trick.",
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
    bridge_back: "That's it — 8 + 7 = 15 using make-10. Try the same trick on any 'crossing 10' sum!",
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
        question: "Now 'drop' that 5 between the 2 and the 3. What 3-digit number do you get?",
        answer: 253,
        technique_note: "2 _ 3 with 5 in the middle = 253.",
      },
    ],
    bridge_back: "That's 23 × 11 = 253. This trick works on any 2-digit × 11 (careful — if the middle sum is 10 or more, you carry the 1 to the front).",
  },
  "ve-2": {
    diagnosis: "Same ×11 shortcut, bigger digits.",
    encouragement: "You've done this once — split, add, drop.",
    scaffold: [
      {
        question: "The digits of 36 are 3 and 6. What is 3 + 6?",
        answer: 9,
        technique_note: "That 9 goes in the middle.",
      },
      {
        question: "Drop the 9 between the 3 and 6. What number is that?",
        answer: 396,
        technique_note: "3 _ 6 with 9 in the middle = 396.",
      },
    ],
    bridge_back: "So 36 × 11 = 396. Fast, right?",
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
        question: "Cross-subtract! 97 minus the OTHER number's deficit (2): 97 − 2 = ?",
        answer: 95,
        technique_note: "This gives the first two digits of your answer.",
      },
    ],
    bridge_back: "Now the last step: multiply the two deficits (3 × 2 = 6). Stick it on the end of 95 → **9506**. That's 97 × 98!",
  },

  // ---------- LATTICE ----------
  "la-1": {
    diagnosis: "Lattice breaks a hard multiplication into 4 easy ones. Fill each cell, then add.",
    encouragement: "Break 34 into 30 and 4. Break 27 into 20 and 7.",
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
    bridge_back: "The other two cells are 30 × 7 = 210 and 4 × 20 = 80. Add all four: 600 + 210 + 80 + 28 = **918**.",
  },
  "la-2": {
    diagnosis: "Same lattice — 45 splits into 40 + 5, and 23 splits into 20 + 3.",
    encouragement: "Four small multiplications, then sum.",
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
    bridge_back: "The other cells: 40 × 3 = 120 and 5 × 20 = 100. Add all four: 800 + 120 + 100 + 15 = **1035**.",
  },

  // ---------- WORD PROBLEMS ----------
  "wp-1": {
    diagnosis: "You multiplied — but 'share into groups of 6' means DIVIDE. Sharing splits things apart.",
    encouragement: "Let's build up to it with a smaller number.",
    scaffold: [
      {
        question: "Warm up: how many groups of 6 fit in 12? (Think: 6 + 6 = 12)",
        answer: 2,
        technique_note: "Division = 'how many groups fit'.",
      },
      {
        question: "Now double it: how many groups of 6 fit in 24? (You just found how many fit in HALF that.)",
        answer: 4,
        technique_note: "Twice the total → twice the groups.",
      },
    ],
    bridge_back: "So 24 ÷ 6 = 4. Sparky needs 4 asteroids!",
  },
  "wp-2": {
    diagnosis: "Sharing 72 balls into 8 hoops means dividing. Use the times table backwards.",
    encouragement: "Skip-count by 8s until you hit 72.",
    scaffold: [
      {
        question: "Skip-count aloud: 8, 16, 24, 32, 40, 48, 56, 64, 72. How many numbers did you say?",
        answer: 9,
        technique_note: "Each 'skip' is one group of 8.",
      },
      {
        question: "So 8 × ? = 72",
        answer: 9,
        technique_note: "Division and multiplication are opposites.",
      },
    ],
    bridge_back: "72 ÷ 8 = 9 balls per hoop.",
  },
  "wp-3": {
    diagnosis: "This is a TWO-step problem. Do the multiplying first, then the subtracting.",
    encouragement: "Order matters — always groups first, then take away.",
    scaffold: [
      {
        question: "Step 1: 3 tanks × 15 fish per tank. How many total?",
        answer: 45,
        technique_note: "First find the whole amount.",
      },
      {
        question: "Step 2: Now subtract the 5 given to the friend. 45 − 5 = ?",
        answer: 40,
        technique_note: "Take away after you know the total.",
      },
    ],
    bridge_back: "That's the two-step answer: 40 fish left.",
  },
  "wp-4": {
    diagnosis: "12 × 7 is hard to memorize. Break it apart!",
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
    bridge_back: "Add them: 60 + 24 = **84**. So 12 × 7 = 84. This 'break-apart' trick works for any times table you don't remember.",
  },
  "wp-5": {
    diagnosis: "156 − 89 is close to 156 − 90, which is much easier. Round then adjust!",
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
    bridge_back: "So 156 − 89 = 67. This trick works whenever a number ends in 8 or 9.",
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
    bridge_back: "Put them together: 500 + 123 = **623**. So 245 + 378 = 623.",
  },
  "wp-7": {
    diagnosis: "144 ÷ 12 — use what you know about × 12.",
    encouragement: "Start with a friendly ×10, then close the gap.",
    scaffold: [
      {
        question: "12 × 10 = ? (An easy anchor.)",
        answer: 120,
        technique_note: "×10 is just adding a zero.",
      },
      {
        question: "144 − 120 = 24. How many more 12s do you need to add? (12 × ? = 24)",
        answer: 2,
        technique_note: "Fill the gap.",
      },
    ],
    bridge_back: "10 + 2 = 12 groups of 12. So 144 ÷ 12 = **12**.",
  },
};
