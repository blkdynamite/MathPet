"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { Scaffold } from "@/lib/types";
import { NumberPad } from "./NumberPad";
import { playCorrect, playWrong } from "@/lib/sound";

// Wrong answers on a scaffold rung used to just clear the input silently.
// A stuck 8-year-old would type, see the number vanish, and assume the app
// broke. Now every wrong rung: shakes, plays a soft "try again" tone, shows
// a message, and after two misses auto-reveals the technique_note so the
// child can't get stranded inside the "I'm stuck" flow.

const AUTO_HINT_AT_MISSES = 2;

export function ScaffoldLadder({
  scaffold,
  onComplete,
}: {
  scaffold: Scaffold;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [val, setVal] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const controls = useAnimation();
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const done = step >= scaffold.scaffold.length;
  const current = scaffold.scaffold[step];

  function say(text: string, ms = 3000) {
    setFeedback(text);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback((f) => (f === text ? null : f)), ms);
  }

  function handleSubmit() {
    const n = Number(val);
    if (!Number.isFinite(n)) return;
    if (n === current.answer) {
      playCorrect();
      setStep((s) => s + 1);
      setVal("");
      setShowNote(false);
      setMisses(0);
      setFeedback(null);
    } else {
      playWrong();
      controls.start({ x: [-8, 8, -6, 6, 0], transition: { duration: 0.35 } });
      const next = misses + 1;
      setMisses(next);
      setVal("");
      if (next >= AUTO_HINT_AT_MISSES) {
        setShowNote(true);
        say("Not quite — here's a hint. Try once more.");
      } else {
        say("Not quite — try again.");
      }
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card space-y-3 border-emerald-300"
        role="status"
      >
        <div className="text-emerald-700 font-bold">✨ Bridge back to the original</div>
        <div className="text-gray-700">{scaffold.bridge_back}</div>
        <button
          onClick={onComplete}
          className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold shadow"
        >
          Try the original again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div animate={controls} className="card space-y-3 border-amber-300">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase font-bold text-amber-700 tracking-wide">
          Scaffold · step {step + 1} of {scaffold.scaffold.length}
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {scaffold.scaffold.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded ${i <= step ? "bg-amber-500" : "bg-amber-200"}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <div className="text-sm font-semibold text-gray-700 mb-1">💡 {scaffold.diagnosis}</div>
        <div className="text-sm text-gray-600">{scaffold.encouragement}</div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-2"
        >
          <div className="text-lg font-bold text-gray-800">{current.question}</div>

          {current.technique_note && (
            <button
              onClick={() => setShowNote((s) => !s)}
              className="text-sm text-sky-700 font-semibold underline"
              aria-expanded={showNote}
            >
              {showNote ? "Hide hint" : "Show a hint"}
            </button>
          )}
          <AnimatePresence>
            {showNote && current.technique_note && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-sky-800 bg-sky-50 rounded p-2 border border-sky-200"
              >
                {current.technique_note}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live-region so the wrong-answer message reaches a screen reader too. */}
          <div className="min-h-[1.25rem]" role="status" aria-live="polite">
            {feedback && (
              <div className="text-sm font-semibold text-amber-700">{feedback}</div>
            )}
          </div>

          <NumberPad value={val} onChange={setVal} onSubmit={handleSubmit} />

          {misses >= AUTO_HINT_AT_MISSES + 1 && (
            <button
              onClick={() => {
                // Skip only the current rung — never skip the whole ladder;
                // the child still sees the bridge.
                setStep((s) => s + 1);
                setVal("");
                setShowNote(false);
                setMisses(0);
                setFeedback(null);
              }}
              className="w-full text-sm text-gray-600 font-semibold py-2 rounded-xl bg-gray-100 border border-gray-200"
            >
              Skip this step
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
