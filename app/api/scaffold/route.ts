import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SCAFFOLDS } from "@/lib/scaffolds";
import { Scaffold } from "@/lib/types";
import { MISCONCEPTION_DIAGNOSIS, Misconception } from "@/lib/misconceptions";
import { verifyScaffold } from "@/lib/verify";
import { SKILL_TO_SAMPLE_SCAFFOLD } from "@/lib/generate";
import { SkillId } from "@/lib/skills";

export const runtime = "nodejs";

const SYSTEM = `You are Sparky, a warm and encouraging pet math tutor for a 4th grader.
SAFETY: all content must be appropriate for ages 8–11 — no violence, scary or
romantic themes, real brands, or money beyond simple counting. Never criticize
the child; treat every mistake as a normal step in learning.
When a student gets a problem wrong, generate a 2-step scaffold ladder of EASIER
prerequisite problems that build the concept up. Each step must be solvable in one
operation. Use the preferred pedagogical technique where relevant:
- abacus: group by 5s and 10s, place value
- vedic: pattern shortcuts (x11 = split digits + add middle, base-10 complements)
- lattice: split into tens/ones grid
- input: plain arithmetic

Return STRICT JSON only, no prose. Every rung MUST contain an arithmetic
expression that evaluates exactly to its "answer" field (e.g. "12 × 5 = ?"
with answer 60). Sentences ≤ 20 words, no word > 12 characters. Do not
restate the original answer as a bare number in "bridge_back".

Shape:
{
  "diagnosis": "one friendly sentence naming the likely misconception",
  "encouragement": "one warm sentence",
  "scaffold": [
    { "question": "...", "answer": <number>, "technique_note": "..." },
    { "question": "...", "answer": <number>, "technique_note": "..." }
  ],
  "bridge_back": "one sentence pointing back to the original — never re-stating its answer"
}
Do NOT reveal the original answer. Keep language for age 9.`;

type Input = {
  problemId: string;
  originalQuestion: string;
  correctAnswer: number;
  userAnswer: number;
  concept: string;
  technique: string;
  misconception?: Misconception;
  skillId?: SkillId;
};

async function callClaude(input: Input): Promise<Scaffold | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 700,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            originalQuestion: input.originalQuestion,
            correctAnswer: input.correctAnswer,
            userAnswer: input.userAnswer,
            concept: input.concept,
            preferredTechnique: input.technique,
            detectedMisconception: input.misconception ?? "unknown",
            instruction:
              "If detectedMisconception is not 'unknown', your diagnosis MUST name that specific error in kid language and the first scaffold step MUST target it directly.",
          }),
        },
      ],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s === -1) return null;
    return JSON.parse(text.slice(s, e + 1));
  } catch {
    return null;
  }
}

function fallbackFor(
  problemId: string,
  skillId?: SkillId,
  misconception?: Misconception
): Scaffold | null {
  // Direct hit for hand-authored problems.
  let fb = SCAFFOLDS[problemId];
  // AI-generated problem (id starts with "gen-") — fall back by skill so the
  // strategy is still right even if the numbers differ.
  if (!fb && skillId && SKILL_TO_SAMPLE_SCAFFOLD[skillId]) {
    fb = SCAFFOLDS[SKILL_TO_SAMPLE_SCAFFOLD[skillId]];
  }
  if (!fb) return null;
  const diagnosis =
    misconception && misconception !== "unknown"
      ? MISCONCEPTION_DIAGNOSIS[misconception]
      : fb.diagnosis;
  return { ...fb, diagnosis };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Input & { problemId: string; skillId?: SkillId };
  const { problemId, correctAnswer, misconception, skillId } = body;

  const live = callClaude(body);
  const timeout = new Promise<Scaffold | null>((resolve) => setTimeout(() => resolve(null), 2500));
  const raw = await Promise.race([live, timeout]);

  // GUARDRAIL: if the model returned something, verify it. If verification
  // fails, we swap in the hand-verified fallback and record why.
  if (raw) {
    const v = verifyScaffold(raw, correctAnswer);
    if (v.ok) {
      return NextResponse.json({ ...raw, source: "live", verification: v });
    }
    console.warn(
      `[scaffold] REJECTED live output for ${problemId}: ${v.reasons.join("; ")}`
    );
    const fb = fallbackFor(problemId, skillId, misconception);
    if (fb)
      return NextResponse.json({
        ...fb,
        source: "fallback",
        verification: v,
        rejectedReason: v.reasons,
      });
  }

  const fb = fallbackFor(problemId, skillId, misconception);
  if (fb) return NextResponse.json({ ...fb, source: "fallback" });

  return NextResponse.json({
    diagnosis: "Not quite — let's try again.",
    encouragement: "Every mistake is a step forward!",
    scaffold: [],
    bridge_back: "Give it another shot.",
    source: "empty",
  });
}
