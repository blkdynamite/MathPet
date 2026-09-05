# Numi 🐾 — the between-sessions layer

**Math their pet learned first.** An AI pet-care game for grades 3–5 that turns two tutoring sessions a week into seven days of practice — and hands the human tutor a brief before every live lesson.

Built for the [Nerdy AI Hackathon](https://hackathon.nerdy.com) · prompt: *"an interactive, gamified math experience for elementary students… innovative mechanics that encourage steady progression and reward mastery of core numeracy skills."*

> **Live demo:** https://math-pet-theta.vercel.app · **Video:** _(link)_ · Runs with no API key — every AI call has a deterministic fallback.
>
> Kid surface: solve, get stuck (🤔), feed, shop, powers (⚡), parent/tutor view (👨‍👩‍👧). Judge/dev surface: add `?debug=1` for the 🎯 Adaptive and 🤖 AI toggles and provenance footers; `?demo=hungry` simulates coming back the next morning; `?demo=reset` wipes local state.

---

## The problem

Nerdy's consumer business is 84% of revenue and Learning Memberships fell 5% YoY to 29,100 (Q2 2026). A membership is ~2 live sessions a week. **The other five days, an 8-year-old has no reason to open Varsity Tutors, and the parent has no evidence the membership is working.**

Nerdy's own thesis for Live + AI is *"AI supports students between sessions; human tutors provide accountability."* Numi is that between-sessions layer for the youngest learners:

| Nerdy need | Numi mechanic |
|---|---|
| Daily engagement between sessions | Pet hunger + daily quest — the pet gets hungry overnight; 3 problems feed it |
| "Reward mastery," not just answers | **Math Powers** — mastery = clean solves on a *strategy*; the pet evolves when powers are mastered |
| Session intelligence for the tutor | **Tutor Brief** — a 30-second pre-session read generated from play telemetry, with Common Core codes and the recurring misconception |
| Parent can *see* value (retention) | **Parent Note** — warm, specific coaching note + one 5-minute thing to do tonight |
| Funnel into live tutoring | "Book a live session on {weakest power} →" in the parent view |
| Study Plan data | Every attempt logged as a typed `Session` row — `skillId`, `ccss`, `misconception`, `scaffoldUsed`, `timeSec` — on-device in this build |

---

## How I built this

This is an AI-hackathon entry and I built it with an AI pair (Claude Code) doing most of the typing; the commit history shows both names. What I owned:

- **The product thesis** — that the prize is Nerdy's retention gap, not "a math game," and that the Tutor Brief closing the loop back to a human is the differentiator.
- **The pedagogy** — the requirement that every problem be rendered through a real technique (Mental Abacus, Vedic shortcuts, Lattice), that hints sit *under* the question rather than inside it, and that a scaffold rung must teach a transferable strategy on a smaller number instead of re-asking the same question.
- **The engagement loop** — feed the pet after the second correct answer, evolution on mastery rather than XP, tactile feedback on every tap.
- **The engineering priorities** — after an adversarial review of my own repo I chose to spend the remaining days on guardrails, evals, and hardening rather than features, and to state honestly what the evals do and don't measure (see below).

What the AI pair did: scaffolding, most implementation, and the first drafts of the docs — reviewed and redirected by me at each step. If you want to know what I'd do differently, read *Known gaps* at the bottom; that list came from a review I asked for.

---

## The pedagogy

Most math apps drill. Numi teaches **the strategy behind the number** — 10 "Math Powers" drawn from three Eastern techniques:

| Family | Powers | Rendered as |
|---|---|---|
| **Mental Abacus** | Make-10, Abacus Vision | Interactive soroban — tap beads, 5s on top, 1s below, one column per place value |
| **Vedic** | ×11 Trick, Near-100 Trick, Round & Adjust, Partial Sums | Step-by-step pattern panels with the carry rule surfaced |
| **Lattice** | Lattice Master | 2×2 box grid with each cell labeled by its factors |
| **Number Sense** | Fair Share, Break-Apart, Two-Step | Word problems whose scaffolds teach a named, transferable move |

Every problem is tagged to Common Core (e.g. `3.OA.A.2`, `4.NBT.B.5`). **Mastery** = `MASTERY_THRESHOLD` clean solves (correct, first try, no scaffold). The demo uses 2 so a video can show it; production would use 3–5 with spaced review.

---

## The AI: three calls, one pattern, one guardrail contract

**Code does the math; the LLM does the language.** Answers are never LLM-generated; misconceptions are classified deterministically; stats are pre-aggregated. The model only writes prose over numbers the code already knows — and every kid-facing output is checked in code before display.

All model calls go through `lib/llm.ts` (one client, `maxRetries: 0`, a per-call timeout that actually aborts) using prompts from `lib/prompts.ts`. **The evals import the same prompts and the same client**, so an eval run measures what production runs.

### Structured output everywhere
Every route that needs JSON uses Anthropic **tool-use with a forced tool** and validates the tool input with zod. There is no free-text JSON parsing anywhere in `app/api`.

### `/api/generate` — deterministic numbers, LLM story
`lib/generate.ts` has 10 seedable generators, one per power. Claude wraps the operands in a 1–2 sentence story around the child's chosen interests. `verifyGeneratedPrompt` then requires every operand to appear as exact digits **in order**, the answer to be absent from prompt and hint, and grade-3 reading level. A rejected story falls back to a code-built story template (`storyTemplate`) that uses the same interests — so AI mode never shows a bare equation, with or without a key.

### `/api/scaffold` — misconception-aware ladder
On a wrong answer the classifier in `lib/misconceptions.ts` runs first (`multiplied_instead_of_divided`, `added_instead_of_multiplied`, `skipped_a_step`, `forgot_to_carry`, `off_by_one`, `place_value_slip`, `digit_reversal`, `help_requested`). The tag goes to Claude, which must name that error and target it with the first rung. Then `verifyScaffold`:

- **Rejects at runtime** if any rung's stated answer disagrees with the arithmetic in its question, or the shape is malformed. The expression immediately before the rung's `?` is authoritative; a parenthetical hint elsewhere cannot "verify" a wrong claim (regression-tested).
- **Reports, but does not reject:** answer leakage in `bridge_back`, reading level, and — important — rungs with no extractable arithmetic ("how many bottom beads for 3?") are `unverified` and allowed through.

For hand-authored problems the server resolves the correct answer from `lib/problems.ts` and ignores the client's claim. Rejected ladders fall back to hand-written scaffolds, with the classified misconception's diagnosis line, or to a strategy-matched sample scaffold for AI-generated problems.

### `/api/parent-summary` and `/api/tutor-brief`
`lib/telemetry.ts` `aggregate()` is the only thing the model sees. Parent Note is prose; Tutor Brief is a forced tool with `{ headline, focus, pattern, suggested_opener, wins, standards[] }`. Both prefer real on-device sessions and use seed data under 3 attempts.

---

## What the evals actually measure (read this before the numbers)

`npm run test:verify` — **69 unit checks**, offline: the arithmetic extractor and evaluator, the rung checker (including the false-positive regression), the story verifier (operand order, duplicate operands, leakage in prompt and hint), every generator's shape and determinism, every story template against the verifier (10 skills × 5 seeds × 5 interest sets), and the adaptive selector.

`npm run eval:generate` — offline: 200 deterministic specs (10 skills × 20 seeds) must be arithmetic-consistent and their code-built templates must pass the verifier. **Latest: 200/200 and 200/200.** This proves the generators and the verifier agree with each other. It does not exercise the model.

`npm run eval:scaffold` — offline: the 16 hand-written fallback scaffolds. **Latest: 16/16 arithmetic clean, 0 failed rungs, 16/16 no bridge leak, 16/16 reading level, 16/16 classifier tags correct, and 23/32 rungs code-verified** — the other 9 are word-only rungs the verifier cannot re-derive and therefore passes as `unverified`. That is the honest limit of the guardrail today.

**The live passes have not been run.** Both `evals/*.results.json` files carry `"live": null`. With `ANTHROPIC_API_KEY` set, `npm run eval` also generates 20 scaffolds across 8 misconception tags and 90 stories across skills × seeds × interest sets through the production prompts, scores them with the same verifiers, and records latency p50/p95. I did not have a key available at submission time, so **no claim in this README is evidence that the model's output passes the verifier at any particular rate.** The claim is narrower: whatever the model produces is checked, and what fails is replaced.

---

## Security and spend controls (`lib/guard.ts`)

Four public routes call a paid model. Each one:

- caps the body at 32 KB before parsing and validates it with **zod** — enums for everything that reaches a prompt (`skillId`, `interests`, `misconception`, `technique`), length caps on free text (`petName` ≤ 24, question ≤ 300), bounded arrays;
- puts instructions in the **system** turn and passes request data inside a delimited `<data>` block the system prompt tells the model to treat as untrusted;
- applies a **per-IP token bucket** (30/min) and a **daily call budget** (`LLM_DAILY_CALL_CAP`, default 1000) that hard-stops LLM calls in code, independent of the console limit;
- logs one structured `llm_call` line per request with input/output tokens, latency, source, and the budget snapshot;
- is **POST-only** (the old `GET /api/parent-summary` billed a model call to every crawler).

**Known limitation, stated plainly:** the rate limiter and budget counters are in-process `Map`s. On serverless, each warm instance has its own, so a distributed caller can exceed the nominal limits. This stops the one-laptop loop and makes spend observable; production swaps the `Map` for Vercel KV / Upstash behind the same interface.

---

## Stack

Next.js 14.2.35 (App Router) · Tailwind · Framer Motion · `@anthropic-ai/sdk` 0.124 · zod · React state + `localStorage` (no database in this build) · `next/font` for Fredoka (self-hosted).

```bash
npm install
cp .env.local.example .env.local   # optional: ANTHROPIC_API_KEY
npm run dev                        # http://localhost:3000
npm run lint && npm run test:verify && npm run eval
```

CI (`.github/workflows/ci.yml`) runs lint, unit checks, the offline generation eval, and the build on every push and PR.

```
app/
  page.tsx                 game loop + phase machine (answering | celebrating | scaffolding | loading)
  api/generate             numbers in code → story via forced tool → verified → template fallback
  api/scaffold             classifier → forced tool → verifier → hand-written fallback
  api/parent-summary       prose note over aggregated telemetry (POST only)
  api/tutor-brief          forced-tool brief over the same aggregate
lib/
  prompts.ts               every prompt + tool schema (routes AND evals import from here)
  llm.ts                   one client, one call helper, typed error → reason codes
  guard.ts                 zod schemas, body cap, rate limit, daily budget, usage log
  verify.ts                rung checker, story verifier, reading heuristic
  generate.ts              10 seeded generators + storyTemplate()
  misconceptions.ts        deterministic classifier
  nextProblem.ts           adaptive selector (spaced review every 4th, weakest unmastered otherwise)
  skills.ts / telemetry.ts / problems.ts / scaffolds.ts / shop.ts / sound.ts
evals/
  verify.test.ts           69 offline checks
  scaffold.eval.ts         fallbacks offline + 20 live cases when a key is set
  generate.eval.ts         200 specs offline + 90 live stories when a key is set
```

---

## How this plugs into Nerdy

**Study Plan.** Each `Session` row is already shaped for it. Study Plan tracks lessons, practice, and live sessions; Numi is the K-5 practice feed with standards attached — once the rows leave the device (see gaps).

**Live + AI.** The Tutor Brief is session intelligence generated *before* the session, from play. After the session, the tutor's notes could drive the next day's selector — the human closes the loop the AI opened.

**Self-serve funnel.** Numi is a free, no-login top of funnel. The parent sees a gap named in plain English and a one-tap "book a session on Fair Share" — a warm lead with a diagnosis attached.

---

## Known gaps

From an adversarial review I ran against this repo before submitting. Fixed items are marked; the rest are the honest to-do list.

| Gap | Status |
|---|---|
| Public LLM routes had no validation, rate limit, budget, or usage logging | ✅ fixed (`lib/guard.ts`) |
| Client strings interpolated into prompts; safety text in the user turn | ✅ fixed (system prompts, `<data>` blocks, enums) |
| Two kid-facing routes parsed free-text JSON | ✅ fixed (forced tool-use everywhere) |
| Eval prompts were a copy of production, not an import | ✅ fixed (`lib/prompts.ts`) |
| Verifier accepted any sub-expression equal to the claimed answer | ✅ fixed (expression before `?` is authoritative; regression test) |
| Inputs stayed live during the celebration → double-tap double-credited | ✅ fixed (phase machine + native `<fieldset disabled>`) |
| AI-mode fetch double-fired, no cancellation, no `.catch` | ✅ fixed (sequence id + `AbortController`) |
| HUD overflowed at 375 px; dev toggles on the kid surface | ✅ fixed (two rows, 44 px targets, `?debug=1`) |
| Display font never loaded (`@import` after `@tailwind`) | ✅ fixed (`next/font`) |
| `next` 14.2.15 shipped a critical advisory; lint had no config; no CI; no LICENSE | ✅ fixed |
| Answers are graded in the browser; mastery/coins live in `localStorage` | ⬜ needs a server-side problem cache and grading endpoint |
| AI-generated problems' answers are trusted from the client (no server record) | ⬜ same fix as above |
| 9 of 32 fallback rungs are word-only and pass as `unverified` | ⬜ either verify semantically or reject at runtime |
| Live eval passes never run; `results.json` has `live: null` | ⬜ needs a key; ~110 Haiku calls |
| `app/page.tsx` is ~550 lines with the economy logic inline and untested | ⬜ pure `gameReducer` + hooks + reducer tests |
| Modals lack dialog semantics / focus trap; no `prefers-reduced-motion` for Framer | ⬜ one `<Modal>` on `<dialog>`; `MotionConfig` |
| Reading-level check is a word/sentence-length heuristic, not Flesch-Kincaid | ⬜ |
| Persisted state has no version/migration | ⬜ |
| Sessions can't be joined to anything (no learner/device id) | ⬜ |

## Built vs. planned

| Feature | Demo | Production |
|---|---|---|
| 10 Math Powers across 3 Eastern techniques | ✅ | + spaced review tuning |
| Mastery tracking + pet evolution | ✅ | server-side |
| Misconception classifier → targeted scaffold, verified in code | ✅ live + fallback | semantic verification of word-only rungs |
| Deterministic generation + LLM story via forced tool-use, verified | ✅ | server-side problem cache |
| Adaptive selector | ✅ | per-account, tutor-steerable |
| Hunger / daily quest / streak / Star Coins / shop | ✅ | push at hunger 60% |
| Parent Note + Tutor Brief | ✅ real LLM over real device telemetry | weekly email; injected into the Live Learning Platform pre-session |
| Guardrails: zod, rate limit, budget, usage logs | ✅ in-process | KV-backed |
| Evals | ✅ offline; live pass wired, not run | CI gate on live pass rate |
| Auth / multi-device / Study Plan sync | ❌ | Supabase → Nerdy |
