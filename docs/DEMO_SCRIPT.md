# Numi — 90-second demo script

Record on the live site (`https://math-pet-theta.vercel.app/?demo=reset`) or locally (`http://localhost:3000/?demo=reset`) for a fresh state, then reload with `?demo=hungry` after onboarding. Portrait phone frame or narrow browser (~420px). Sound on (🔊). One take, no cuts if possible.

| Time | On screen | Voiceover |
|---|---|---|
| 0:00–0:06 | Title card: **Numi** · "the between-sessions layer" | "Varsity Tutors has 29,000 learning memberships. Two sessions a week. What happens the other five days?" |
| 0:06–0:14 | Onboarding: name Sparky, pick Space + Sports, hatch | "Numi is a math pet for 3rd to 5th graders. It lives in the gap between tutoring sessions." |
| 0:14–0:22 | Reload with `?demo=hungry`. Sparky droops: *"I'm hungry! Solve 3 to feed me."* Hunger bar red. | "Sparky gets hungry overnight. Feeding him means doing math — that's the daily reason to come back." |
| 0:22–0:34 | Solve *"Sparky ate 8 berries, then 7 more"* and *"9 space rocks, then 6 more"* with Make-10. Chime on each correct. Second one → 🏅 *Power mastered: Make-10* → **Sparky evolves to a Sprite** (sprout, confetti, arpeggio). | "Numi rewards *mastery*, not answers. Two clean solves of the Make-10 strategy and Sparky evolves." |
| 0:34–0:40 | Tap ⚡ Powers. Skill map: 10 powers, Common Core codes, 1 mastered. Close. | "Ten Math Powers from mental abacus, Vedic shortcuts, and lattice multiplication — each one a strategy, each one tagged to Common Core." |
| 0:40–0:58 | Division problem: *24 rocks, 6 per asteroid.* Type **144** (multiply on purpose). Sparky shakes. Scaffold: *"You multiplied — but sharing means DIVIDE."* Rung 1: groups of 6 in 12 → 2. Rung 2: in 24 → 4. Bridge back → answer 4 → "You worked it out! 💪" | "When a kid gets it wrong, Numi classifies the error in code — here, *multiplied instead of divided* — then the AI builds a ladder of easier problems that teach the strategy. It doesn't give the answer. It builds up to it." |
| 0:58–1:06 | Feed modal appears (after the 2nd win) → pick a treat → Sparky "Nom nom!" Hunger bar fills. | "Every couple of wins, the kid spends coins on Sparky. Persistence pays double." |
| 1:06–1:22 | Tap 👨‍👩‍👧. **For Parents** tab: two-paragraph note + tonight's 5-minute tip. Swap to **Tutor Brief**: headline, focus `3.OA.A.2`, pattern ×2, suggested opener, standards chips. Hover the **Book a live session on Fair Share →** button. | "And every session generates two things. A note the parent can actually read. And a 30-second brief the human tutor sees before the next live lesson — with the standard, the pattern, and what to open with. That's Live plus AI, from play." |
| 1:22–1:30 | End card: **Numi** · "Math their pet learned first." · repo + live URL | "Numi. The between-sessions layer for Live plus AI." |

## Engineer's cut (extra 20s, for the hiring-team audience)

Splice this in after the scaffold beat if the audience is technical. Load the page with `?debug=1` first — the 🎯 Adaptive and 🤖 AI toggles and the provenance footers are hidden from the kid surface by default:

| On screen | Voiceover |
|---|---|
| Tap **🎯 Adaptive** → footer shows *"weakest unmastered — Fair Share"*. Tap **🤖 AI** → "Generating…" → a fresh, interest-themed problem with *"Story generated live and verified"* underneath. | "The problems aren't hardcoded. Code picks the numbers, Claude writes the story around the kid's interests via tool-use, and a verifier checks the model didn't change the math before it ever reaches the child. That's `npm run eval` — 200 out of 200." |

## Pre-flight

- `ANTHROPIC_API_KEY` set → scaffold diagnosis and both notes are live. Unset → deterministic fallbacks (still demo-safe).
- Have ⭐ ≥ 20 before the nudge so the cupcake button is enabled (start is 30; each correct +5).
- If the streak nudge fires before you want it, "Keep practicing" advances without spending.
- Keep the browser at 100% zoom; the pet is 180px and evolution scale-up needs headroom.
