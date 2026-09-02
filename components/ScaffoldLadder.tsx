"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Scaffold } from "@/lib/types";
import { NumberPad } from "./NumberPad";

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

  const done = step >= scaffold.scaffold.length;
  const current = scaffold.scaffold[step];

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card space-y-3 border-emerald-300"
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
    <div className="card space-y-3 border-amber-300">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase font-bold text-amber-700 tracking-wide">
          Scaffold · step {step + 1} of {scaffold.scaffold.length}
        </div>
        <div className="flex gap-1">
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
              className="text-xs text-sky-600 underline"
            >
              {showNote ? "Hide hint" : "Show a hint"}
            </button>
          )}
          {showNote && current.technique_note && (
            <div className="text-xs text-sky-700 bg-sky-50 rounded p-2 border border-sky-200">
              {current.technique_note}
            </div>
          )}
          <NumberPad
            value={val}
            onChange={setVal}
            onSubmit={() => {
              const n = Number(val);
              if (n === current.answer) {
                setStep((s) => s + 1);
                setVal("");
                setShowNote(false);
              } else {
                // shake input
                setVal("");
              }
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
