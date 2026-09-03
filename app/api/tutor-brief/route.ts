import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MOCK_SESSIONS } from "@/lib/mockSessions";
import { aggregate, Aggregate } from "@/lib/telemetry";
import { Session } from "@/lib/types";

export const runtime = "nodejs";

// The Tutor Brief is the "session intelligence" half of Live + AI:
// everything the child did between sessions, compressed into what a human
// tutor needs to read in 30 seconds before the next live lesson.

function fallbackBrief(a: Aggregate, studentName: string) {
  const weak = a.weakest;
  const mis = a.topMisconception;
  return {
    headline: `${studentName}: ${a.masteredPowers.length} power${
      a.masteredPowers.length === 1 ? "" : "s"
    } mastered · ${Math.round(a.accuracyFirstTry * 100)}% first-try · focus on ${weak?.name ?? "Fair Share"}`,
    focus: weak
      ? `${weak.name} (${weak.ccss.join(", ")}) — ${weak.firstTry}/${weak.attempts} first-try, ${weak.scaffolds} scaffold${weak.scaffolds === 1 ? "" : "s"} used.`
      : "Fair Share (3.OA.A.2)",
    pattern: mis
      ? `Recurring error: ${mis.label} (×${mis.count}) on ${mis.skill}. Student self-corrected with the skip-count scaffold each time — the concept is forming, not absent.`
      : "No repeated misconception detected.",
    suggested_opener: mis
      ? `Open with a "share vs. group" sort: 6 quick word problems, student only labels each as ÷ or × before solving any. Then one lattice problem as a confidence win.`
      : `Open with a quick review of ${weak?.name ?? "the weakest power"} using the same visual the app uses.`,
    wins: a.masteredPowers.length
      ? `Mastered ${a.masteredPowers.join(", ")} — reference these as "powers you already have" when the student stalls.`
      : `Strongest so far: ${a.strongest?.name ?? "Make-10"}. Name it as a power they already have.`,
    standards: [...new Set(a.bySkill.flatMap((s) => s.ccss))],
  };
}

async function generate(a: Aggregate, studentName: string) {
  const fb = fallbackBrief(a, studentName);
  if (!process.env.ANTHROPIC_API_KEY) return fb;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are preparing a 30-second pre-session brief for a human math tutor. The student (${studentName}, grade 3–5) practiced between sessions in a game. Below are pre-aggregated stats. Do NOT invent numbers.

${JSON.stringify(a, null, 2)}

Return STRICT JSON only:
{
  "headline": "one line: powers mastered, first-try %, and the single focus area",
  "focus": "the weakest Math Power with its Common Core codes and the numbers behind it",
  "pattern": "the recurring misconception in tutor language, with count, and whether the student self-corrected via scaffold",
  "suggested_opener": "one concrete 5-minute activity to open the live session, targeted at the pattern",
  "wins": "what to praise by name — mastered powers or strongest area",
  "standards": ["list of CCSS codes touched"]
}
Terse, professional, no fluff.`,
        },
      ],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b: any) => b.text)
      .join("");
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s === -1) return fb;
    const parsed = JSON.parse(text.slice(s, e + 1));
    return { ...fb, ...parsed };
  } catch {
    return fb;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessions: Session[] =
    Array.isArray(body.sessions) && body.sessions.length >= 3 ? body.sessions : MOCK_SESSIONS;
  const studentName: string = body.studentName || "Student";
  const a = aggregate(sessions);
  const brief = await generate(a, studentName);
  return NextResponse.json({
    brief,
    aggregate: a,
    source: sessions === MOCK_SESSIONS ? "seed" : "live",
  });
}
