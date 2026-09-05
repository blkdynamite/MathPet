# Numi evals

**What this proves — and what it doesn't.** Every LLM-generated scaffold rung and story is checked in code before a child sees it, and what fails is replaced. The offline suites prove the checkers and the hand-written/code-generated content agree. **They do not measure the model.** The live passes do; they are wired to the production prompts but have not been run in this repo (`"live": null` in both results files) because no API key was available at submission time.

## Run

```bash
npm run test:verify     # 69 offline unit checks (lib/verify.ts, lib/generate.ts, lib/nextProblem.ts)
npm run eval:scaffold   # 16 fallback scaffolds offline; + 20 live cases if ANTHROPIC_API_KEY is set
npm run eval:generate   # 200 deterministic specs offline; + 90 live stories if a key is set
npm run eval            # both
```

Latest committed run: `evals/results.json`, `evals/generate.results.json`.

## Eval == production

`evals/*.eval.ts` import `SCAFFOLD_SYSTEM`, `SCAFFOLD_TOOL`, `STORY_SYSTEM`, `STORY_TOOL`, and the user-turn builders from `lib/prompts.ts`, and call the model through `lib/llm.ts` — the same objects `app/api/*` use. A prompt edit in production is what the next eval run measures. (Before this, the eval had its own copy of the prompt and could never have measured the route.)

## What we score

| Metric | How | Runtime effect |
|---|---|---|
| **JSON valid** | Forced tool returned a well-formed object | reject → fallback |
| **Arithmetic clean** | 0 rungs whose stated answer disagrees with the arithmetic in its question. The expression immediately before the rung's `?` is authoritative; other expressions in the text cannot verify a claim | reject → fallback |
| **Rungs verified** | Fraction of rungs where arithmetic was extractable *and* matched. Word-only rungs are `unverified` — **allowed through** | metric only |
| **No bridge leak** | `bridge_back` doesn't restate the original answer as a bare number | metric only |
| **Reading level** | Sentence ≤ 22 words, word ≤ 14 chars (a heuristic, not Flesch-Kincaid) | metric only |
| **Diagnosis addresses misconception** | Keyword match against the tag's vocabulary (loose) | metric only |
| **Classifier tag ok** | `classify(problem, wrongAnswer)` returns the expected tag for each curated case | n/a |

Story verification (`verifyGeneratedPrompt`): every operand present as exact digits in order (duplicates handled), answer absent from prompt and hint, reading level. Fails → the code-built `storyTemplate` is served.

## Latest offline numbers

- Generation: **200/200** arithmetic-consistent, **200/200** template passes verifier.
- Scaffold fallbacks: **16/16** arithmetic clean, **0** failed rungs, **16/16** no bridge leak, **16/16** reading level, **16/16** classifier tags; **23/32 rungs code-verified** (9 word-only rungs `unverified`).

## Curated live cases

`CASES` in `scaffold.eval.ts`: 20 wrong-answer scenarios across 8 misconception tags. `generate.eval.ts` live pass: 10 skills × 3 seeds × 3 interest sets. Both record per-case rows, aggregate pass rates, rejection reasons, and latency p50/p95.

## Custom runner

`verify.test.ts` is a ~60-line dependency-free runner (prints `ok`/`FAIL`, exits non-zero). It's adequate for the current size; a thrown exception aborts the run rather than reporting partial results. Switching to vitest is a one-line devDependency when the suite grows.
