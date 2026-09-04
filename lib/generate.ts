// Deterministic problem generators. Code picks the numbers per skill and
// difficulty; the LLM's job (in /api/generate) is to wrap them in a
// story around the child's interests. The LLM is never trusted for the
// math — every generated problem is verified before display.

import { Problem, Technique } from "./types";
import { SkillId, getSkill } from "./skills";

// ---- Seedable PRNG (Mulberry32) so eval + tests are reproducible ---------
export type Rng = () => number;
export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pickInt = (rng: Rng, lo: number, hi: number) => Math.floor(rng() * (hi - lo + 1)) + lo;

// ---- Spec shape ----------------------------------------------------------
export type GeneratedSpec = {
  skillId: SkillId;
  strategy: string;                  // human-readable label for the LLM prompt
  operands: number[];                // the numbers that MUST appear in the prompt, in order
  operation: "+" | "-" | "×" | "÷" | "build" | "step";
  answer: number;                    // the ground truth
  ccss: string[];
  technique: Technique;
  difficulty: number;
  templatePrompt: string;            // safe fallback if LLM story fails verification
  templateHint: string;              // safe fallback hint
  abacus?: { target: number };
  vedic?: { kind: "x11" | "base10_complement"; a: number; b: number };
  lattice?: { a: number; b: number };
};

// ---- Individual generators ----------------------------------------------
function genMake10(rng: Rng): GeneratedSpec {
  let a: number, b: number;
  do {
    a = pickInt(rng, 6, 9);
    b = pickInt(rng, 6, 9);
  } while (a + b <= 10);
  return {
    skillId: "make10",
    strategy: "Make-10",
    operands: [a, b],
    operation: "+",
    answer: a + b,
    ccss: ["2.OA.B.2", "3.NBT.A.2"],
    technique: "input",
    difficulty: 1,
    templatePrompt: `${a} + ${b} = ?`,
    templateHint: `Give ${10 - a} from the ${b} to make 10, then add the rest.`,
  };
}

function genAbacusVision(rng: Rng, diff: 1 | 2): GeneratedSpec {
  const target = diff === 1 ? pickInt(rng, 10, 44) : pickInt(rng, 45, 99);
  return {
    skillId: "abacus",
    strategy: "Abacus place value",
    operands: [target],
    operation: "build",
    answer: target,
    ccss: diff === 1 ? ["2.NBT.A.1"] : ["2.NBT.A.1", "3.NBT.A.1"],
    technique: "abacus",
    difficulty: diff,
    templatePrompt: `Build ${target} on the abacus.`,
    templateHint: "Tens on the left, ones on the right. Big top bead = 5.",
    abacus: { target },
  };
}

function genFairShare(rng: Rng, diff: 2 | 3): GeneratedSpec {
  const divisor = diff === 2 ? pickInt(rng, 3, 6) : pickInt(rng, 4, 9);
  const quotient = diff === 2 ? pickInt(rng, 2, 6) : pickInt(rng, 6, 12);
  const total = divisor * quotient;
  return {
    skillId: "fairshare",
    strategy: "Fair Share (division)",
    operands: [total, divisor],
    operation: "÷",
    answer: quotient,
    ccss: ["3.OA.A.2", "3.OA.C.7"],
    technique: "input",
    difficulty: diff,
    templatePrompt: `${total} ÷ ${divisor} = ?`,
    templateHint: `"Each" and "how many groups" mean divide.`,
  };
}

function genBreakApart(rng: Rng): GeneratedSpec {
  const n = pickInt(rng, 11, 20);
  const k = pickInt(rng, 6, 9);
  return {
    skillId: "breakapart",
    strategy: "Break-Apart multiplication",
    operands: [n, k],
    operation: "×",
    answer: n * k,
    ccss: ["3.OA.B.5", "3.OA.C.7"],
    technique: "input",
    difficulty: 3,
    templatePrompt: `${n} × ${k} = ?`,
    templateHint: `Break ${k} into 5 + ${k - 5}, then add the two parts.`,
  };
}

function genTwoStep(rng: Rng): GeneratedSpec {
  const groups = pickInt(rng, 2, 5);
  const per = pickInt(rng, 10, 20);
  const takeAway = pickInt(rng, 3, 8);
  const answer = groups * per - takeAway;
  return {
    skillId: "twostep",
    strategy: "Two-Step",
    operands: [groups, per, takeAway],
    operation: "step",
    answer,
    ccss: ["3.OA.D.8"],
    technique: "input",
    difficulty: 4,
    templatePrompt: `${groups} × ${per} − ${takeAway} = ?`,
    templateHint: "Multiply first to find the total, then subtract.",
  };
}

