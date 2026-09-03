import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MOCK_SESSIONS } from "@/lib/mockSessions";
import { aggregate, Aggregate } from "@/lib/telemetry";
import { Session } from "@/lib/types";

export const runtime = "nodejs";

function fallbackText(a: Aggregate, petName: string) {
  const strong = a.strongest?.name ?? "Make-10";
  const weak = a.weakest?.name ?? "Fair Share";
  const mis = a.topMisconception;
  return `Your child is off to a great start with ${petName}! They've mastered **${
    a.masteredPowers.length ? a.masteredPowers.join(", ") : strong
  }** — solving on the first try about ${Math.round(a.accuracyFirstTry * 100)}% of the time across ${
    a.totalAttempts
  } problems and ${a.daysActive} day${a.daysActive === 1 ? "" : "s"} of practice.

The tricky spot right now is **${weak}**${
    mis ? ` — twice they ${mis.label.toLowerCase()}` : ""
  }. That's a very normal mix-up at this age. Try this tonight for five minutes: whenever a problem says "shared" or "each," pause and ask "are we splitting things apart or putting them together?"

They stuck with every hard problem and worked through the ladder each time — that persistence is worth more than any single answer. 🐾`;
}

async function generate(a: Aggregate, petName: string) {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackText(a, petName);
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You're writing a warm, specific coaching note for the parent of a 3rd–5th grader who practices math with a pet game called Numi. The pet is named ${petName}.

Pre-aggregated stats (do not invent numbers beyond these):
${JSON.stringify(a, null, 2)}

Write EXACTLY two short paragraphs of markdown, then one closing sentence.
Paragraph 1: what's going well — name the strongest "Math Power" by name, cite first-try accuracy or days active.
Paragraph 2: the one sticking point — name the weakest power and, if present, the top misconception in plain words — plus ONE concrete 5-minute thing the parent can do tonight (no worksheets).
Closing: one warm sentence about persistence.
No title. No jargon. No standards codes. Use **bold** for power names only.`,
        },
      ],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();
    return text || fallbackText(a, petName);
  } catch {
    return fallbackText(a, petName);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessions: Session[] =
    Array.isArray(body.sessions) && body.sessions.length >= 3 ? body.sessions : MOCK_SESSIONS;
  const petName: string = body.petName || "Sparky";
  const a = aggregate(sessions);
  const summary = await generate(a, petName);
  return NextResponse.json({
    summary,
    aggregate: a,
    source: sessions === MOCK_SESSIONS ? "seed" : "live",
  });
}

export async function GET() {
  const a = aggregate(MOCK_SESSIONS);
  const summary = await generate(a, "Sparky");
  return NextResponse.json({ summary, aggregate: a, source: "seed" });
}
