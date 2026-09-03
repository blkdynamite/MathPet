// generate.eval.ts — score deterministic problem generation.
//
//   npm run eval:generate
//
// Pass 1 (offline, no API key needed):
//   - Generate 200 specs (20 seeds × 10 skills). Each spec must:
//     - have a numerically consistent (operands, operation, answer)
//     - carry valid Common Core codes
//     - produce a templatePrompt that passes verifyGeneratedPrompt
//
// Pass 2 (if ANTHROPIC_API_KEY):
//   - For each skill × 3 seeds × 2 interest sets, ask Claude Haiku 4.5 via
//     tool-use to wrap the spec in a story, then run verifyGeneratedPrompt.
//     Track pass rate, latency p50/p95, and rejection reasons.
//
// Writes evals/generate.results.json.

import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { generateSpec, GeneratedSpec } from "../lib/generate";
import { verifyGeneratedPrompt } from "../lib/verify";
import { SKILLS, SkillId } from "../lib/skills";

// ---- Pass 1: offline generator quality ----------------------------------
type OfflineRow = {
  skill: SkillId;
  seed: number;
  operands: number[];
  answer: number;
  arithmeticConsistent: boolean;
  templatePass: boolean;
  reasons: string[];
};

function checkArithmetic(spec: GeneratedSpec): boolean {
  const [a, b, c] = spec.operands;
  switch (spec.operation) {
    case "+":
      return a + b === spec.answer;
    case "-":
      return a - b === spec.answer;
    case "×":
      return a * b === spec.answer;
    case "÷":
      return a / b === spec.answer;
    case "step":
      return c != null && a * b - c === spec.answer;
    case "build":
      return a === spec.answer;
    default:
      return false;
  }
}

const SEEDS = Array.from({ length: 20 }, (_, i) => 1000 + i * 37);

function runOffline(): OfflineRow[] {
  const rows: OfflineRow[] = [];
  for (const skill of SKILLS) {
    for (const seed of SEEDS) {
      const spec = generateSpec(skill.id, undefined, seed);
      const arith = checkArithmetic(spec);
      const v = verifyGeneratedPrompt(spec.templatePrompt, spec.operands, spec.answer, spec.templateHint);
      rows.push({
        skill: skill.id,
        seed,
        operands: spec.operands,
        answer: spec.answer,
        arithmeticConsistent: arith,
        templatePass: v.ok,
        reasons: v.reasons,
      });
    }
  }
  return rows;
}

function summarizeOffline(rows: OfflineRow[]) {
  const n = rows.length;
  const arith = rows.filter((r) => r.arithmeticConsistent).length;
  const templ = rows.filter((r) => r.templatePass).length;
  const bySkill: Record<string, { n: number; arith: number; templ: number }> = {};
  for (const r of rows) {
    const b = (bySkill[r.skill] ??= { n: 0, arith: 0, templ: 0 });
    b.n += 1;
    if (r.arithmeticConsistent) b.arith += 1;
    if (r.templatePass) b.templ += 1;
  }
  return { total: n, arithmeticConsistent: arith, templatePass: templ, bySkill };
}

// ---- Pass 2: live LLM story wrapping ------------------------------------
type LiveRow = {
  skill: SkillId;
  interests: string[];
  seed: number;
  operands: number[];
  answer: number;
  storyOk: boolean;
  reasons: string[];
  prompt: string;
  hint: string;
  latencyMs: number;
};

const STORY_TOOL = {
  name: "emit_word_problem",
  description: "Emit a short story word-problem using the given operands.",
  input_schema: {
    type: "object" as const,
    properties: {
      prompt: { type: "string" as const },
      hint: { type: "string" as const },
    },
    required: ["prompt", "hint"],
  },
};

const INTEREST_SETS: string[][] = [
  ["space"],
  ["animals", "sports"],
  ["gaming", "music"],
];

async function callLive(
  client: Anthropic,
  spec: GeneratedSpec,
  interests: string[]
): Promise<{ prompt: string; hint: string; latencyMs: number } | null> {
  const t0 = Date.now();
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      tools: [STORY_TOOL],
      tool_choice: { type: "tool", name: "emit_word_problem" },
      messages: [
        {
          role: "user",
          content:
            `Wrap this math in a story for a 9-year-old.\n` +
            `Strategy: ${spec.strategy}\n` +
            `Operands (use EXACTLY these digits, in this order): ${spec.operands.join(", ")}\n` +
            `Operation: ${spec.operation}\n` +
            `Interests: ${interests.join(", ")}\n\n` +
            `Do NOT include the answer (${spec.answer}) in prompt or hint.\n` +
            `Sentence ≤ 20 words. Word ≤ 12 chars.`,
        },
      ],
    });
    const latencyMs = Date.now() - t0;
    const tool = msg.content.find((b: any) => b.type === "tool_use");
    if (!tool) return null;
    const input = (tool as any).input as { prompt?: string; hint?: string };
    if (!input?.prompt || !input?.hint) return null;
    return { prompt: input.prompt, hint: input.hint, latencyMs };
  } catch {
    return null;
  }
}