function genRoundAdjust(rng: Rng): GeneratedSpec {
  // Force a subtrahend that ends in 8 or 9 — where "round then adjust" wins.
  const tens = pickInt(rng, 3, 9) * 10;
  const ones = pickInt(rng, 8, 9);
  const b = tens + ones;
  const a = pickInt(rng, b + 40, b + 150);
  return {
    skillId: "roundadjust",
    strategy: "Round & Adjust",
    operands: [a, b],
    operation: "-",
    answer: a - b,
    ccss: ["3.NBT.A.2"],
    technique: "input",
    difficulty: 3,
    templatePrompt: `${a} − ${b} = ?`,
    // Deliberately no specific rounded value here — stating it can coincide
    // with the answer and leak it (caught by the verifier eval).
    templateHint: `Round the second number up to the nearest ten, subtract, then adjust back.`,
  };
}

function genPartialSums(rng: Rng): GeneratedSpec {
  const a = pickInt(rng, 120, 480);
  const b = pickInt(rng, 120, 480);
  return {
    skillId: "partialsums",
    strategy: "Partial Sums",
    operands: [a, b],
    operation: "+",
    answer: a + b,
    ccss: ["3.NBT.A.2"],
    technique: "input",
    difficulty: 3,
    templatePrompt: `${a} + ${b} = ?`,
    templateHint: "Add the hundreds first, then the rest.",
  };
}

function genX11(rng: Rng, diff: 3 | 4): GeneratedSpec {
  let a: number;
  for (let tries = 0; tries < 40; tries++) {
    a = pickInt(rng, 12, 98);
    if (a % 11 === 0) continue; // skip 22, 33, ... too easy
    const digitSum = Math.floor(a / 10) + (a % 10);
    if (diff === 3 && digitSum <= 9) return build(a);
    if (diff === 4 && digitSum >= 10) return build(a);
  }
  a = diff === 3 ? 23 : 47; // safe fallback
  return build(a);

  function build(a: number): GeneratedSpec {
    return {
      skillId: "x11",
      strategy: "×11 trick (split, add, drop)",
      operands: [a, 11],
      operation: "×",
      answer: a * 11,
      ccss: ["4.NBT.B.5"],
      technique: "vedic",
      difficulty: diff,
      templatePrompt: `${a} × 11 = ?`,
      templateHint: "Split the digits, add them, drop the sum in the middle.",
      vedic: { kind: "x11", a, b: 11 },
    };
  }
}

function genLattice(rng: Rng): GeneratedSpec {
  const a = pickInt(rng, 21, 89);
  const b = pickInt(rng, 21, 89);
  return {
    skillId: "lattice",
    strategy: "Lattice multiplication",
    operands: [a, b],
    operation: "×",
    answer: a * b,
    ccss: ["4.NBT.B.5"],
    technique: "lattice",
    difficulty: 4,
    templatePrompt: `${a} × ${b} = ?`,
    templateHint: "Split each into tens + ones, fill 4 cells, then add.",
    lattice: { a, b },
  };
}

function genNear100(rng: Rng): GeneratedSpec {
  const a = pickInt(rng, 90, 99);
  const b = pickInt(rng, 90, 99);
  return {
    skillId: "near100",
    strategy: "Near-100 (both close to 100)",
    operands: [a, b],
    operation: "×",
    answer: a * b,
    ccss: ["4.NBT.B.5", "5.NBT.B.5"],
    technique: "vedic",
    difficulty: 4,
    templatePrompt: `${a} × ${b} = ?`,
    templateHint: "Find each number's distance from 100, cross-subtract, multiply the deficits.",
    vedic: { kind: "base10_complement", a, b },
  };
}

// ---- Dispatch ------------------------------------------------------------
export function generateSpec(skillId: SkillId, difficulty?: number, seed?: number): GeneratedSpec {
  const rng = makeRng(seed ?? Math.floor(Math.random() * 1e9));
  const d = Math.max(1, Math.min(5, difficulty ?? getSkill(skillId).order));
  switch (skillId) {
    case "make10": return genMake10(rng);
    case "abacus": return genAbacusVision(rng, d <= 1 ? 1 : 2);
    case "fairshare": return genFairShare(rng, d <= 2 ? 2 : 3);
    case "breakapart": return genBreakApart(rng);
    case "twostep": return genTwoStep(rng);
    case "roundadjust": return genRoundAdjust(rng);
    case "partialsums": return genPartialSums(rng);
    case "x11": return genX11(rng, d >= 4 ? 4 : 3);
    case "lattice": return genLattice(rng);
    case "near100": return genNear100(rng);
  }
}

