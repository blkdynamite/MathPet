// Pure arithmetic verification for scaffold rungs.
//
// Guardrail invariant: no LLM output is displayed to a child unless every
// arithmetic rung it contains has been re-derived in code and matches the
// LLM's claimed answer. If any rung's arithmetic disagrees, we reject the
// whole ladder and fall back to a hand-verified scaffold.
//
// Word-only rungs (e.g. "How many bottom beads for 3?") return `unverified`
// — they're allowed through but don't count toward "verified" rate in evals.

import { Scaffold } from "./types";

// ---------------------------------------------------------------------------
// Normalize kid-facing math notation to ASCII operators.
const OP: Record<string, string> = {
  "×": "*", "·": "*", "∗": "*",
  "÷": "/", "∕": "/",
  "−": "-", "–": "-", "—": "-",
};
function normalize(s: string): string {
  // Only rewrite an ASCII 'x' when it clearly sits between digits ("3 x 4"),
  // never inside a word like "box" or "how many".
  return s
    .replace(/[×·∗÷∕−–—]/g, (m) => OP[m] ?? m)
    .replace(/(\d)\s*[xX]\s*(\d)/g, "$1 * $2");
}

// ---------------------------------------------------------------------------
// Evaluate a token stream honoring * / precedence over + -.
function evalTokens(tokens: string[]): number {
  const p1: (string | number)[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "*" || t === "/") {
      const a = Number(p1.pop());
      const b = Number(tokens[i + 1]);
      if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error("bad");
      p1.push(t === "*" ? a * b : a / b);
      i += 2;
    } else {
      p1.push(t);
      i += 1;
    }
  }
  if (p1.length === 0) throw new Error("empty");
  let acc = Number(p1[0]);
  if (!Number.isFinite(acc)) throw new Error("bad");
  for (let j = 1; j < p1.length; j += 2) {
    const op = p1[j] as string;
    const n = Number(p1[j + 1]);
    if (!Number.isFinite(n)) throw new Error("bad");
    acc = op === "+" ? acc + n : acc - n;
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Find every plausible arithmetic result stated (or askable) in a text.
export function extractResults(text: string): number[] {
  const norm = normalize(text);
  const out: number[] = [];

  // (1) Explicit multi-term expressions: `N op N (op N)*`
  const expr = /(\d+(?:\.\d+)?(?:\s*[+\-*/]\s*\d+(?:\.\d+)?)+)/g;
  let m: RegExpExecArray | null;
  while ((m = expr.exec(norm))) {
    try {
      const tokens = m[1].replace(/\s/g, "").match(/\d+(?:\.\d+)?|[+\-*/]/g);
      if (tokens) {
        const v = evalTokens(tokens);
        if (Number.isFinite(v)) out.push(v);
      }
    } catch {
      /* skip */
    }
  }

  // (2) Equations with a `?` unknown: `A op ? = B` or `? op A = B`.
  //     Extract the value of `?` and add it to the results.
  const eq1 = /(\d+)\s*([+\-*/])\s*\?\s*=\s*(\d+)/g;
  while ((m = eq1.exec(norm))) {
    const a = Number(m[1]);
    const b = Number(m[3]);
    const op = m[2];
    const q =
      op === "+" ? b - a :
      op === "-" ? a - b :
      op === "*" ? (a !== 0 ? b / a : NaN) :
                   a * b; // A / ? = B → ? = A / B
    // For A / ? = B we actually want A / B; guard against B==0.
    const q2 = op === "/" ? (b !== 0 ? a / b : NaN) : q;
    if (Number.isFinite(q2)) out.push(q2);
  }
  const eq2 = /\?\s*([+\-*/])\s*(\d+)\s*=\s*(\d+)/g;
  while ((m = eq2.exec(norm))) {
    const a = Number(m[2]);
    const b = Number(m[3]);
    const op = m[1];
    const q =
      op === "+" ? b - a :
      op === "-" ? a + b :
      op === "*" ? (a !== 0 ? b / a : NaN) :
                   a * b; // ? / A = B → ? = A * B
    if (Number.isFinite(q)) out.push(q);
  }

  // (3) Word patterns — "how many groups of X fit in Y", "how many Xs in Y"
  const grp1 = /how many[^?.]{0,60}?of\s+(\d+)[^?.]{0,60}?in\s+(\d+)/gi;
  while ((m = grp1.exec(text))) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a !== 0) out.push(b / a);
  }
  const grp2 = /how many\s+(\d+)s?\b[^?.]{0,60}?(?:in|inside|fit in|reach|make up)\s+(\d+)/gi;
  while ((m = grp2.exec(text))) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a !== 0) out.push(b / a);
  }

  return out;
}

// ---------------------------------------------------------------------------
export type RungCheck =
  | { status: "verified"; found: number[] }
  | { status: "unverified"; reason: string }
  | { status: "failed"; expected: number; found: number[] };

