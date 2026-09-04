"use client";
import { useState } from "react";
import { motion } from "framer-motion";

// Small haptic tick on devices that support it (tablets/phones — the target
// device for a 3rd–5th grader). No-op on desktop.
function tick(ms = 12) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignore */
    }
  }
}

export function NumberPad({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clr", "0", "⌫"];
  const [flash, setFlash] = useState<string | null>(null);

  function press(k: string) {
    tick();
    setFlash(k);
    setTimeout(() => setFlash((f) => (f === k ? null : f)), 150);
    if (k === "clr") onChange("");
    else if (k === "⌫") onChange(value.slice(0, -1));
    else if (value.length < 6) onChange(value + k);
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <motion.button
            key={k}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 600, damping: 20 }}
            className={`pad-key h-12 ${flash === k ? "bg-amber-200 border-numi-accent" : ""}`}
            onClick={() => press(k)}
          >
            {k}
          </motion.button>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          tick(20);
          onSubmit();
        }}
        disabled={value.length === 0}
        className="w-full py-3 rounded-2xl bg-numi-accent text-white font-bold text-lg shadow disabled:opacity-40"
      >
        Submit
      </motion.button>
    </div>
  );
}
