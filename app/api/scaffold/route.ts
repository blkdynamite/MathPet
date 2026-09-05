import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SCAFFOLDS } from "@/lib/scaffolds";
import { Scaffold } from "@/lib/types";
import { MISCONCEPTION_DIAGNOSIS, Misconception } from "@/lib/misconceptions";
import { verifyScaffold } from "@/lib/verify";
import { SKILL_TO_SAMPLE_SCAFFOLD } from "@/lib/generate";
import { SkillId } from "@/lib/skills";
import { getProblemById } from "@/lib/problems";
import { guard, ScaffoldSchema, budgetAllows, logUsage } from "@/lib/guard";
import { callTool } from "@/lib/llm";
import { SCAFFOLD_SYSTEM, SCAFFOLD_TOOL, buildScaffoldUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 10;

// What the model is allowed to hand back. Validated before the verifier runs.
const ScaffoldOut = z.object({
  diagnosis: z.string().max(300),
  encouragement: z.string().max(300),
  scaffold: z
    .array(
      z.object({
        question: z.string().max(300),
        answer: z.number().finite(),
        technique_note: z.string().max(300).optional(),
      })
    )
    .min(1)
    .max(4),
  bridge_back: z.string().max(300),
});

function fallbackFor(problemId: string, skillId?: SkillId, misconception?: Misconception): Scaffold | null {
  let fb = SCAFFOLDS[problemId];
  // AI-generated problem (id "gen-…") — fall back by skill so the strategy is
  // still right even if the numbers differ.
  if (!fb && skillId && SKILL_TO_SAMPLE_SCAFFOLD[skillId]) fb = SCAFFOLDS[SKILL_TO_SAMPLE_SCAFFOLD[skillId]];
  if (!fb) return null;
  const diagnosis =
    misconception && misconception !== "unknown" ? MISCONCEPTION_DIAGNOSIS[misconception] : fb.diagnosis;
  return { ...fb, diagnosis };
}

export async function POST(req: NextRequest) {
  const g = await guard(req, ScaffoldSchema);
  if (!g.ok) return g.res;
  const body = g.data;
  const misconception = body.misconception as Misconception;
  const skillId = body.skillId as SkillId | undefined;

  // Source of truth: for hand-authored problems the server resolves the answer
  // and question itself and ignores what the client asserted. Generated
  // problems ("gen-…") have no server-side record in this build, so their
  // values are taken from the (validated, bounded) request — a known gap;
  // production keeps a short-lived server cache keyed by problem id.
  const known = getProblemById(body.problemId);
  const correctAnswer = known ? known.answer : body.correctAnswer;
  const originalQuestion = known ? known.prompt : body.originalQuestion;

  let raw: Scaffold | null = null;
  let source: "live" | "fallback" | "empty" = "fallback";
  let reason: string | undefined;

  if (budgetAllows()) {
    const r = await callTool<unknown>({
      system: SCAFFOLD_SYSTEM,
      user: buildScaffoldUser({
        originalQuestion,
        correctAnswer,
        userAnswer: body.userAnswer ?? null,
        concept: body.concept,
        technique: body.technique,
        misconception,
      }),
      tool: SCAFFOLD_TOOL,
      maxTokens: 700,
      timeoutMs: 2500,
    });
    if (r.ok) {
      const parsed = ScaffoldOut.safeParse(r.value);
      if (parsed.success) raw = parsed.data as Scaffold;
      else reason = "schema";
      logUsage("scaffold", "live", r.usage, r.latencyMs, { problemId: body.problemId });
    } else {
      reason = r.reason;
      logUsage("scaffold", "error", undefined, r.latencyMs, { reason: r.reason, status: r.status });
    }
  } else {
    reason = "budget";
  }

  // GUARDRAIL: re-derive every rung in code before a child sees it.
  if (raw) {
    const v = verifyScaffold(raw, correctAnswer);
    if (v.ok) {
      return NextResponse.json({ ...raw, source: "live", verification: v });
    }
    reason = `verify: ${v.reasons.join("; ")}`;
    console.warn(`[scaffold] REJECTED live output for ${body.problemId}: ${reason}`);
    const fb = fallbackFor(body.problemId, skillId, misconception);
    if (fb) return NextResponse.json({ ...fb, source: "fallback", verification: v, rejectedReason: v.reasons });
  }

  const fb = fallbackFor(body.problemId, skillId, misconception);
  if (fb) return NextResponse.json({ ...fb, source, ...(reason ? { reason } : {}) });

  source = "empty";
  return NextResponse.json({
    diagnosis: "Not quite — let's try again.",
    encouragement: "Every mistake is a step forward!",
    scaffold: [],
    bridge_back: "Give it another shot.",
    source,
    ...(reason ? { reason } : {}),
  });
}