// The expression that the rung is actually ASKING is the one immediately
// before its question mark ("12 × 5 = ?"). If such an expression exists it is
// authoritative — a parenthetical elsewhere ("Remember: 5 + 5 = 10") must not
// be allowed to "verify" a wrong answer. Only when there is no explicit
// expression before the '?' do we fall back to any extracted result (word
// patterns like "how many groups of 6 fit in 24?").
function askedValue(question: string): number | null {
  const q = question.indexOf("?");
  if (q === -1) return null;
  const prefix = normalize(question.slice(0, q));
  const expr = /(\d+(?:\.\d+)?(?:\s*[+\-*/]\s*\d+(?:\.\d+)?)+)\s*=?\s*$/;
  const m = expr.exec(prefix);
  if (!m) return null;
  try {
    const tokens = m[1].replace(/\s/g, "").match(/\d+(?:\.\d+)?|[+\-*/]/g);
    if (!tokens) return null;
    const v = evalTokens(tokens);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export function checkRung(question: string, answer: number): RungCheck {
  const tol = 1e-9;
  const asked = askedValue(question);
  if (asked !== null) {
    return Math.abs(asked - answer) < tol
      ? { status: "verified", found: [asked] }
      : { status: "failed", expected: answer, found: [asked] };
  }
  const found = extractResults(question);
  if (found.length === 0) return { status: "unverified", reason: "no arithmetic extracted" };
  if (found.some((v) => Math.abs(v - answer) < tol)) return { status: "verified", found };
  return { status: "failed", expected: answer, found };
}

// ---------------------------------------------------------------------------
// Reading level: keep sentences short and words short enough for grade 3.
export function readingLevel(text: string): { ok: boolean; longestSentence: number; longestWord: number } {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const longestSentence = sentences.reduce(
    (n, s) => Math.max(n, s.split(/\s+/).filter(Boolean).length),
    0
  );
  const words = text.split(/[^A-Za-z]+/).filter(Boolean);
  const longestWord = words.reduce((n, w) => Math.max(n, w.length), 0);
  // 22 words/sentence and 14 chars/word are generous; caught anything egregious.
  return { ok: longestSentence <= 22 && longestWord <= 14, longestSentence, longestWord };
}

// ---------------------------------------------------------------------------
export type VerifyResult = {
  ok: boolean;
  rungs: RungCheck[];
  rungCounts: { verified: number; unverified: number; failed: number; total: number };
  reasons: string[];
  leaksInRung: boolean;
  leaksInBridge: boolean;
  readingOk: boolean;
  readingWorst?: { longestSentence: number; longestWord: number; field: string };
};

export function verifyScaffold(scaffold: Scaffold, originalAnswer: number): VerifyResult {
  const reasons: string[] = [];
  const empty = {
    verified: 0,
    unverified: 0,
    failed: 0,
    total: 0,
  };

  if (!scaffold || !Array.isArray(scaffold.scaffold)) {
    return {
      ok: false,
      rungs: [],
      rungCounts: empty,
      reasons: ["scaffold.scaffold missing or not an array"],
      leaksInRung: false,
      leaksInBridge: false,
      readingOk: false,
    };
  }
  if (scaffold.scaffold.length < 1 || scaffold.scaffold.length > 4) {
    reasons.push(`rung count ${scaffold.scaffold.length} outside [1,4]`);
  }

  const rungs = scaffold.scaffold.map((r) =>
    checkRung(String(r.question ?? ""), Number(r.answer))
  );
  const rungCounts = rungs.reduce(
    (c, r) => {
      c.total += 1;
      c[r.status] += 1;
      return c;
    },
    { verified: 0, unverified: 0, failed: 0, total: 0 }
  );
  if (rungCounts.failed > 0) reasons.push(`${rungCounts.failed} rung(s) failed arithmetic verification`);

  // Answer leakage.
  const leaksInRung = scaffold.scaffold.some((r) => Number(r.answer) === Number(originalAnswer));
  if (leaksInRung) reasons.push("a rung's answer equals the original answer");
  const bridge = String(scaffold.bridge_back ?? "");
  const bareAnswerRe = new RegExp(`(^|[^0-9])${originalAnswer}([^0-9]|$)`);
  const leaksInBridge = bareAnswerRe.test(bridge);
  if (leaksInBridge) reasons.push("bridge_back contains the original answer as a bare number");

  // Reading level across all kid-facing prose fields.
  const proseFields: Array<[string, string]> = [
    ["diagnosis", String(scaffold.diagnosis ?? "")],
    ["encouragement", String(scaffold.encouragement ?? "")],
    ["bridge_back", bridge],
    ...scaffold.scaffold.map((r, i) => [`rung${i + 1}.question`, String(r.question ?? "")] as [string, string]),
  ];
  let readingOk = true;
  let readingWorst: VerifyResult["readingWorst"];
  for (const [field, s] of proseFields) {
    if (!s) continue;
    const r = readingLevel(s);
    if (!r.ok) {
      readingOk = false;
      if (
        !readingWorst ||
        r.longestSentence > readingWorst.longestSentence ||
        r.longestWord > readingWorst.longestWord
      ) {
        readingWorst = { ...r, field };
      }
    }
  }
  if (!readingOk) reasons.push("reading level exceeds grade 3 heuristic");

  // Runtime rejection rule: reject only on hard defects — bad arithmetic or a
  // malformed rung list. Leakage and reading level are quality metrics for the
  // eval, not runtime rejections: a rung's answer legitimately equals the
  // original when the ladder builds all the way up to it (that's good pedagogy;
  // the child still re-derives it when they type in the original problem).
  const ok = rungCounts.failed === 0 && rungCounts.total >= 1 && rungCounts.total <= 4;

  return { ok, rungs, rungCounts, reasons, leaksInRung, leaksInBridge, readingOk, readingWorst };
}

// ---------------------------------------------------------------------------
// Verify the LLM's story wrapper for a generated problem: the story must
// contain every operand as its exact digits (in order), must NOT state the
// answer as a bare number, and must read at grade 3.

export type GenPromptResult = {
  ok: boolean;
  reasons: string[];
  operandsFound: boolean[];
  operandsInOrder: boolean;
  answerLeaked: boolean;
  readingOk: boolean;
  readingWorst?: ReturnType<typeof readingLevel>;
};

function digitPositions(text: string, n: number): number[] {
  const positions: number[] = [];
  const re = new RegExp(`(^|[^0-9])(${n})(?=[^0-9]|$)`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    // index of the number itself, not the preceding boundary
    positions.push(m.index + m[1].length);
  }
  return positions;
}

export function verifyGeneratedPrompt(
  prompt: string,
  operands: number[],
  answer: number,
  hint = ""
): GenPromptResult {
  const reasons: string[] = [];
  const p = String(prompt ?? "");

  // Walk left-to-right: for each operand, find the FIRST occurrence that
  // starts strictly after the previous one. Handles duplicate operands
  // (e.g. [5, 13, 5]) correctly.
  const operandsFound = operands.map(() => false);
  let cursor = -1;
  operands.forEach((op, i) => {
    const ps = digitPositions(p, op).filter((pos) => pos > cursor);
    if (ps.length > 0) {
      operandsFound[i] = true;
      cursor = ps[0];
    }
  });
  const allFound = operandsFound.every(Boolean);
  if (!allFound) {
    const missing = operands.filter((_, i) => !operandsFound[i]);
    reasons.push(`missing or out-of-order operand(s): ${missing.join(", ")}`);
  }
  const operandsInOrder = allFound;

  // Answer leakage in the prompt. A bare answer digit is a leak UNLESS one
  // of the operands equals the answer (then that occurrence is allowed).
  const answerHits = digitPositions(p, answer);
  const operandOccurrencesEqualToAnswer = operands.filter((op) => op === answer).length;
  const answerLeaked = answerHits.length > operandOccurrencesEqualToAnswer;
  if (answerLeaked) reasons.push(`answer ${answer} appears in the prompt as a bare digit`);

  // Also check the hint (kid-facing).
  const hintAnswerHits = hint ? digitPositions(hint, answer).length : 0;
  const hintLeaked = hintAnswerHits > 0;
  if (hintLeaked) reasons.push(`answer ${answer} appears in the hint`);

  // Reading level across prompt + hint.
  const r1 = readingLevel(p);
  const r2 = hint ? readingLevel(hint) : { ok: true, longestSentence: 0, longestWord: 0 };
  const readingOk = r1.ok && r2.ok;
  const readingWorst =
    r1.longestSentence + r1.longestWord >= r2.longestSentence + r2.longestWord ? r1 : r2;
  if (!readingOk) reasons.push("reading level too high for grade 3");

  const ok = allFound && operandsInOrder && !answerLeaked && !hintLeaked && readingOk;
  return {
    ok,
    reasons,
    operandsFound,
    operandsInOrder,
    answerLeaked: answerLeaked || hintLeaked,
    readingOk,
    readingWorst,
  };
}

// Does the diagnosis at least mention what the misconception is about?
// Loose keyword check — not a strict test, more of a hint for the eval.
const MISCON_KEYWORDS: Record<string, string[]> = {
  multiplied_instead_of_divided: ["divid", "share", "group", "split"],
  divided_instead_of_multiplied: ["multipl", "group", "each"],
  added_instead_of_multiplied: ["multipl", "group", "each", "times"],
  off_by_one: ["off", "one", "close", "count"],
  place_value_slip: ["place", "ten", "one", "digit"],
  forgot_to_carry: ["carry", "middle", "ten"],
  skipped_a_step: ["step", "first", "next", "then"],
  digit_reversal: ["digit", "flip", "reverse", "order"],
};
export function diagnosisAddressesMisconception(diagnosis: string, misconception: string): boolean {
  const kws = MISCON_KEYWORDS[misconception];
  if (!kws) return true; // unknown misconception → no check
  const d = diagnosis.toLowerCase();
  return kws.some((k) => d.includes(k));
}
