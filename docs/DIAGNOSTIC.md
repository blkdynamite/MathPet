# Onboarding diagnostic: "Sparky gets to know you" (v2 design)

**Status:** designed, not built. This document is the spec. Everything here reuses code that already exists; the estimate at the bottom is honest about what is new.

## The question it answers

Two children both get *"Sparky shares 24 rocks into 6 asteroids. How many in each?"* wrong. One of them can't divide. The other divides fine but read "shares" and multiplied. Today Numi treats them the same: same scaffold, same difficulty drop, same Tutor Brief line. That's the wrong intervention for at least one of them — and most children who "aren't good at word problems" are the second kind.

The diagnostic's job is to tell those two children apart at onboarding, then keep telling them apart during play, and to route each to a different kind of help.

## The core measurement: matched pairs

Every diagnostic item is generated once as a `GeneratedSpec` (operands, operation, answer — code-generated, verified) and rendered in up to three **forms**:

| Form | Example | What it isolates |
|---|---|---|
| **Bare** (`templatePrompt`) | `24 ÷ 6 = ?` | Can the child do the computation at all? |
| **Story** (`storyTemplate`) | *Sparky shares 24 rocks into 6 asteroids. How many in each?* | Can they get from words to the same computation? |
| **Schema** (new, multiple-choice, no computing) | *Sparky shares 24 rocks into 6 asteroids. Should we add, subtract, multiply, or divide?* | Can they pick the operation, with arithmetic taken out of the picture? |

Same numbers, same operation, so the only variable between forms is the form. A child's answers on a pair land in one of four cells:

| | Story ✓ | Story ✗ |
|---|---|---|
| **Bare ✓** | Concept and translation both fine | **Translation gap** — the math is there, the words aren't |
| **Bare ✗** | Concept shaky; contextual reasoning carrying them (worth noting, not alarming) | **Concept gap** — teach the math first |

The **Schema** form then splits the translation gap further: a child who fails the story but picks ÷ correctly on the schema item has a *computation-under-reading-load* problem (or a reading problem), not an operation-selection problem. A child who picks × on the schema item has an **operation-selection** problem — which is what "bad at word problems" usually means, and which is highly teachable.

### Where "word-problem difficulty" actually comes from

The diagnostic doesn't just flag "word problems: weak." It attributes the weakness to one or more of these, each with a specific probe and a specific intervention:

| Sub-cause | Probe | Signal | Intervention (in-app) |
|---|---|---|---|
| **Operation selection** | Schema item (4-choice, no arithmetic) | Picks wrong operation; classifier tags `multiplied_instead_of_divided` etc. on story form while bare form was correct | **Operation Picker** step before the number pad; schema-sort scaffold rungs |
| **Keyword misreading** | Minimal-pair stories: *"6 rocks **each**"* vs *"6 rocks **in all**"* with identical numbers | Correct on one, wrong on the other | Keyword-highlighted stories; rungs that restate the sentence without the trigger word |
| **Distractor filtering** | Story with one irrelevant number (*"Sparky has 3 friends and 24 rocks in 6 asteroids"*) | Error uses the distractor (classifier: new `used_distractor` tag) | Rung 1 asks "which numbers matter?" before any arithmetic |
| **Multi-step decomposition** | Two-step story vs. the two one-step bare parts | Both parts right, composite wrong; classifier `skipped_a_step` | Already handled by the Two-Step power's scaffold; profile just triggers it earlier |
| **Reading load** | Same story at two sentence lengths; `timeToFirstKeyMs` | Long form wrong, short form right; long dwell before first tap | Shorter sentences (profile-driven reading cap in the verifier), optional read-aloud via Web Speech API (no API cost) |

The sub-causes map onto the Common Core problem-situation types (Glossary Tables 1 and 2: *Add to / Take from / Put together / Compare*; *Equal groups / Arrays / Compare*). Schema items are literally "which situation is this?" — which is the schema-based instruction approach with the strongest evidence base for word-problem difficulty in grades 3–5.

## The flow (6 minutes, framed as the hatching ritual)

Today the egg hatches the moment onboarding ends. In v2 the egg hatches at the **end** of the diagnostic: "Sparky needs to learn what you already know so he can pick the right adventures." The egg-crack meter is the progress bar. Rewards for finishing, never for being right. **The pet is neutral throughout** — no sad shake on a wrong answer; this is the one place in the app where a miss must cost nothing.

```
Interests (existing)
   │
   ▼
Phase A · bare computation · ~2 min · ≤ 6 items
   one item per skill family, staircase difficulty (start at the family's
   grade-level gate; up one on correct, down one on wrong; stop a family after
   two consecutive at the same gate)
   → computation level per family
   │
   ▼
Phase B · matched story forms · ~2 min · ≤ 4 items
   only for families the child got right in A (no point testing translation
   on a concept they don't have). Story form is shown FIRST, bare form was
   already collected — so a story miss with a bare hit is unprimed evidence.
   → translation score, per-family
   │
   ▼
Phase C · schema items · ~1 min · 3–4 items
   four-choice operation selection, mixed situation types, one with a distractor
   → operation-selection score, distractor flag
   │
   ▼
Egg hatches → LearnerProfile saved → first real problem is chosen from it
```

Stop rules cap it at 12 items / 6 minutes. A child who is clearly fluent skips most of B and C.

## What it produces

