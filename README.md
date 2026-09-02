# Numi 🐾

**Math their pet learned first.**

An AI-powered digital-pet game for 3rd–5th graders that disguises adaptive math practice as taking care of a virtual companion. Built for the Nerdy AI Hackathon.

---

## What's in the demo

A single-page Next.js app you can record in 90 seconds:

1. **Hatch a pet** → pick 3 interests → egg cracks.
2. **Solve math problems** using one of three visual pedagogies (see below).
3. **Get one wrong on purpose** → an **AI scaffold ladder** appears, generating two easier prerequisite problems that build up to the target concept.
4. **Earn Star Coins** on every correct answer → open the **Pet Shop** and equip a hat.
5. **Tap "For Parents"** → an AI-written coaching note is streamed in from a real LLM call on mock telemetry.

Everything is client-side + two Next.js API routes. No database in this build.

---

## The pedagogy (the actual differentiator)

Most math apps drill flashcards. Numi teaches the *pattern behind the number* using three Eastern math techniques:

| Technique | What it teaches | Where in the demo |
|---|---|---|
| **Mental Abacus** | Group by 5s and 10s; visualize place value | `AbacusInput.tsx` — tap beads to build a target number |
| **Vedic Shortcuts** | ×11 = split digits + add middle; base-10 complements | `VedicInput.tsx` — pattern-based multiplication |
| **Lattice / Box** | 2-digit × 2-digit as a visual grid | `LatticeInput.tsx` — fill 2×2 cells, sum the diagonals |

Every technique is rendered visually, not just described. This is what makes Numi feel like real instruction, not a quiz app.

---

## AI "superpowers"

### 1. Scaffold generation (`/api/scaffold`)
When a kid gets a problem wrong, Claude Haiku generates a **2-step ladder of easier prerequisite problems** using the preferred pedagogical technique. Falls back to a pre-generated `scaffolds.json` if the API is slow (>2.5s) — the demo cannot fail live.

The prompt returns structured JSON:
```json
{
  "diagnosis": "one sentence naming likely misconception",
  "encouragement": "one warm sentence",
  "scaffold": [
    { "question": "...", "answer": 24, "technique_note": "..." },
    { "question": "...", "answer": 4, "technique_note": "..." }
  ],
  "bridge_back": "one sentence back to the original problem"
}
```

### 2. Parent summary (`/api/parent-summary`)
Aggregates last 10 sessions (mock in this build, real telemetry in prod) → asks Claude to write a 2-paragraph coaching note for the parent. Not a dashboard, a conversation.

---

## Stack

- **Next.js 14** (App Router) + **Tailwind** + **Framer Motion**
- **Anthropic Claude Haiku 4.5** (two API routes)
- State: React + `localStorage` (pet level, coins, owned items persist across refresh)
- No database in this build (see roadmap below)

---

## Run it

```bash
npm install
cp .env.local.example .env.local        # add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. Works without an API key — falls back to pre-generated scaffolds and a static parent summary.

---

## Adaptive difficulty (documented, not built in this demo)

The full engine that the demo intentionally leaves out for scope. Would live in `lib/adaptive.ts`:

```
On correct answer (no hints):   streak++
On wrong or hint-used answer:   streak = 0, stumble_count++
If streak >= 3:                 difficulty = min(5, difficulty + 1), streak = 0
If stumble_count >= 2 in 3 Qs:  difficulty = max(1, difficulty - 1)

Difficulty gates:
  1: single-digit ops
  2: 2-digit +/-, mult tables to 10
  3: 2×1 digit mult, simple word problems
  4: 2×2 mult, 2-step word problems (lattice unlocks here)
  5: 3-digit ops, multi-step word problems, Vedic challenges
```

Wired into a real problem selector, this replaces the demo's `DEMO_ORDER` array.

---

## Built vs. planned

| Feature | Demo | Production plan |
|---|---|---|
| 3 Eastern-math pedagogies (Abacus / Vedic / Lattice) | ✅ | ✅ ships |
| AI scaffold ladder on wrong answer | ✅ (live + fallback) | LLM w/ deterministic answer verification |
| Pet shop, coins, hats, food | ✅ | Server-side inventory + purchase history |
| Parent summary | ✅ (real LLM, mock data) | Real telemetry via Supabase |
| Static problem bank (15 hand-picked) | ✅ | LLM-generated w/ deterministic answer verification (code generates numbers, LLM writes the story) |
| Adaptive difficulty engine | 📋 Documented above | Streak + stumble-count based |
| Content safety pipeline | 📋 | Age-filter system prompt + output moderation |
| Auth / accounts | ❌ | Supabase anonymous → parent-linked upgrade |
| Multi-device sync | ❌ | Postgres user state |
| Teacher dashboard | ❌ | Classroom roster + progress export |
| Daily streak bonus | 📋 | First correct answer of the day = 2× coins |

Legend: ✅ built · 📋 designed, not built · ❌ future

---

## Why this could win

1. **Stickiness** — pet reactions, coin economy, hats/food/shop, celebration animations. The retention loop is visible in 60 seconds.
2. **AI that teaches, not answers** — the scaffold ladder is the differentiator. Most tutors give hints; Numi generates *a simpler problem you can actually solve*, then walks you back up.
3. **Real pedagogy** — three visual techniques used by top-scoring international math programs, not just "drill and kill."

## Demo script (90 seconds)

- 0:00–0:08 — Hatch pet.
- 0:08–0:25 — Solve an abacus problem correctly. Coins climb.
- 0:25–0:50 — Get a division problem wrong on purpose → scaffold ladder appears → both rungs → nail the original.
- 0:50–1:05 — Level up → open Pet Shop → buy wizard hat → pet wears it.
- 1:05–1:20 — Tap "For Parents." Summary streams in.
- 1:20–1:30 — End card.
