export type Technique = "abacus" | "vedic" | "lattice" | "input";

export type Problem = {
  id: string;
  concept: string;           // "addition_place_value" | "mult_x11" | "mult_2x2" | "division_word"
  technique: Technique;
  prompt: string;            // the story / question
  answer: number;
  difficulty: number;        // 1..5
  interestTag?: string;
  // technique hints for renderers
  abacus?: { target: number };
  vedic?: { kind: "x11" | "base10_complement"; a: number; b: number };
  lattice?: { a: number; b: number };
};

export type ScaffoldStep = {
  question: string;
  answer: number;
  technique_note?: string;
};

export type Scaffold = {
  diagnosis: string;
  encouragement: string;
  scaffold: ScaffoldStep[];
  bridge_back: string;
};

export type Session = {
  concept: string;
  correct: boolean;
  hintsUsed: number;
  timeSec: number;
  technique: Technique;
};

export type ShopItem = {
  id: string;
  name: string;
  kind: "hat" | "food" | "background";
  price: number;
  emoji: string;
  effect?: string;
};
