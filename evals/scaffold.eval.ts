// scaffold.eval.ts — score the scaffold pipeline end-to-end.
//
//   npm run eval
//
// Runs two passes:
//   1. FALLBACK — verify every hand-written scaffold in lib/scaffolds.ts.
//   2. LIVE — if ANTHROPIC_API_KEY is set, generate a scaffold for each
//      curated case using Claude Haiku 4.5, then score it with the same
//      verifier the runtime uses.
//
// Prints tables and writes evals/results.json.

import fs from "node:fs";
import path from "node:path";
// The live pass calls the SAME system prompt, tool schema, and client helper
// production uses (lib/prompts.ts, lib/llm.ts). A prompt change in the route
// is measured here automatically — there is no second copy to drift.
import { callTool } from "../lib/llm";
import { SCAFFOLD_SYSTEM, SCAFFOLD_TOOL, buildScaffoldUser } from "../lib/prompts";
import { SCAFFOLDS } from "../lib/scaffolds";
import { PROBLEMS, getProblemById } from "../lib/problems";
import { classify, Misconception } from "../lib/misconceptions";
import {
  verifyScaffold,
  VerifyResult,
  readingLevel,
  diagnosisAddressesMisconception,
} from "../lib/verify";
import { Scaffold } from "../lib/types";

// ---------------------------------------------------------------------------
// Curated failure cases. Each triggers a specific misconception path.
type Case = { problemId: string; wrongAnswer: number; expectMiscon: Misconception };
const CASES: Case[] = [
  { problemId: "wp-1", wrongAnswer: 144, expectMiscon: "multiplied_instead_of_divided" },
  { problemId: "wp-1", wrongAnswer: 30, expectMiscon: "added_instead_of_multiplied" },
  { problemId: "wp-1", wrongAnswer: 5, expectMiscon: "off_by_one" },
  { problemId: "wp-2", wrongAnswer: 576, expectMiscon: "multiplied_instead_of_divided" },
  { problemId: "wp-2", wrongAnswer: 8, expectMiscon: "off_by_one" },
  { problemId: "wp-4", wrongAnswer: 19, expectMiscon: "added_instead_of_multiplied" },
  { problemId: "wp-3", wrongAnswer: 45, expectMiscon: "skipped_a_step" },
  { problemId: "wp-3", wrongAnswer: 39, expectMiscon: "off_by_one" },
  { problemId: "wp-5", wrongAnswer: 66, expectMiscon: "off_by_one" },
  { problemId: "wp-6", wrongAnswer: 622, expectMiscon: "off_by_one" },
  { problemId: "wp-7", wrongAnswer: 2, expectMiscon: "place_value_slip" },
  { problemId: "wp-7", wrongAnswer: 11, expectMiscon: "off_by_one" },
  { problemId: "la-1", wrongAnswer: 600, expectMiscon: "skipped_a_step" },
  { problemId: "la-2", wrongAnswer: 800, expectMiscon: "skipped_a_step" },
  { problemId: "ve-1", wrongAnswer: 352, expectMiscon: "digit_reversal" },
  { problemId: "ve-1", wrongAnswer: 254, expectMiscon: "off_by_one" },
  { problemId: "ve-2", wrongAnswer: 693, expectMiscon: "digit_reversal" },
  { problemId: "ve-3", wrongAnswer: 9500, expectMiscon: "unknown" },
  { problemId: "ab-3", wrongAnswer: 14, expectMiscon: "off_by_one" },
  { problemId: "ab-4", wrongAnswer: 16, expectMiscon: "off_by_one" },
];

// ---------------------------------------------------------------------------
type Score = {
  case: string;
  source: "fallback" | "live";
  jsonOk: boolean;
  runCount: number;
  rungsVerified: number;
  rungsFailed: number;
  arithmeticOk: boolean;
  bridgeLeaks: boolean;
  readingOk: boolean;
  addressesMisconception: boolean;
  classifierOk: boolean;
  reasons: string[];
  latencyMs?: number;
};

