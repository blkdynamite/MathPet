import { Problem } from "./types";

// Deterministic misconception classifier. Runs in code BEFORE we call the LLM,
// so the scaffold can branch on the error type and the Tutor Brief can report
// patterns ("multiplied instead of divided ×2"). This is the "root cause"
// layer that most gamified math apps skip.

export type Misconception =
  | "multiplied_instead_of_divided"
  | "divided_instead_of_multiplied"
  | "added_instead_of_multiplied"
  | "off_by_one"
  | "place_value_slip"
  | "forgot_to_carry"
  | "skipped_a_step"
  | "digit_reversal"
  | "unknown";

export const MISCONCEPTION_LABELS: Record<Misconception, string> = {
  multiplied_instead_of_divided: "Multiplied instead of divided",
  divided_instead_of_multiplied: "Divided instead of multiplied",
  added_instead_of_multiplied: "Added instead of multiplied",
  off_by_one: "Off by one (counting slip)",
  place_value_slip: "Place-value slip (tens/ones)",
  forgot_to_carry: "Forgot to carry",
  skipped_a_step: "Skipped a step in a multi-step problem",
  digit_reversal: "Reversed the digits",
  unknown: "Unclear error",
};

// Kid-facing diagnosis lines, used to override the fallback scaffold's
// `diagnosis` when we can name the error.
export const MISCONCEPTION_DIAGNOSIS: Record<Misconception, string> = {
  multiplied_instead_of_divided:
    "You multiplied — but 'sharing into groups' means DIVIDE. Sharing splits things apart.",
  divided_instead_of_multiplied:
    "You divided — but 'groups of' means MULTIPLY. We're putting groups together.",
  added_instead_of_multiplied:
    "You added — but 'each' or 'per' means MULTIPLY. Adding once isn't enough!",
  off_by_one: "So close — you're off by just one. Let's re-count the last step.",
  place_value_slip: "Almost! Looks like a tens-and-ones mix-up. Let's line up the place values.",
  forgot_to_carry: "You're close — the middle number was 10 or more, so we need to carry the 1.",
  skipped_a_step: "This is a two-step problem. Looks like one step got skipped.",
  digit_reversal: "The digits got flipped! Let's check which one goes first.",
  unknown: "Not quite — let's build up to it together.",
};

function digitsReversed(a: number, b: number) {
  return String(a) === String(b).split("").reverse().join("") && a !== b;
}

export function classify(problem: Problem, userAnswer: number): Misconception {
  const correct = problem.answer;
  if (!Number.isFinite(userAnswer)) return "unknown";

  // Division word problems: total ÷ groupSize
  if (problem.concept === "division_word") {
    const m = problem.prompt.match(/(\d+)[^\d]+(\d+)/);
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      if (userAnswer === a * b) return "multiplied_instead_of_divided";
      if (userAnswer === a + b) return "added_instead_of_multiplied";
    }
  }

  // Multiplication word problems
  if (problem.concept === "multiplication_word") {
    const m = problem.prompt.match(/(\d+)[^\d]+(\d+)/);
    if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      if (userAnswer === a + b) return "added_instead_of_multiplied";
      if (b !== 0 && userAnswer === Math.floor(a / b)) return "divided_instead_of_multiplied";
    }
  }

  // Multi-step: answering with the intermediate result
  if (problem.concept === "multistep_word") {
    const nums = problem.prompt.match(/\d+/g)?.map(Number) ?? [];
    if (nums.length >= 2 && userAnswer === nums[0] * nums[1]) return "skipped_a_step";
  }

  // Vedic ×11 with a carry
  if (problem.vedic?.kind === "x11") {
    const a = problem.vedic.a;
    const mid = Math.floor(a / 10) + (a % 10);
    if (mid >= 10) {
      const noCarry = Number(`${Math.floor(a / 10)}${mid}${a % 10}`);
      if (userAnswer === noCarry) return "forgot_to_carry";
    }
  }

  // Lattice: a common slip is summing only 3 of 4 cells or using a×b of tens only
  if (problem.lattice) {
    const { a, b } = problem.lattice;
    const tensOnly = Math.floor(a / 10) * 10 * (Math.floor(b / 10) * 10);
    if (userAnswer === tensOnly) return "skipped_a_step";
  }

  if (Math.abs(userAnswer - correct) === 1) return "off_by_one";
  if (digitsReversed(userAnswer, correct)) return "digit_reversal";
  if (Math.abs(userAnswer - correct) === 10 || Math.abs(userAnswer - correct) === 100)
    return "place_value_slip";

  return "unknown";
}
