import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSpec, specToProblem, storyTemplate } from "@/lib/generate";
import { verifyGeneratedPrompt } from "@/lib/verify";
import { SkillId } from "@/lib/skills";
import { guard, GenerateSchema, budgetAllows, logUsage } from "@/lib/guard";
import { callTool } from "@/lib/llm";
import { STORY_SYSTEM, STORY_TOOL, buildStoryUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 10;

const StoryOut = z.object({ prompt: z.string().max(400), hint: z.string().max(200) });

export async function POST(req: NextRequest) {
  const g = await guard(req, GenerateSchema);
  if (!g.ok) return g.res;
  const { skillId, difficulty, interests, seed } = g.data;
  const spec = generateSpec(skillId as SkillId, difficulty, seed);
  const template = storyTemplate(spec, interests);

  if (!budgetAllows()) {
    return NextResponse.json({ problem: specToProblem(spec, template), source: "template", reason: "budget" });
  }

  const r = await callTool<unknown>({
    system: STORY_SYSTEM,
    user: buildStoryUser(spec, interests),
    tool: STORY_TOOL,
    maxTokens: 300,
    timeoutMs: 4000,
  });

  if (!r.ok) {
    logUsage("generate", "error", undefined, r.latencyMs, { reason: r.reason, status: r.status, skillId });
    return NextResponse.json({ problem: specToProblem(spec, template), source: "template", reason: r.reason });
  }
  logUsage("generate", "live", r.usage, r.latencyMs, { skillId });

  const parsed = StoryOut.safeParse(r.value);
  if (!parsed.success) {
    return NextResponse.json({ problem: specToProblem(spec, template), source: "template", reason: "schema" });
  }

  // GUARDRAIL: operands present in order, answer never leaks, grade-3 reading.
  const v = verifyGeneratedPrompt(parsed.data.prompt, spec.operands, spec.answer, parsed.data.hint);
  if (v.ok) {
    return NextResponse.json({ problem: specToProblem(spec, parsed.data), source: "live", verification: v, latencyMs: r.latencyMs });
  }
  console.warn(`[generate] REJECTED live story for ${spec.skillId}: ${v.reasons.join("; ")}`);
  return NextResponse.json({
    problem: specToProblem(spec, template),
    source: "template",
    verification: v,
    rejectedReason: v.reasons,
    latencyMs: r.latencyMs,
  });
}