function scoreScaffold(
  scaffold: Scaffold,
  originalAnswer: number,
  expectMiscon: Misconception,
  detectedMiscon: Misconception
): Omit<Score, "case" | "source" | "latencyMs"> {
  const v: VerifyResult = verifyScaffold(scaffold, originalAnswer);
  const addresses =
    detectedMiscon === "unknown"
      ? true
      : diagnosisAddressesMisconception(String(scaffold.diagnosis ?? ""), detectedMiscon);
  return {
    jsonOk: true,
    runCount: v.rungCounts.total,
    rungsVerified: v.rungCounts.verified,
    rungsFailed: v.rungCounts.failed,
    arithmeticOk: v.rungCounts.failed === 0,
    bridgeLeaks: v.leaksInBridge,
    readingOk: v.readingOk,
    addressesMisconception: addresses,
    classifierOk: detectedMiscon === expectMiscon,
    reasons: v.reasons,
  };
}

// ---------------------------------------------------------------------------
async function fetchLive(
  problemId: string,
  original: string,
  correctAnswer: number,
  userAnswer: number,
  concept: string,
  technique: string,
  misconception: Misconception
): Promise<{ scaffold: Scaffold | null; latencyMs: number; jsonOk: boolean; reason?: string }> {
  void problemId;
  const r = await callTool<Scaffold>({
    system: SCAFFOLD_SYSTEM,
    user: buildScaffoldUser({ originalQuestion: original, correctAnswer, userAnswer, concept, technique, misconception }),
    tool: SCAFFOLD_TOOL,
    maxTokens: 700,
    timeoutMs: 8000, // generous in the eval: we're measuring quality, not the route's latency budget
  });
  if (!r.ok) return { scaffold: null, latencyMs: r.latencyMs, jsonOk: false, reason: r.reason };
  const v = r.value;
  const wellFormed = v && Array.isArray(v.scaffold) && typeof v.diagnosis === "string" && typeof v.bridge_back === "string";
  return { scaffold: wellFormed ? v : null, latencyMs: r.latencyMs, jsonOk: !!wellFormed };
}

// ---------------------------------------------------------------------------
function printTable(rows: Score[], title: string) {
  console.log(`\n═══ ${title} ═══`);
  const H = ["Case", "Src", "JSON", "Rungs", "Verif", "NoLeak", "Read", "Addr", "Class"];
  const widths = [16, 4, 4, 5, 5, 6, 4, 4, 5];
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join(" | ");
  console.log(line(H));
  console.log(widths.map((w) => "─".repeat(w)).join("─┼─"));
  for (const r of rows) {
    console.log(
      line([
        r.case,
        r.source[0].toUpperCase(),
        r.jsonOk ? "✓" : "✗",
        String(r.runCount),
        `${r.rungsVerified}/${r.runCount}`,
        r.bridgeLeaks ? "✗" : "✓",
        r.readingOk ? "✓" : "✗",
        r.addressesMisconception ? "✓" : "—",
        r.classifierOk ? "✓" : "✗",
      ])
    );
    if (r.reasons.length) {
      console.log("   ↳", r.reasons.join(" · "));
    }
  }
}

function summarize(rows: Score[]) {
  const n = rows.length;
  if (n === 0) return null;
  const c = (pred: (r: Score) => boolean) => rows.filter(pred).length;
  const totalRungs = rows.reduce((s, r) => s + r.runCount, 0);
  const totalVerified = rows.reduce((s, r) => s + r.rungsVerified, 0);
  const totalFailed = rows.reduce((s, r) => s + r.rungsFailed, 0);
  return {
    n,
    jsonOk: c((r) => r.jsonOk),
    arithmeticOk: c((r) => r.arithmeticOk),
    noBridgeLeak: c((r) => !r.bridgeLeaks),
    readingOk: c((r) => r.readingOk),
    addressed: c((r) => r.addressesMisconception),
    classifierOk: c((r) => r.classifierOk),
    rungsVerified: totalVerified,
    rungsFailed: totalFailed,
    totalRungs,
  };
}

