import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SCAFFOLDS } from "@/lib/scaffolds";
import { Scaffold } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM = `You are Sparky, a warm and encouraging pet math tutor for a 4th grader.
When a student gets a problem wrong, generate a 2-step scaffold ladder of EASIER
prerequisite problems that build the concept up. Each step must be solvable in one
operation. Use the preferred pedagogical technique where relevant:
- abacus: group by 5s and 10s, place value
- vedic: pattern shortcuts (x11 = split digits + add middle, base-10 complements)
- lattice: split into tens/ones grid
- input: plain arithmetic

Return STRICT JSON only, no prose:
{
  "diagnosis": "one friendly sentence naming the likely misconception",
  "encouragement": "one warm sentence",
  "scaffold": [
    { "question": "...", "answer": <number>, "technique_note": "..." },
    { "question": "...", "answer": <number>, "technique_note": "..." }
  ],
  "bridge_back": "one sentence connecting scaffold back to the original problem"
}
Do NOT reveal the original answer. Keep language for age 9.`;

async function callClaude(input: {
  problemId: string;
  originalQuestion: string;
  correctAnswer: number;
  userAnswer: number;
  concept: string;
  technique: string;
}): Promise<Scaffold | null> {
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
          }),
        },
      ],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1) return null;
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { problemId } = body;

  // Race the live call vs. a 2.5s timeout; whichever wins, ship it.
  const live = callClaude(body);
  const fallback = new Promise<Scaffold | null>((resolve) =>
    setTimeout(() => resolve(null), 2500)
  );
  const result = await Promise.race([live, fallback]);

  if (result) return NextResponse.json({ ...result, source: "live" });
  const fb = SCAFFOLDS[problemId];
  if (fb) return NextResponse.json({ ...fb, source: "fallback" });
  return NextResponse.json({
    diagnosis: "Not quite — let's try again.",
    encouragement: "Every mistake is a step forward!",
    scaffold: [],
    bridge_back: "Give it another shot.",
    source: "empty",
  });
}
