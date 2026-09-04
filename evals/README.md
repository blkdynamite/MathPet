# Numi evals

**What this proves:** every scaffold a child sees has been re-derived in code before display. The verifier is not a nice-to-have — it's the guardrail that lets us put an LLM in front of an 8-year-old.

## Run

```bash
npm run test:verify     # unit tests for lib/verify.ts and lib/generate.ts (59 checks, offline)
npm run eval:scaffold   # scores all fallback scaffolds; live pass if ANTHROPIC_API_KEY is set
npm run eval:generate   # scores 200 deterministic specs offline; 90 live tool-use stories if key
npm run eval            # runs both eval:scaffold and eval:generate
```

Latest run is committed at `evals/results.json`.

## What we score

Every scaffold produced by the pipeline (fallback or live LLM) gets each of these:

| Metric | How |
|---|---|
| **JSON valid** | Parses to the `Scaffold` shape |
| **Arithmetic clean** | 0 rungs whose stated answer disagrees with what code evaluates from the question text |
| **Rungs verified** | Fraction of rungs where an arithmetic expression was extracted *and* matched. Word-only rungs are `unverified` (allowed through) rather than `failed` |
| **No bridge leak** | `bridge_back` doesn't restate the original problem's answer as a bare number |
| **Reading level** | Sentence ≤ 22 words, word ≤ 14 chars (grade-3 heuristic) across every kid-facing string |
| **Diagnosis addresses misconception** | For a classified misconception, the diagnosis mentions a keyword from that tag |
| **Classifier tag ok** | For each curated wrong-answer case, `classify(problem, userAnswer)` returns the expected tag |

## The guardrail contract

`verifyScaffold(scaffold, originalAnswer)` returns `ok: false` on any of:
- a rung's stated answer disagrees with the arithmetic in its question
- rung list is empty or has more than 4 rungs
- the scaffold shape is malformed

`app/api/scaffold/route.ts` calls the verifier on every live LLM response. `ok: false` → the hand-verified fallback is served instead and the rejection is logged. The child never sees an unverified rung claim.

Leakage and reading level are quality metrics — the eval reports them but the runtime does not reject on them, because a rung whose answer legitimately equals the original answer is often correct pedagogy (the ladder builds all the way up to the answer).

## Curated cases

`CASES` in `scaffold.eval.ts` covers 20 wrong-answer scenarios spanning 8 misconception tags:

- `multiplied_instead_of_divided` (×2)
- `added_instead_of_multiplied` (×2)
- `skipped_a_step` (×4 — two-step word, lattice tens-only)
- `place_value_slip`
- `off_by_one` (×8 — the classifier's fallback for a small numeric distance)
- `digit_reversal` (×2 — 253 vs 352)
- `unknown` (×1 — a wrong answer with no obvious pattern)

The live pass sends each case to Claude Haiku 4.5, parses the JSON, and applies the same verifier the runtime uses. `results.json` contains per-case rows and a summary block with latency percentiles.
