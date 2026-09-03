// Unit tests for the arithmetic verifier. Run with `npm run test:verify`.
// No test framework: prints ok / FAIL lines, exits non-zero on any failure.

import { extractResults, checkRung, verifyScaffold, readingLevel, verifyGeneratedPrompt } from "../lib/verify";
import { generateSpec, makeRng } from "../lib/generate";
import { SKILLS } from "../lib/skills";

type Case = { name: string; got: unknown; want: unknown };
const cases: Case[] = [];
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function expect(name: string, got: unknown, want: unknown) {
  cases.push({ name, got, want });
}

// ---- extractResults ----
expect("plain product", extractResults("12 × 5 = ?").includes(60), true);
expect("plain sum", extractResults("200 + 300 = ?").includes(500), true);
expect("plain difference", extractResults("100 − 97").includes(3), true);
expect("plain division", extractResults("72 ÷ 8").includes(9), true);
expect("multi-term", extractResults("6 + 6 + 6 + 6").includes(24), true);
expect("precedence: 3 + 4 × 5 = 23", extractResults("3 + 4 × 5").includes(23), true);
expect("groups-of pattern", extractResults("how many groups of 6 fit in 24?").includes(4), true);
expect("Ns-in pattern", extractResults("How many 12s fit in 24?").includes(2), true);
expect("A × ? = B", extractResults("So 8 × ? = 72").includes(9), true);
expect("? + A = B", extractResults("? + 5 = 12").includes(7), true);
expect("word 'box' is not multiplication", extractResults("The box holds 3 items").length, 0);
expect("skip-count list not misread", extractResults("8, 16, 24, 32").length, 0);

// ---- checkRung ----
expect("rung verified", checkRung("12 × 5 = ?", 60).status, "verified");
expect("rung failed", checkRung("12 × 5 = ?", 61).status, "failed");
expect("rung unverified", checkRung("How many bottom beads for 3?", 3).status, "unverified");

// ---- readingLevel ----
expect("short sentence ok", readingLevel("This is short.").ok, true);
expect(
  "long sentence flagged",
  readingLevel(
    "This is a very long sentence that goes on and on and on and on and on and on and on and on."
  ).ok,
  false
);
expect("long word flagged", readingLevel("supercalifragilisticexpialidocious.").ok, false);

// ---- verifyScaffold ----
const goodScaffold = {
  diagnosis: "You multiplied — but sharing means divide.",
  encouragement: "Let's try a smaller one.",
  scaffold: [
    { question: "6 + 6 = ?", answer: 12 },
    { question: "So 6 × 2 = ?", answer: 12 },
  ],
  bridge_back: "Now type your answer into the original.",
};
expect("good scaffold ok", verifyScaffold(goodScaffold as any, 4).ok, true);

const badScaffold = {
  diagnosis: "…",
  encouragement: "…",
  scaffold: [
    { question: "12 × 5 = ?", answer: 61 }, // wrong: 12*5=60
  ],
  bridge_back: "…",
};
expect("bad arithmetic rejected", verifyScaffold(badScaffold as any, 100).ok, false);

const noRungs = {
  diagnosis: "…",
  encouragement: "…",
  scaffold: [],
  bridge_back: "…",
};
expect("empty scaffold rejected", verifyScaffold(noRungs as any, 100).ok, false);

// ---- verifyGeneratedPrompt ----
expect(
  "operands present and in order",
  verifyGeneratedPrompt("Sparky finds 24 rocks in 6 asteroids.", [24, 6], 4).ok,
  true
);
expect(
  "missing operand rejected",
  verifyGeneratedPrompt("Sparky has 24 rocks in some asteroids.", [24, 6], 4).ok,
  false
);
expect(
  "operands out of order rejected",
  verifyGeneratedPrompt("6 asteroids share 24 rocks.", [24, 6], 4).ok,
  false
);
expect(
  "answer leaked rejected",
  verifyGeneratedPrompt("Sparky shares 24 rocks into 6 groups of 4.", [24, 6], 4).ok,
  false
);
expect(
  "answer inside a bigger number not a leak",
  verifyGeneratedPrompt("Sparky counts 24 rocks in 6 groups.", [24, 6], 4).ok,
  true
);
expect(
  "hint mentioning answer rejected",
  verifyGeneratedPrompt("Sparky shares 24 rocks into 6 asteroids.", [24, 6], 4, "The answer is 4!").ok,
  false
);
expect(
  "operand equal to answer allowed once",
  verifyGeneratedPrompt("Roll 4 dice for the game.", [4], 4).ok,
  true
);
expect(
  "duplicate operand handled",
  verifyGeneratedPrompt("Sparky rolls 5, then 13, then 5.", [5, 13, 5], 60).ok,
  true
);

// ---- generators produce internally-consistent specs ----
for (const skill of SKILLS) {
  const spec = generateSpec(skill.id, undefined, 12345);
  const good =
    spec.skillId === skill.id &&
    spec.operands.length >= 1 &&
    Number.isFinite(spec.answer) &&
    spec.ccss.length >= 1 &&
    typeof spec.templatePrompt === "string" &&
    spec.templatePrompt.length > 0;
  expect(`generator[${skill.id}] shape ok`, good, true);
  // The template prompt itself must not leak the answer (unless the answer
  // literally equals an operand — abacus "build 23" case).
  const templateLeak = verifyGeneratedPrompt(spec.templatePrompt, spec.operands, spec.answer, spec.templateHint);
  expect(
    `generator[${skill.id}] template passes verifier`,
    templateLeak.ok,
    true
  );
}

// ---- generators are seeded (same seed → same spec) ----
for (const skill of SKILLS) {
  const a = generateSpec(skill.id, undefined, 99);
  const b = generateSpec(skill.id, undefined, 99);
  expect(`generator[${skill.id}] deterministic`, JSON.stringify(a), JSON.stringify(b));
}

// ---- report ----
let pass = 0;
let fail = 0;
for (const c of cases) {
  const ok = eq(c.got, c.want);
  if (ok) pass += 1;
  else fail += 1;
  console.log(ok ? "ok  " : "FAIL", c.name, ok ? "" : `\n     got  ${JSON.stringify(c.got)}\n     want ${JSON.stringify(c.want)}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
