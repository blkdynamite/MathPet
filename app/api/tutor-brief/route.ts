import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MOCK_SESSIONS } from "@/lib/mockSessions";
import { aggregate, Aggregate } from "@/lib/telemetry";
import { Session } from "@/lib/types";
import { guard, NoteSchema, budgetAllows, logUsage } from "@/lib/guard";
import { callTool } from "@/lib/llm";
import { TUTOR_SYSTEM, TUTOR_TOOL, buildTutorUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 10;

// The Tutor Brief is the "session intelligence" half of Live + AI: everything
// the child did between sessions, compressed into what a human tutor needs to
// read in 30 seconds before the next live lesson.

const BriefOut = z.object({
  headline: z.string().max(300),
  focus: z.string().max(400),
  pattern: z.string().max(400),
  suggested_opener: z.string().max(400),
  wins: z.string().max(300),
  standards: z.array(z.string().max(16)).max(20),
});
type Brief = z.infer<typeof BriefOut>;

function fallbackBrief(a: Aggregate, studentName: string): Brief {
  const weak = a.weakest;
  const mis = a.topMisconception;
  return {
    headline: `${studentName}: ${a.masteredPowers.length} power${a.masteredPowers.length === 1 ? "" : "s"} mastered · ${Math.round(
      a.accuracyFirstTry * 100
    )}% first-try · focus on ${weak?.name ?? "Fair Share"}`,
    focus: weak
      ? `${weak.name} (${weak.ccss.join(", ")}) — ${weak.firstTry}/${weak.attempts} first-try, ${weak.scaffolds} scaffold${weak.scaffolds === 1 ? "" : "s"} used.`
      : "Fair Share (3.OA.A.2)",
    pattern: mis
      ? `Recurring error: ${mis.label} (×${mis.count}) on ${mis.skill}. Student self-corrected with the scaffold each time — the concept is forming, not absent.`
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

export async function POST(req: NextRequest) {
  const g = await guard(req, NoteSchema);
  if (!g.ok) return g.res;
  const { studentName } = g.data;
  const sessions: Session[] = g.data.sessions.length >= 3 ? (g.data.sessions as Session[]) : MOCK_SESSIONS;
  const a = aggregate(sessions);
  const dataSource = sessions === MOCK_SESSIONS ? "seed" : "live";
  const fb = fallbackBrief(a, studentName);

  if (!budgetAllows()) return NextResponse.json({ brief: fb, aggregate: a, source: dataSource, llm: "budget" });

  const r = await callTool<unknown>({
    system: TUTOR_SYSTEM,
    user: buildTutorUser(a, studentName),
    tool: TUTOR_TOOL,
    maxTokens: 600,
    timeoutMs: 6000,
  });
  if (!r.ok) {
    logUsage("tutor-brief", "error", undefined, r.latencyMs, { reason: r.reason, status: r.status });
    return NextResponse.json({ brief: fb, aggregate: a, source: dataSource, llm: r.reason });
  }
  logUsage("tutor-brief", "live", r.usage, r.latencyMs);
  const parsed = BriefOut.safeParse(r.value);
  if (!parsed.success) return NextResponse.json({ brief: fb, aggregate: a, source: dataSource, llm: "schema" });
  return NextResponse.json({ brief: parsed.data, aggregate: a, source: dataSource, llm: "live" });
}