function printSummary(label: string, s: ReturnType<typeof summarize>) {
  if (!s) return;
  const pct = (n: number) => `${n}/${s.n} (${Math.round((n / s.n) * 100)}%)`;
  console.log(`\n${label}:`);
  console.log(`  JSON valid            ${pct(s.jsonOk)}`);
  console.log(`  Arithmetic clean      ${pct(s.arithmeticOk)}`);
  console.log(`  Rungs verified        ${s.rungsVerified}/${s.totalRungs} (${Math.round((s.rungsVerified / s.totalRungs) * 100)}%)`);
  console.log(`  Rungs failed          ${s.rungsFailed}`);
  console.log(`  No bridge leak        ${pct(s.noBridgeLeak)}`);
  console.log(`  Reading level ok      ${pct(s.readingOk)}`);
  console.log(`  Diagnosis addresses   ${pct(s.addressed)}`);
  console.log(`  Classifier tag ok     ${pct(s.classifierOk)}`);
}

// ---------------------------------------------------------------------------
async function main() {
  // ---- Pass 1: fallbacks --------------------------------------------------
  const fallbackRows: Score[] = [];
  for (const [id, sc] of Object.entries(SCAFFOLDS)) {
    const prob = getProblemById(id);
    if (!prob) continue;
    // Pair each fallback with the demo's wrong-answer case if present,
    // otherwise use a generic "unknown" misconception.
    const c = CASES.find((c) => c.problemId === id) ?? { wrongAnswer: -1, expectMiscon: "unknown" as const };
    const detected = c.wrongAnswer >= 0 ? classify(prob, c.wrongAnswer) : "unknown";
    fallbackRows.push({
      case: id,
      source: "fallback",
      ...scoreScaffold(sc, prob.answer, c.expectMiscon, detected),
    });
  }
  printTable(fallbackRows, `Fallback scaffolds (${fallbackRows.length})`);
  const fbSummary = summarize(fallbackRows);
  printSummary("Fallback summary", fbSummary);

  // ---- Pass 2: live -------------------------------------------------------
  let liveRows: Score[] = [];
  let liveSummary: ReturnType<typeof summarize> = null;
  let latencyStats: { p50: number; p95: number; avg: number; count: number } | null = null;

  if (process.env.ANTHROPIC_API_KEY) {
    console.log(`\nGenerating ${CASES.length} live scaffolds…`);
    const latencies: number[] = [];
    for (const c of CASES) {
      const prob = getProblemById(c.problemId);
      if (!prob) continue;
      const detected = classify(prob, c.wrongAnswer);
      const res = await fetchLive(
        c.problemId,
        prob.prompt,
        prob.answer,
        c.wrongAnswer,
        prob.concept,
        prob.technique,
        detected
      );
      latencies.push(res.latencyMs);
      const scored = res.scaffold
        ? scoreScaffold(res.scaffold, prob.answer, c.expectMiscon, detected)
        : {
            jsonOk: false,
            runCount: 0,
            rungsVerified: 0,
            rungsFailed: 0,
            arithmeticOk: false,
            bridgeLeaks: false,
            readingOk: false,
            addressesMisconception: false,
            classifierOk: detected === c.expectMiscon,
            reasons: [`no usable model output (${res.reason ?? "malformed tool input"})`],
          };
      liveRows.push({
        case: `${c.problemId}/${c.wrongAnswer}`,
        source: "live",
        latencyMs: res.latencyMs,
        ...scored,
      });
      process.stdout.write(".");
    }
    console.log();
    printTable(liveRows, `Live scaffolds (${liveRows.length})`);
    liveSummary = summarize(liveRows);
    printSummary("Live summary", liveSummary);

    const sorted = [...latencies].sort((a, b) => a - b);
    const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
    latencyStats = {
      count: latencies.length,
      avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
      p50: p(0.5),
      p95: p(0.95),
    };
    console.log(
      `\nLatency (${latencyStats.count} calls): avg ${latencyStats.avg}ms · p50 ${latencyStats.p50}ms · p95 ${latencyStats.p95}ms`
    );
  } else {
    console.log("\n(ANTHROPIC_API_KEY not set — skipping live pass.)");
  }

  // ---- Persist ------------------------------------------------------------
  const results = {
    generatedAt: new Date().toISOString(),
    model: "claude-haiku-4-5",
    fallback: { rows: fallbackRows, summary: fbSummary },
    live: process.env.ANTHROPIC_API_KEY
      ? { rows: liveRows, summary: liveSummary, latency: latencyStats }
      : null,
  };
  const out = path.join(process.cwd(), "evals", "results.json");
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\nResults written to evals/results.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