// ---- Deterministic story templates -------------------------------------
// When the LLM is unavailable (no key, timeout, or a rejected story), we
// still want a real word problem — not a bare equation — using the child's
// interests. These are code-generated, so they always pass the verifier:
// operands appear in order and the answer never leaks.
type Theme = { item: string; place: string };
const THEMES: Record<string, Theme> = {
  space: { item: "space rocks", place: "asteroids" },
  animals: { item: "acorns", place: "nests" },
  sports: { item: "balls", place: "hoops" },
  gaming: { item: "coins", place: "chests" },
  art: { item: "stickers", place: "boxes" },
  music: { item: "notes", place: "songs" },
  generic: { item: "stars", place: "jars" },
};

export function storyTemplate(
  spec: GeneratedSpec,
  interests: string[] = []
): { prompt: string; hint: string } {
  const key = interests.find((i) => THEMES[i]) ?? "generic";
  const { item, place } = THEMES[key];
  const [a, b, c] = spec.operands;
  let prompt: string;
  switch (spec.skillId) {
    case "make10":
      prompt = `Sparky found ${a} ${item}, then ${b} more. How many ${item} now?`;
      break;
    case "partialsums":
      prompt = `One team has ${a} ${item} and the other has ${b}. How many together?`;
      break;
    case "fairshare":
      prompt = `Sparky shares ${a} ${item} into ${b} ${place}. How many in each?`;
      break;
    case "breakapart":
      prompt = `${a} ${place} each hold ${b} ${item}. How many ${item} in all?`;
      break;
    case "twostep":
      prompt = `${a} ${place} hold ${b} ${item} each. Sparky gives away ${c}. How many are left?`;
      break;
    case "roundadjust":
      prompt = `Sparky had ${a} ${item} and used ${b}. How many ${item} are left?`;
      break;
    case "x11":
      prompt = `Each of ${a} ${place} holds 11 ${item}. How many ${item} in total?`;
      break;
    case "lattice":
      prompt = `${a} ${place} each hold ${b} ${item}. How many ${item} in total?`;
      break;
    case "near100":
      prompt = `${a} shelves each hold ${b} ${item}. How many ${item} in total?`;
      break;
    case "abacus":
    default:
      prompt = spec.templatePrompt; // "Build 23 on the abacus."
  }
  return { prompt, hint: spec.templateHint };
}

// Convert a spec + optional LLM story into a runtime Problem.
export function specToProblem(
  spec: GeneratedSpec,
  story?: { prompt: string; hint: string },
  idSuffix?: string
): Problem {
  const suffix = idSuffix ?? Math.floor(Math.random() * 1e6).toString(36);
  return {
    id: `gen-${spec.skillId}-${suffix}`,
    concept: skillConcept(spec.skillId),
    skillId: spec.skillId,
    ccss: spec.ccss,
    technique: spec.technique,
    prompt: story?.prompt ?? spec.templatePrompt,
    hint: story?.hint ?? spec.templateHint,
    answer: spec.answer,
    difficulty: spec.difficulty,
    abacus: spec.abacus,
    vedic: spec.vedic,
    lattice: spec.lattice,
  };
}

function skillConcept(id: SkillId): string {
  return {
    make10: "abacus_add",
    abacus: "abacus_build",
    fairshare: "division_word",
    breakapart: "multiplication_word",
    twostep: "multistep_word",
    roundadjust: "subtraction_word",
    partialsums: "addition_word",
    x11: "mult_x11",
    lattice: "mult_2x2",
    near100: "base10_complement",
  }[id];
}

// For an AI-generated problem, we don't have a hand-authored fallback
// scaffold. Map each skill to a sample problem's scaffold that at least
// teaches the right strategy.
export const SKILL_TO_SAMPLE_SCAFFOLD: Record<SkillId, string> = {
  make10: "ab-3",
  abacus: "ab-1",
  fairshare: "wp-1",
  breakapart: "wp-4",
  twostep: "wp-3",
  roundadjust: "wp-5",
  partialsums: "wp-6",
  x11: "ve-1",
  lattice: "la-1",
  near100: "ve-3",
};