async function runLive(): Promise<{ rows: LiveRow[]; latency: { p50: number; p95: number; avg: number } } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const rows: LiveRow[] = [];
  const latencies: number[] = [];
  const SEEDS_LIVE = [7, 42, 123];
  console.log(`\nGenerating ${SKILLS.length * SEEDS_LIVE.length * INTEREST_SETS.length} live stories…`);
  for (const skill of SKILLS) {
    for (const seed of SEEDS_LIVE) {
      const interests = INTEREST_SETS[seed % INTEREST_SETS.length];
      const spec = generateSpec(skill.id, undefined, seed);
      const out = await callLive(client, spec, interests);
      const v = out
        ? verifyGeneratedPrompt(out.prompt, spec.operands, spec.answer, out.hint)
        : { ok: false, reasons: ["no LLM response"] } as any;
      rows.push({
        skill: skill.id,
        interests,
        seed,
        operands: spec.operands,
        answer: spec.answer,
        storyOk: v.ok,
        reasons: v.reasons,
        prompt: out?.prompt ?? "",
        hint: out?.hint ?? "",
        latencyMs: out?.latencyMs ?? 0,
      });
      if (out) latencies.push(out.latencyMs);
      process.stdout.write(v.ok ? "." : "x");
    }
  }
  console.log();
  const sorted = [...latencies].sort((a, b) => a - b);
  const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return {
    rows,
    latency: {
      avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
      p50: p(0.5),
      p95: p(0.95),
    },
  };
}

// ---- Main ---------------------------------------------------------------
async function main() {
  console.log("═══ Deterministic generation (offline) ═══");
  const offline = runOffline();
  const offSum = summarizeOffline(offline);
  console.log(`Arithmetic consistent: ${offSum.arithmeticConsistent}/${offSum.total}`);
  console.log(`Template passes verifier: ${offSum.templatePass}/${offSum.total}`);
  console.log("\nPer-skill:");
  for (const [s, b] of Object.entries(offSum.bySkill)) {
    console.log(`  ${s.padEnd(12)} arith ${b.arith}/${b.n}  template ${b.templ}/${b.n}`);
  }
  const failures = offline.filter((r) => !r.arithmeticConsistent || !r.templatePass);
  if (failures.length) {
    console.log("\nFailures:");
    for (const f of failures.slice(0, 10)) console.log(" ", f.skill, f.seed, f.reasons);
  }

  const live = await runLive();
  if (live) {
    console.log("\n═══ Live LLM story wrapping ═══");
    const okCount = live.rows.filter((r) => r.storyOk).length;
    console.log(`Verified stories: ${okCount}/${live.rows.length}`);
    console.log(`Latency: avg ${live.latency.avg}ms · p50 ${live.latency.p50}ms · p95 ${live.latency.p95}ms`);
    const bySkill: Record<string, { n: number; ok: number }> = {};
    for (const r of live.rows) {
      const b = (bySkill[r.skill] ??= { n: 0, ok: 0 });
      b.n += 1;
      if (r.storyOk) b.ok += 1;
    }
    console.log("\nPer-skill pass rate:");
    for (const [s, b] of Object.entries(bySkill)) {
      console.log(`  ${s.padEnd(12)} ${b.ok}/${b.n}`);
    }
    const reasonCounts: Record<string, number> = {};
    for (const r of live.rows.filter((r) => !r.storyOk)) {
      for (const reason of r.reasons) {
        reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
      }
    }
    if (Object.keys(reasonCounts).length) {
      console.log("\nRejection reasons:");
      for (const [k, v] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${v}× ${k}`);
      }
    }
  } else {
    console.log("\n(ANTHROPIC_API_KEY not set — skipping live pass.)");
  }

  const out = {
    generatedAt: new Date().toISOString(),
    model: "claude-haiku-4-5",
    offline: { rows: offline, summary: offSum },
    live,
  };
  const p = path.join(process.cwd(), "evals", "generate.results.json");
  fs.writeFileSync(p, JSON.stringify(out, null, 2));
  console.log(`\nResults written to evals/generate.results.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
