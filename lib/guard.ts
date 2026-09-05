// Request guard for the four public routes that call a paid LLM.
//
//   1. Body size cap (before parsing)
//   2. zod validation — enums for anything that reaches a prompt, length caps on
//      free text, bounded arrays
//   3. Per-IP token-bucket rate limit
//   4. Daily call budget (hard stop in code, independent of the console limit)
//   5. Usage logging (tokens per call) so spend is observable
//
// KNOWN LIMITATION (documented, not hidden): the rate limiter and budget are
// in-process Maps. On serverless each warm instance has its own counters, so a
// distributed attacker can exceed the nominal limits by spreading across
// instances. This stops the "one laptop in a loop" case and makes spend
// visible; production replaces the Map with a shared store (Vercel KV /
// Upstash Ratelimit) behind the same interface below.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SKILLS } from "./skills";
import { MISCONCEPTION_LABELS } from "./misconceptions";

// ---------------------------------------------------------------------------
// Enums derived from the source of truth, so a new skill or misconception
// can't be forgotten here.
const SKILL_IDS = SKILLS.map((s) => s.id) as [string, ...string[]];
const MISCONCEPTIONS = Object.keys(MISCONCEPTION_LABELS) as [string, ...string[]];
export const INTERESTS = ["space", "animals", "sports", "gaming", "art", "music"] as const;
const TECHNIQUES = ["abacus", "vedic", "lattice", "input"] as const;

const shortText = (max: number) => z.string().trim().min(1).max(max);
const finite = z.number().finite();

export const SessionSchema = z.object({
  ts: finite,
  problemId: z.string().max(48),
  skillId: z.enum(SKILL_IDS),
  concept: z.string().max(48),
  ccss: z.array(z.string().max(16)).max(8),
  technique: z.enum(TECHNIQUES),
  correct: z.boolean(),
  firstTry: z.boolean(),
  scaffoldUsed: z.boolean(),
  misconception: z.enum(MISCONCEPTIONS).optional(),
  userAnswer: finite.nullable().optional(),
  timeSec: z.number().int().min(0).max(3600),
});

export const GenerateSchema = z.object({
  skillId: z.enum(SKILL_IDS),
  difficulty: z.number().int().min(1).max(5).optional(),
  interests: z.array(z.enum(INTERESTS)).max(3).default([]),
  seed: z.number().int().min(0).max(2 ** 31).optional(),
});

export const ScaffoldSchema = z.object({
  problemId: z.string().regex(/^[a-z0-9-]{1,48}$/),
  skillId: z.enum(SKILL_IDS).optional(),
  originalQuestion: shortText(300),
  correctAnswer: finite,
  // "I'm stuck" sends null (NaN → null over JSON)
  userAnswer: finite.nullable().optional(),
  concept: z.string().max(48),
  technique: z.enum(TECHNIQUES),
  misconception: z.enum(MISCONCEPTIONS).default("unknown"),
});

export const NoteSchema = z.object({
  sessions: z.array(SessionSchema).max(200).default([]),
  petName: z.string().trim().max(24).default("Sparky"),
  studentName: z.string().trim().max(40).default("Student"),
});

// ---------------------------------------------------------------------------
const MAX_BODY_BYTES = 32 * 1024;

export async function parseBody<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; res: NextResponse }> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) {
    return { ok: false, res: NextResponse.json({ error: "body too large" }, { status: 413 }) };
  }
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, res: NextResponse.json({ error: "invalid JSON" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "invalid request", issues: parsed.error.issues.slice(0, 5) },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

// ---------------------------------------------------------------------------
// Per-IP token bucket. 30 requests/min sustained, burst 30.
const RATE_CAPACITY = 30;
const RATE_REFILL_PER_MS = RATE_CAPACITY / 60_000;
const buckets = new Map<string, { tokens: number; at: number }>();

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = clientIp(req);
  const now = Date.now();
  const b = buckets.get(ip) ?? { tokens: RATE_CAPACITY, at: now };
  b.tokens = Math.min(RATE_CAPACITY, b.tokens + (now - b.at) * RATE_REFILL_PER_MS);
  b.at = now;
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return NextResponse.json(
      { error: "rate limited", retryAfterSec: 10 },
      { status: 429, headers: { "retry-after": "10" } }
    );
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  // Opportunistic GC so the map can't grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now - v.at > 120_000) buckets.delete(k);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Daily LLM call budget — a hard stop in code. Env-tunable.
const DAILY_CAP = Number(process.env.LLM_DAILY_CALL_CAP ?? 1000);
let budgetDay = "";
let budgetUsed = 0;

export function budgetAllows(): boolean {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== budgetDay) {
    budgetDay = day;
    budgetUsed = 0;
  }
  if (budgetUsed >= DAILY_CAP) return false;
  budgetUsed += 1;
  return true;
}

export function budgetSnapshot() {
  return { day: budgetDay, used: budgetUsed, cap: DAILY_CAP };
}

// ---------------------------------------------------------------------------
// One structured log line per LLM call — the thing you grep to find out what
// the day cost. Vercel's log drain picks these up as-is.
export function logUsage(
  route: string,
  source: string,
  usage: { input_tokens?: number; output_tokens?: number } | undefined,
  latencyMs: number,
  extra: Record<string, unknown> = {}
) {
  console.log(
    JSON.stringify({
      evt: "llm_call",
      route,
      source,
      model_in: usage?.input_tokens ?? null,
      model_out: usage?.output_tokens ?? null,
      latencyMs,
      budget: budgetSnapshot(),
      ...extra,
    })
  );
}

// Standard pre-flight for every LLM route: rate limit, then body validation.
export async function guard<T extends z.ZodTypeAny>(req: NextRequest, schema: T) {
  const limited = rateLimit(req);
  if (limited) return { ok: false as const, res: limited };
  return parseBody(req, schema);
}
