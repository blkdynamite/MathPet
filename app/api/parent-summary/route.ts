import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MOCK_SESSIONS } from "@/lib/mockSessions";

export const runtime = "nodejs";

function aggregate(sessions = MOCK_SESSIONS) {
  const byConcept: Record<string, { total: number; correct: number; avgTime: number; hintRate: number }> = {};
  for (const s of sessions) {
    const c = (byConcept[s.concept] ??= { total: 0, correct: 0, avgTime: 0, hintRate: 0 });
    c.total += 1;
    c.correct += s.correct ? 1 : 0;
    c.avgTime += s.timeSec;
    c.hintRate += s.hintsUsed > 0 ? 1 : 0;
  }
  for (const c of Object.values(byConcept)) {
    c.avgTime = Math.round(c.avgTime / c.total);
    c.hintRate = Math.round((c.hintRate / c.total) * 100) / 100;
  }
  return byConcept;
}

const FALLBACK = `**How Sparky's trainer is doing this week**

Your child is off to a great start! They mastered place-value on the abacus with strong speed (about 10 seconds per problem, no hints) and picked up the Vedic ×11 pattern quickly — two correct on the first try. Nice pattern recognition!

The tricky spot right now is **division word problems** and **multi-step problems**. Twice in a row they went to multiply when the problem needed dividing — a classic mix-up at this age. Try this together tonight: whenever a problem says "shared" or "each," pause and ask "are we breaking things apart or putting them together?" Five minutes of that at bedtime does more than a whole worksheet.

They stuck with every problem, even the hard ones — that persistence is worth more than any single answer. 🐾`;

async function generate() {
  if (!process.env.ANTHROPIC_API_KEY) return FALLBACK;
  const stats = aggregate();
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You're writing a warm coaching note for the parent of a 4th grader who uses Numi, a pet-based math game.

Aggregated stats from the last 10 practice sessions:
${JSON.stringify(stats, null, 2)}

Write EXACTLY two short paragraphs of markdown. Paragraph 1: what's going well — name a specific concept, cite accuracy or speed. Paragraph 2: one specific sticking point + one concrete 5-minute suggestion the parent can do tonight. End with one warm sentence about the child's persistence. Warm, specific, no jargon. Do NOT include a title.`,
        },
      ],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();
    return text || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export async function GET() {
  const summary = await generate();
  return NextResponse.json({ summary, sessions: MOCK_SESSIONS });
}