```ts
type LearnerProfile = {
  version: 1;
  assessedAt: number;
  computation: Record<SkillId, { level: 1 | 2 | 3 | 4 | 5; items: number }>;
  translation: {
    score: number;                       // story-correct / story-attempted, over pairs with bare ✓
    deficits: Array<"operation_selection" | "keyword" | "distractor" | "multistep" | "reading_load">;
  };
  readingLoad: { flag: boolean; medianTimeToFirstKeyMs: number };
  style: "bare_first" | "story" | "mixed";   // how to present new problems
};
```

`SaveState.profile` holds it. It is a screener, not a diagnosis: twelve items give wide confidence intervals, so the profile is **updated continuously** (below) rather than trusted forever.

## How it drives difficulty and style

1. **Starting difficulty per power** — `nextProblem.ts` uses `profile.computation[skill].level` instead of `skill.order` as the opening gate. A child who did 2-digit lattice in Phase A doesn't start at Make-10.
2. **Presentation style** — `style: "bare_first"` means new problems arrive as a **story ladder**: bare → one-sentence story with no distractors → full story. The child climbs the ladder over days as their translation score rises. This is the word-problem analogue of the scaffold ladder, and it's the intervention that matches a translation gap.
3. **Operation Picker** — with `operation_selection` in `deficits`, a four-button "add / subtract / multiply / divide" step appears *before* the number pad on story problems. Correct pick → number pad. Wrong pick → a one-line schema hint, no penalty on the second try. Removed automatically once the rolling schema accuracy clears 85% over the last 10.
4. **Scaffold strategy** — `/api/scaffold` receives `profile.translation.deficits`. On a story-form miss:
   - translation gap → **rung 1 is the bare form** (*"Let's just do the math first: 24 ÷ 6 = ?"*), rung 2 rebuilds the sentence around it;
   - concept gap → the existing strategy rungs (smaller numbers, same operation).
   Same verifier, same fallbacks; only rung selection changes.
5. **Reading load** — the verifier's grade-3 reading thresholds become profile-driven (shorter sentence cap), and story templates get a `short` variant. Read-aloud button on story problems using `speechSynthesis` — no API, no cost.

## Continuous re-assessment (the part that makes it trustworthy)

The matched-pair trick doesn't need a test screen. During normal play, **one problem in five is served in bare form** for a skill the child usually sees as a story (and vice-versa for `bare_first` children as they progress). Each pair updates `translation.score` with an exponential moving average. `Session` gains three fields: `form`, `pairId`, `timeToFirstKeyMs`. Nothing about the game changes from the child's point of view; the profile just stops being a one-shot guess.

## What the tutor sees

The Tutor Brief gains one line that a human can act on in the first minute of a session:

> **Translation vs. computation:** Fair Share is solid as arithmetic (3/3 bare). The gap is words → operation: 1/3 on story forms, both misses were × for ÷. Schema items: 2/4. Open with a no-computing sort — six one-sentence problems, the student only labels each ÷ or ×.

That is a different opener than "review division," and it is the one this child needs.

## Implementation map

| Piece | New or reuse | Notes |
|---|---|---|
| Item generation | **reuse** `generateSpec`, `templatePrompt`, `storyTemplate` | matched pairs come for free |
| Schema items | new, small | 4-choice component + `SCHEMA_TEMPLATES` per operation; distractor variant of `storyTemplate` |
| Staircase + stop rules + scorer | new `lib/diagnostic.ts` | pure functions, fully unit-testable offline |
| Flow UI | new `components/Diagnostic.tsx` | neutral pet, egg-crack meter, three phases |
| Profile in state | `SaveState.profile` + `migrate()` | version field already exists |
| Selector | edit `nextProblem.ts` | opening gate from profile; 1-in-5 bare sampling |
| Operation Picker | new component + `page.tsx` phase | gated by `deficits` |
| Scaffold rung strategy | edit `/api/scaffold` + `lib/prompts.ts` | pass deficits; bare-form rung 1 |
| Telemetry | `Session.form / pairId / timeToFirstKeyMs`; `aggregate()` by form | Tutor Brief line |
| Classifier | add `used_distractor`, `keyword_swap` | same deterministic pattern |
| Evals | **synthetic learners** | see below |

### The eval that makes this credible

Because items are code-generated and deterministic, the scorer can be tested against **simulated students with known deficits** — no model calls, runs in CI:

- a "computation-only" learner (always right on bare, always wrong on story) must be classified `translation` gap;
- an "operation-swapper" (right on bare, picks × for ÷ on schema) must get `operation_selection`;
- a "concept-gap" learner (wrong on bare) must get a low computation level and *no* translation flag;
- a "fluent" learner must finish in ≤ 8 items with no flags;
- a noisy learner (10% random errors) must not be flagged — this pins the false-positive rate.

That is the difference between "we have an assessment" and "we know what our assessment measures."

## Validity caveats, stated up front

- Twelve items is a screener. Attribution to a sub-cause is a hypothesis the rolling data confirms or retracts.
- Story-first ordering avoids priming, but a wrong first answer is demoralizing — hence the neutral pet and completion-only rewards.
- Interest-themed stories add reading load unevenly (*"asteroids"* vs *"jars"*); the reading-load probe controls sentence length, not vocabulary. v2.1 should control vocabulary too.
- None of this replaces a tutor's judgement; it gives the tutor a better first question.

## Effort

| Scope | Estimate |
|---|---|
| **MVP:** Phase A only (6 bare items → starting difficulty per power) | ~half a day |
| Phases A–C + profile + selector + Operation Picker | 2 days |
| Scaffold rung strategy + continuous re-assessment + Tutor Brief line | +1 day |
| Synthetic-learner eval | +half a day |

The MVP is small enough to ship before a deadline if wanted; the rest is v2.
