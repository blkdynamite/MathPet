// One client, one call helper, one error policy — shared by every route and
// by the evals, so production and measurement can't drift.
//
//   - Singleton client, maxRetries: 0 (a retry on a 2.5 s budget is a second
//     billed call nobody reads; the route falls back instead)
//   - Per-call timeout that actually aborts the request (not Promise.race,
//     which returned the fallback while the SDK kept running and billing)
//   - Forced tool-use for structured output; no text.indexOf("{") parsing
//   - Typed error chain → short reason codes that get logged with usage

import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./prompts";

let client: Anthropic | null = null;
export function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ maxRetries: 0 });
  return client;
}

export type Usage = { input_tokens?: number; output_tokens?: number };

export type LlmOk<T> = { ok: true; value: T; usage: Usage; latencyMs: number; stopReason: string | null };
export type LlmErr = { ok: false; reason: string; status?: number; latencyMs: number };
export type LlmResult<T> = LlmOk<T> | LlmErr;

function classify(err: unknown): { reason: string; status?: number } {
  if (err instanceof Anthropic.RateLimitError) return { reason: "rate_limited", status: 429 };
  if (err instanceof Anthropic.AuthenticationError) return { reason: "auth", status: 401 };
  if (err instanceof Anthropic.APIError) return { reason: `api_${err.status ?? "unknown"}`, status: err.status };
  if (err instanceof Error && /timeout|abort/i.test(err.message)) return { reason: "timeout" };
  return { reason: "network" };
}

/** Call Claude with a forced tool and return the tool's typed input. */
export async function callTool<T>(opts: {
  system: string;
  user: string;
  tool: Anthropic.Tool;
  maxTokens: number;
  timeoutMs: number;
}): Promise<LlmResult<T>> {
  const c = getClient();
  const t0 = Date.now();
  if (!c) return { ok: false, reason: "no_key", latencyMs: 0 };
  try {
    const msg = await c.messages.create(
      {
        model: MODEL,
        max_tokens: opts.maxTokens,
        system: opts.system,
        tools: [opts.tool],
        tool_choice: { type: "tool", name: opts.tool.name },
        messages: [{ role: "user", content: opts.user }],
      },
      { timeout: opts.timeoutMs }
    );
    const latencyMs = Date.now() - t0;
    if (msg.stop_reason === "max_tokens") {
      return { ok: false, reason: "max_tokens", latencyMs };
    }
    const block = msg.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (!block) return { ok: false, reason: "no_tool_use", latencyMs };
    return { ok: true, value: block.input as T, usage: msg.usage, latencyMs, stopReason: msg.stop_reason };
  } catch (err) {
    return { ok: false, ...classify(err), latencyMs: Date.now() - t0 };
  }
}

/** Call Claude for prose (parent note). */
export async function callText(opts: {
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs: number;
}): Promise<LlmResult<string>> {
  const c = getClient();
  const t0 = Date.now();
  if (!c) return { ok: false, reason: "no_key", latencyMs: 0 };
  try {
    const msg = await c.messages.create(
      {
        model: MODEL,
        max_tokens: opts.maxTokens,
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      },
      { timeout: opts.timeoutMs }
    );
    const latencyMs = Date.now() - t0;
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) return { ok: false, reason: "empty", latencyMs };
    return { ok: true, value: text, usage: msg.usage, latencyMs, stopReason: msg.stop_reason };
  } catch (err) {
    return { ok: false, ...classify(err), latencyMs: Date.now() - t0 };
  }
}
