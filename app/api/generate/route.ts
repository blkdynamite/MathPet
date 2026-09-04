import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateSpec, specToProblem, storyTemplate, GeneratedSpec } from "@/lib/generate";
import { verifyGeneratedPrompt } from "@/lib/verify";
import { SkillId } from "@/lib/skills";

export const runtime = "nodejs";

// Structured output via tool-use. Claude is FORCED to return a JSON object
// matching this schema — no free-form parsing, no `text.indexOf("{")` hacks.
const STORY_TOOL = {
  name: "emit_word_problem",
  description:
    "Emit a short story-word problem for a 9-year-old that uses the given operands and implies the given operation, without stating the answer.",
  input_schema: {
    type: "object" as const,
    properties: {
      prompt: {
        type: "string" as const,
        description:
          "1–2 short sentences. Must contain each operand as its exact digits, IN THE ORDER GIVEN. Must NOT contain the answer as bare digits. Sentence ≤ 20 words, no word > 12 chars.",
      },
      hint: {
        type: "string" as const,
        description:
          "One short strategy nudge, ≤ 15 words. Start with a verb. Must NOT contain the answer.",
      },
    },
    required: ["prompt", "hint"],
  },
};

type Body = {
  skillId: SkillId;
  difficulty?: number;
  interests?: string[];
  seed?: number;
};

async function wrapWithStory(
  spec: GeneratedSpec,
  interests: string[]
): Promise<{ prompt: string; hint: string; latencyMs: number } | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
            `SAFETY: content must be appropriate for ages 8–11 — no violence, ` +
            `scary or romantic themes, real brands, or money beyond simple counting. ` +
            `Warm, wholesome, encouraging.\n` +
            `Strategy: ${spec.strategy}\n` +
            `Operands (use EXACTLY these digits, in this order): ${spec.operands.join(", ")}\n` +
            `Operation: ${spec.operation}\n` +
            `Interests: ${interests.length ? interests.join(", ") : "generic"}\n\n` +
            `Do NOT include the answer (${spec.answer}) anywhere in prompt or hint.\n` +
            `Sentence ≤ 20 words. Word ≤ 12 characters. Kid-friendly.`,
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

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  if (!body?.skillId) {
    return NextResponse.json({ error: "skillId required" }, { status: 400 });
  }
  const spec = generateSpec(body.skillId, body.difficulty, body.seed);

  const story = await wrapWithStory(spec, body.interests ?? []);
  if (story) {
    const v = verifyGeneratedPrompt(story.prompt, spec.operands, spec.answer, story.hint);
    if (v.ok) {
      const problem = specToProblem(spec, story);
      return NextResponse.json({
        problem,
        source: "live",
        verification: v,
        latencyMs: story.latencyMs,
      });
    }
    console.warn(
      `[generate] REJECTED live story for ${spec.skillId}: ${v.reasons.join("; ")}`
    );
    const problem = specToProblem(spec, storyTemplate(spec, body.interests ?? []));
    return NextResponse.json({
      problem,
      source: "template",
      verification: v,
      rejectedReason: v.reasons,
      latencyMs: story.latencyMs,
    });
  }

  const problem = specToProblem(spec, storyTemplate(spec, body.interests ?? []));
  return NextResponse.json({ problem, source: "template" });
}
