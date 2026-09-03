import type { SkillId } from "./skills";
import type { Misconception } from "./misconceptions";

export type Technique = "abacus" | "vedic" | "lattice" | "input";

export type Problem = {
  id: string;
  concept: string;           // "division_word" | "mult_x11" | ...
  skillId: SkillId;          // the Math Power this problem trains
  ccss: string[];            // Common Core codes
  technique: Technique;
  prompt: string;
  answer: number;
  difficulty: number;        // 1..5
  interestTag?: string;
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
  source?: "live" | "fallback" | "empty";
};

// One attempt at one problem. This is the telemetry that feeds the
// Parent Summary, the Tutor Brief, and (in production) Nerdy's Study Plan.
export type Session = {
  ts: number;
  problemId: string;
  skillId: SkillId;
  concept: string;
  ccss: string[];
  technique: Technique;
  correct: boolean;          // eventually correct
  firstTry: boolean;         // correct with no scaffold
  scaffoldUsed: boolean;
  misconception?: Misconception;
  userAnswer?: number;
  timeSec: number;
};

export type ShopItem = {
  id: string;
  name: string;
  kind: "hat" | "food" | "background";
  price: number;
  emoji: string;
  effect?: string;
};
