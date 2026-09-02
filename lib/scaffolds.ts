import { Scaffold } from "./types";

// Pre-generated fallbacks per problem id. The demo cannot go down on an API call.
// The live API tries first; on timeout/error we fall back to these.
export const SCAFFOLDS: Record<string, Scaffold> = {
  "wp-1": {
    diagnosis: "Hmm, it looks like you multiplied instead of divided. Sharing is dividing!",
    encouragement: "That's a super common mix-up — let's build up to it together.",
    scaffold: [
      {
        question: "First, what is 6 + 6 + 6 + 6? (that's 4 groups of 6)",
        answer: 24,
        technique_note: "Skip-counting shows what division undoes.",
      },
      {
        question: "Nice! So how many groups of 6 fit inside 24?",
        answer: 4,
        technique_note: "This is the same as 24 ÷ 6.",
      },
    ],
    bridge_back: "Perfect — now try the original: 24 rocks ÷ 6 per asteroid = ?",
  },
  "wp-2": {
    diagnosis: "Almost! Sharing 72 into 8 hoops means splitting equally.",
    encouragement: "You've got this — let's find the pattern.",
    scaffold: [
      { question: "8 × 9 = ?", answer: 72, technique_note: "The times table gives us the reverse." },
      { question: "So 72 ÷ 8 = ?", answer: 9 },
    ],
    bridge_back: "Now try again: 72 basketballs ÷ 8 hoops = ?",
  },
  "ve-1": {
    diagnosis: "The ×11 trick is a shortcut — no long multiplication needed!",
    encouragement: "Let's walk through the pattern.",
    scaffold: [
      { question: "Split the digits of 23 with a gap: 2 _ 3. What's 2 + 3?", answer: 5 },
      { question: "Now put that 5 in the middle: 2, 5, 3. What number is that?", answer: 253 },
    ],
    bridge_back: "That's the ×11 trick! 23 × 11 = 253.",
  },
  "ve-3": {
    diagnosis: "Base-10 tricks feel like magic. Let me show you.",
    encouragement: "Two easy subtractions and you're done.",
    scaffold: [
      { question: "100 - 97 = ?", answer: 3 },
      { question: "100 - 98 = ?", answer: 2 },
    ],
    bridge_back: "Now: (97 - 2) gives the front (95). And 3 × 2 = 6 gives the back. Answer: 9506.",
  },
  "la-1": {
    diagnosis: "The lattice breaks 34 × 27 into 4 easy little multiplications.",
    encouragement: "One cell at a time!",
    scaffold: [
      { question: "Top-left of the box: 30 × 20 = ?", answer: 600 },
      { question: "Now the diagonals sum up. What's 600 + 210 + 80 + 28?", answer: 918 },
    ],
    bridge_back: "That's your answer: 34 × 27 = 918.",
  },
  "la-2": {
    diagnosis: "Same idea — split each number into tens and ones.",
    encouragement: "You're doing great.",
    scaffold: [
      { question: "40 × 20 = ?", answer: 800 },
      { question: "Now add: 800 + 120 + 100 + 15 = ?", answer: 1035 },
    ],
    bridge_back: "So 45 × 23 = 1035.",
  },
  "wp-3": {
    diagnosis: "Multi-step! First multiply, then subtract.",
    encouragement: "Break it into two smaller problems.",
    scaffold: [
      { question: "3 tanks × 15 fish = ?", answer: 45 },
      { question: "Now subtract the 5 given away: 45 - 5 = ?", answer: 40 },
    ],
    bridge_back: "That's your answer!",
  },
  "wp-4": {
    diagnosis: "Multiplication is repeated addition.",
    encouragement: "Let's use a shortcut.",
    scaffold: [
      { question: "10 × 12 = ?", answer: 120 },
      { question: "You went one too many. Subtract 12 × 3: 120 - 36 = ?", answer: 84 },
    ],
    bridge_back: "So 12 × 7 = 84.",
  },
  "wp-5": {
    diagnosis: "Big subtraction — let's use round numbers.",
    encouragement: "Almost like adding!",
    scaffold: [
      { question: "Round 89 up to 90. 156 - 90 = ?", answer: 66 },
      { question: "We took 1 too many. Add it back: 66 + 1 = ?", answer: 67 },
    ],
    bridge_back: "156 - 89 = 67.",
  },
  "wp-6": {
    diagnosis: "Add the hundreds, then the rest.",
    encouragement: "You've got this.",
    scaffold: [
      { question: "200 + 300 = ?", answer: 500 },
      { question: "Now add 45 + 78: what's that?", answer: 123 },
    ],
    bridge_back: "500 + 123 = 623.",
  },
  "wp-7": {
    diagnosis: "Division undoes multiplication.",
    encouragement: "Think of your times tables.",
    scaffold: [
      { question: "12 × 10 = ?", answer: 120 },
      { question: "12 × 12 = ?", answer: 144 },
    ],
    bridge_back: "So 144 ÷ 12 = 12.",
  },
  "ab-1": {
    diagnosis: "The abacus groups by 5s. Two upper beads = 10.",
    encouragement: "Try again — one bead at a time.",
    scaffold: [
      { question: "How many 10s are in 23?", answer: 2 },
      { question: "How many 1s are left over?", answer: 3 },
    ],
    bridge_back: "So 23 = 2 tens + 3 ones.",
  },
  "ab-2": {
    diagnosis: "47 needs 4 tens and 7 ones.",
    encouragement: "Group the ones as 5 + 2.",
    scaffold: [
      { question: "How many tens are in 47?", answer: 4 },
      { question: "How many ones (5 + how many)?", answer: 2 },
    ],
    bridge_back: "So 47 = 4 tens + 1 five + 2 ones.",
  },
  "ab-3": {
    diagnosis: "Bridge over the 10!",
    encouragement: "Make a 10 first.",
    scaffold: [
      { question: "8 + 2 = ?", answer: 10 },
      { question: "You took 2 from 7. Now 10 + 5 = ?", answer: 15 },
    ],
    bridge_back: "That's the make-10 trick: 8 + 7 = 15.",
  },
};
