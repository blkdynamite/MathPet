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

export function checkRung(question: string, answer: number): RungCheck {
  const found = extractResults(question);
  if (found.length === 0) return { status: "unverified", reason: "no arithmetic extracted" };
  const tol = 1e-9;
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
