# Numi 🐾 — the between-sessions layer

**Math their pet learned first.** An AI pet-care game for grades 3–5 that turns two tutoring sessions a week into seven days of engagement — and hands the human tutor a brief before every live lesson.

Built for the [Nerdy AI Hackathon](https://hackathon.nerdy.com) · prompt: *"an interactive, gamified math experience for elementary students… innovative mechanics that encourage steady progression and reward mastery of core numeracy skills."*

> **Live demo:** _(URL added on deploy)_ · **Video:** _(link)_ · Works with no API key — every AI call has a deterministic fallback.

---

## The problem we're actually solving

Nerdy's consumer business is 84% of revenue and Learning Memberships fell 5% YoY to 29,100 (Q2 2026). A membership is ~2 live sessions a week. **The other five days, an 8-year-old has no reason to open Varsity Tutors, and the parent has no evidence the membership is working.**

Nerdy's own thesis for Live + AI is *"AI supports students between sessions; human tutors provide accountability."* Numi is that between-sessions layer for the youngest learners:

| Nerdy need | Numi mechanic |
|---|---|
| Daily engagement between sessions | Pet hunger + daily quest — the pet gets hungry overnight; 3 problems feed it |
| "Reward mastery," not just answers | **Math Powers** skill map — mastery = clean solves on a *strategy*; the pet evolves when powers are mastered |
| Session intelligence for the tutor | **Tutor Brief** — a 30-second pre-session read generated from play telemetry, with Common Core codes and the recurring misconception |
| Parent can *see* value (retention) | **Parent Note** — warm, specific coaching note + one 5-minute thing to do tonight |
| Funnel into live tutoring | "Book a live session on {weakest power} →" CTA in the parent view |
| Study Plan data | Every attempt logged as a typed `Session` row — `skillId`, `ccss`, `misconception`, `scaffoldUsed`, `timeSec` |

---

## What's in the demo (90 seconds)

1. Come back the next morning (`?demo=hungry`) — Sparky is hungry, asks for 3 problems.
2. Solve two **Make-10** problems → power mastered → **pet evolves** to a Sprite.
3. Get a division problem wrong on purpose → the classifier tags `multiplied_instead_of_divided` → the **scaffold ladder** builds two easier prerequisite problems that teach *fair share* → nail the original.
4. Open **⚡ Math Powers** — the skill map with Common Core codes.
5. Open the parent view → **Parent Note** tab, then **Tutor Brief** tab → "Book a live session on Fair Share →".

---

## The pedagogy

Most math apps drill. Numi teaches **the strategy behind the number** — 10 "Math Powers" drawn from three Eastern techniques:

| Family | Powers | Rendered as |
|---|---|---|
| **Mental Abacus** | Make-10, Abacus Vision | Interactive soroban — tap beads, 5s on top, 1s below, one column per place value |
| **Vedic** | ×11 Trick, Near-100 Trick, Round & Adjust, Partial Sums | Step-by-step pattern panels with the carry rule surfaced |
| **Lattice** | Lattice Master | 2×2 box grid with each cell labeled by its factors |
| **Number Sense** | Fair Share, Break-Apart, Two-Step | Word problems whose scaffolds teach a named, transferable move |

Every problem is tagged to Common Core (e.g. `3.OA.A.2`, `4.NBT.B.5`) so the Tutor Brief speaks the tutor's language.

**Mastery**, not accuracy: a power is mastered after `MASTERY_THRESHOLD` *clean solves* (correct, first try, no scaffold). The demo uses 2 so a video can show it; production would use 3–5 with spaced review.

---

## The AI (three calls, one pattern)

**Code does the math; the LLM does the language.** Answers are never LLM-generated; misconceptions are classified deterministically; stats are pre-aggregated. The model only writes prose over verified numbers.

### 0. Guardrail: nothing unverified reaches a child (`lib/verify.ts`, `/api/scaffold`)

Every LLM-generated scaffold is re-derived in code before it is displayed. `verifyScaffold` extracts arithmetic expressions from each rung's question text, evaluates them, and rejects the ladder if any rung's stated answer disagrees. Rejected ladders fall back to the hand-verified `SCAFFOLDS[problemId]`. Rejections are logged with the reason. This is the invariant that lets us put a language model in front of a nine-year-old.

- **Runtime:** every `/api/scaffold` response passes through the verifier.
- **Offline suite:** `npm run test:verify` (21 checks) and `npm run eval` (scores JSON validity, rung correctness, answer leakage, reading level, and misconception addressing across all fallbacks and — with `ANTHROPIC_API_KEY` set — 20 live cases). Results committed at [`evals/results.json`](evals/results.json); see [`evals/README.md`](evals/README.md) for the contract.

Latest offline run: **16/16 JSON valid · 16/16 arithmetic clean · 0 failed rungs · 16/16 no bridge leak · 16/16 reading level ok**.

### 0.5. Deterministic problem generation with LLM story wrapping (`lib/generate.ts`, `/api/generate`)

**Code picks the numbers. The LLM writes the story. Everything gets verified before display.**

- `lib/generate.ts` — 10 seedable generators, one per Math Power. Each returns a `GeneratedSpec` with operands, operation, ground-truth answer, CCSS tags, and a safe template prompt.
- `/api/generate` — Claude Haiku 4.5 via **tool-use** (Anthropic structured outputs) wraps the spec in a 1–2 sentence story around the child's interests. No `text.indexOf("{")` parsing.
- `verifyGeneratedPrompt(prompt, operands, answer, hint)` — every operand must appear as its exact digits **in the order given**, the answer must not leak as a bare number in the prompt *or* the hint, and reading level must clear the grade-3 heuristic. A rejected story falls back to `spec.templatePrompt` (which is generated by code, so it always passes).
- UI: 🤖 AI chip in the HUD flips between the hand-crafted 15 (safe for the video) and live LLM generation. `?ai=1` starts in AI mode; a small footer under each question shows whether the LLM story survived verification or the template was used.

Latest **`npm run eval:generate`** (offline, 200 specs across 10 skills × 20 seeds):

- **Arithmetic consistent: 200/200 (100%)**
- **Template passes verifier: 200/200 (100%)**
- Per-skill: 10/10 skills at 20/20

Set `ANTHROPIC_API_KEY` and re-run to score the live tool-use path (90 stories across skills × seeds × interest sets, with latency p50/p95). Results write to `evals/generate.results.json`.

### 1. Misconception classifier → scaffold ladder (`lib/misconceptions.ts`, `/api/scaffold`)
On a wrong answer, code classifies the error first:

| Tag | Detected when |
|---|---|
| `multiplied_instead_of_divided` | answer = a × b on a division word problem |
| `added_instead_of_multiplied` | answer = a + b on a multiplication problem |
| `skipped_a_step` | answer = the intermediate result of a two-step problem, or tens×tens only on a lattice |
| `forgot_to_carry` | ×11 answer with the middle sum ≥ 10 left uncarried |
| `off_by_one`, `place_value_slip`, `digit_reversal` | arithmetic distance / digit pattern |

The tag is passed to Claude Haiku 4.5, which must name that error in kid language and target it with the first rung. Returns strict JSON:

```json
{
  "diagnosis": "You multiplied — but 'sharing into groups' means DIVIDE.",
  "encouragement": "Let's build up to it with a smaller number.",
  "scaffold": [
    { "question": "Warm up: how many groups of 6 fit in 12?", "answer": 2, "technique_note": "Division = 'how many groups fit'." },
    { "question": "Now double it: how many groups of 6 fit in 24?", "answer": 4, "technique_note": "Twice the total → twice the groups." }
  ],
  "bridge_back": "So 24 ÷ 6 = 4. Sparky needs 4 asteroids!"
}
```

The live call races a 2.5 s timeout against a hand-written fallback per problem (`lib/scaffolds.ts`); the fallback's diagnosis is swapped for the classified misconception's line. **The demo cannot fail on an API call.**

### 2. Parent Note (`/api/parent-summary`)
`aggregate(sessions)` → strongest/weakest power, first-try rate, top misconception, days active → Claude writes two paragraphs + one concrete 5-minute activity. No standards codes, no jargon.

### 3. Tutor Brief (`/api/tutor-brief`)
Same aggregate → strict JSON `{ headline, focus, pattern, suggested_opener, wins, standards[] }` written for a tutor with 30 seconds before a live session. This is the *session intelligence* half of Live + AI, generated from play instead of from a transcript.

Both prefer the **real** `Session[]` from this device and fall back to seed data below 3 attempts.

---

## Retention mechanics

- **Hunger** — `lastFedAt` timestamp; the pet is starving 8 h after the last correct answer. Each correct answer feeds a third. Loss aversion + a daily reason to return.
- **Evolution** — Hatchling → Sprite (1 power) → Wizard (3) → Sage (5). Driven by mastery, not XP, so progression *is* learning.
- **Star Coins** — +5 per correct, +5 extra for a scaffold-completed solve (persistence pays), +25 per mastery. Spend on hats, food, backgrounds.
- **Reward nudge** — every 3rd correct answer or evolution prompts "feed a cupcake / open the shop," then resumes.
- **Streak** — visible 🔥 counter; resets on a wrong answer.

---

## Stack

Next.js 14 (App Router) · Tailwind · Framer Motion · Anthropic Claude Haiku 4.5 · React state + `localStorage` (no database in this build).

```bash
npm install
cp .env.local.example .env.local   # optional: ANTHROPIC_API_KEY
npm run dev                        # http://localhost:3000
```

Demo helpers: `?demo=hungry` (simulate overnight), `?demo=reset` (wipe local state).

```
app/
  page.tsx                 game loop, state, hunger/evolution/reward logic
  api/scaffold             misconception-aware scaffold ladder
  api/parent-summary       parent note over aggregated telemetry
  api/tutor-brief          tutor pre-session brief
components/
  Pet.tsx                  evolving SVG pet (4 stages, 7 moods)
  AbacusInput / VedicInput / LatticeInput
  ScaffoldLadder, SkillMap, ParentModal, PetShop, RewardNudge, HUD
lib/
  skills.ts                Math Powers, mastery, evolution stages
  misconceptions.ts        deterministic error classifier
  telemetry.ts             aggregate() — the only thing the LLM sees
  problems.ts / scaffolds.ts / shop.ts / mockSessions.ts
```

---

## How this plugs into Nerdy

**Study Plan.** Each `Session` row is already shaped for it: `{ ts, skillId, ccss[], correct, firstTry, scaffoldUsed, misconception, timeSec }`. Study Plan tracks lessons, practice, and live sessions; Numi *is* the practice feed for K-5, with standards attached.

**Live + AI.** The Tutor Brief is session intelligence generated *before* the session, from play. After the session, the tutor's notes could set the next day's `DEMO_ORDER` — the human closes the loop the AI opened.

**Self-serve funnel.** Numi is a free, no-login top of funnel. The parent sees a gap named in plain English and a one-tap "book a session on Fair Share" — a warm lead with a diagnosis attached, replacing a telesales call.

**Retention.** The parent note is a weekly email waiting to happen: *"Here's what Sparky taught Maya this week."* Value the parent can see is cheaper than a cancel-by-phone policy.

---

## Adaptive engine (`lib/nextProblem.ts`)

```
Every 4th problem:              spaced-review a mastered power (rotated)
Otherwise:                      pick the least-solved unmastered power that
                                isn't the last or second-last skill served
Difficulty for that skill:      skill.order + min(cleanSolves, mastery_threshold)
Fallback (all mastered):        cycle through skills for continued practice
```

Live in the app — toggle **🎯 Adaptive** in the HUD (or `?adaptive=1`). Off by default so the video's scripted sequence still plays for a recording; on when a judge clicks around. A small "Adaptive: {reason}" footer shows the selector's stated reasoning under each question.

**Composable with AI mode:** turn on both toggles and the selector picks the skill+difficulty while `/api/generate` writes the story for those numbers — real adaptive problems generated live and verified before display.

### "I'm stuck" button

Every question has a **🤔 I'm stuck — help me build up** button. Tapping it runs the same scaffold ladder as a wrong answer, tagged `help_requested`, with a warmer diagnosis. Help-seeking is tracked separately so it shows up in the Parent Note as persistence, not a defect.

## Built vs. planned

| Feature | Demo | Production |
|---|---|---|
| 10 Math Powers across 3 Eastern techniques | ✅ | + spaced review |
| Mastery tracking + pet evolution | ✅ | server-side |
| Misconception classifier → targeted scaffold | ✅ live + fallback | wider taxonomy, learned from tutor labels |
| Scaffold verifier + `npm run eval` | ✅ 21/21 unit tests, 0 failed rungs across 16 fallbacks | tool-use JSON schema, live-eval CI gate |
| Deterministic generation + LLM story via tool-use | ✅ 10 generators, 200/200 offline, live rejects fall back to safe template | wider misconception taxonomy, spaced review |
| Adaptive selector (weakest-power, spaced review) | ✅ `lib/nextProblem.ts` with 5 unit tests, HUD toggle | server-side, per-account |
| "I'm stuck" button (help-seeking as a first-class signal) | ✅ tagged `help_requested`, tracked in telemetry | teacher-facing help-rate reporting |
| Hunger / daily quest / streak | ✅ | push notification at hunger 60% |
| Star Coins + Pet Shop | ✅ | inventory service |
| Parent Note | ✅ real LLM over real device telemetry | weekly email |
| Tutor Brief | ✅ real LLM over real device telemetry | injected into the Live Learning Platform pre-session |
| Book-a-session CTA | ✅ link | deep-link with diagnosis payload |
| Adaptive difficulty | 📋 above | |
| LLM-generated problems (code picks numbers) | 📋 | |
| Auth / multi-device / Study Plan sync | ❌ | Supabase → Nerdy |
| Content safety pipeline | 📋 | age-filter system prompt + output moderation |
