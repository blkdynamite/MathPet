import { NextRequest, NextResponse } from "next/server";
import { MOCK_SESSIONS } from "@/lib/mockSessions";
import { aggregate, Aggregate } from "@/lib/telemetry";
import { Session } from "@/lib/types";
import { guard, NoteSchema, budgetAllows, logUsage } from "@/lib/guard";
import { callText } from "@/lib/llm";
import { PARENT_SYSTEM, buildParentUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 10;

// POST only. The old GET made a billable LLM call for every crawler,
// link-previewer, and uptime bot that touched the URL.

function fallbackText(a: Aggregate, petName: string) {
  const strong = a.strongest?.name ?? "Make-10";
  const weak = a.weakest?.name ?? "Fair Share";
  const mis = a.topMisconception;
  const times = mis ? (mis.count === 1 ? "once" : mis.count === 2 ? "twice" : `${mis.count} times`) : "";
  return `Your child is off to a great start with ${petName}! They've mastered **${
    a.masteredPowers.length ? a.masteredPowers.join(", ") : strong
  }** — solving on the first try about ${Math.round(a.accuracyFirstTry * 100)}% of the time across ${
    a.totalAttempts
  } problems and ${a.daysActive} day${a.daysActive === 1 ? "" : "s"} of practice.

The tricky spot right now is **${weak}**${
    mis ? ` — ${times} they ${mis.label.toLowerCase()}` : ""
  }. That's a very normal mix-up at this age. Try this tonight for five minutes: whenever a problem says "shared" or "each," pause and ask "are we splitting things apart or putting them together?"

They stuck with every hard problem and worked through the ladder each time — that persistence is worth more than any single answer. 🐾`;
}

export async function POST(req: NextRequest) {
  const g = await guard(req, NoteSchema);
  if (!g.ok) return g.res;
  const { petName } = g.data;
  const sessions: Session[] = g.data.sessions.length >= 3 ? (g.data.sessions as Session[]) : MOCK_SESSIONS;
  const a = aggregate(sessions);
  const dataSource = sessions === MOCK_SESSIONS ? "seed" : "live";

  if (!budgetAllows()) {
    return NextResponse.json({ summary: fallbackText(a, petName), aggregate: a, source: dataSource, llm: "budget" });
  }

  const r = await callText({
    system: PARENT_SYSTEM,
    user: buildParentUser(a, petName),
    maxTokens: 500,
    timeoutMs: 6000,
  });
  if (r.ok) {
    logUsage("parent-summary", "live", r.usage, r.latencyMs);
    return NextResponse.json({ summary: r.value, aggregate: a, source: dataSource, llm: "live" });
  }
  logUsage("parent-summary", "error", undefined, r.latencyMs, { reason: r.reason, status: r.status });
  return NextResponse.json({ summary: fallbackText(a, petName), aggregate: a, source: dataSource, llm: r.reason });
}
