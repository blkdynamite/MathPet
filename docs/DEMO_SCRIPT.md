# Numi — 90-second demo script

Record at `http://localhost:3000/?demo=reset` first (fresh state), then reload with `?demo=hungry` after onboarding. Portrait phone frame or narrow browser (~420px). One take, no cuts if possible.

| Time | On screen | Voiceover |
|---|---|---|
| 0:00–0:06 | Title card: **Numi** · "the between-sessions layer" | "Varsity Tutors has 29,000 learning memberships. Two sessions a week. What happens the other five days?" |
| 0:06–0:14 | Onboarding: name Sparky, pick Space + Sports, hatch | "Numi is a math pet for 3rd to 5th graders. It lives in the gap between tutoring sessions." |
| 0:14–0:22 | Reload with `?demo=hungry`. Sparky droops: *"I'm hungry! Solve 3 to feed me."* Hunger bar red. | "Sparky gets hungry overnight. Feeding him means doing math — that's the daily reason to come back." |
| 0:22–0:34 | Solve `8 + 7` and `9 + 6` with Make-10. Second one → 🏅 *Power mastered: Make-10* → **Sparky evolves to a Sprite** (sprout appears, confetti). | "Numi rewards *mastery*, not answers. Two clean solves of the Make-10 strategy and Sparky evolves." |
| 0:34–0:40 | Tap ⚡ Powers. Skill map: 10 powers, Common Core codes, 1 mastered. Close. | "Ten Math Powers from mental abacus, Vedic shortcuts, and lattice multiplication — each one a strategy, each one tagged to Common Core." |
| 0:40–0:58 | Division problem: *24 rocks, 6 per asteroid.* Type **144** (multiply on purpose). Sparky shakes. Scaffold: *"You multiplied — but sharing means DIVIDE."* Rung 1: groups of 6 in 12 → 2. Rung 2: in 24 → 4. Bridge back → answer 4 → "You worked it out! 💪" | "When a kid gets it wrong, Numi classifies the error in code — here, *multiplied instead of divided* — then the AI builds a ladder of easier problems that teach the strategy. It doesn't give the answer. It builds up to it." |
| 0:58–1:06 | 🔥 streak nudge appears → tap **Feed a cupcake** → Sparky "Nom nom!" Hunger bar full. | "Every third win, the kid gets to spend on Sparky. Persistence pays double." |
| 1:06–1:22 | Tap 👨‍👩‍👧. **For Parents** tab: two-paragraph note + tonight's 5-minute tip. Swap to **Tutor Brief**: headline, focus `3.OA.A.2`, pattern ×2, suggested opener, standards chips. Hover the **Book a live session on Fair Share →** button. | "And every session generates two things. A note the parent can actually read. And a 30-second brief the human tutor sees before the next live lesson — with the standard, the pattern, and what to open with. That's Live plus AI, from play." |
| 1:22–1:30 | End card: **Numi** · "Math their pet learned first." · repo + live URL | "Numi. The between-sessions layer for Live plus AI." |

## Pre-flight

- `ANTHROPIC_API_KEY` set → scaffold diagnosis and both notes are live. Unset → deterministic fallbacks (still demo-safe).
- Have ⭐ ≥ 20 before the nudge so the cupcake button is enabled (start is 30; each correct +5).
- If the streak nudge fires before you want it, "Keep practicing" advances without spending.
- Keep the browser at 100% zoom; the pet is 180px and evolution scale-up needs headroom.
