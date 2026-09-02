"use client";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

// A 3-column soroban-style abacus: hundreds, tens, ones.
// Each column has 1 upper bead (worth 5) and 4 lower beads (worth 1).
// Kids tap beads to move them toward the reckoning bar in the middle.

type Column = { upper: boolean; lower: number };

const COLS = ["Hundreds", "Tens", "Ones"] as const;
const PLACE = [100, 10, 1];

export function AbacusInput({
  target,
  onSubmit,
}: {
  target: number;
  onSubmit: (value: number, correct: boolean) => void;
}) {
  const [cols, setCols] = useState<Column[]>([
    { upper: false, lower: 0 },
    { upper: false, lower: 0 },
    { upper: false, lower: 0 },
  ]);

  const value = useMemo(
    () => cols.reduce((sum, c, i) => sum + PLACE[i] * ((c.upper ? 5 : 0) + c.lower), 0),
    [cols]
  );

  function toggleUpper(i: number) {
    setCols((cs) => cs.map((c, j) => (j === i ? { ...c, upper: !c.upper } : c)));
  }
  function setLower(i: number, n: number) {
    setCols((cs) => cs.map((c, j) => (j === i ? { ...c, lower: n } : c)));
  }
  function reset() {
    setCols([
      { upper: false, lower: 0 },
      { upper: false, lower: 0 },
      { upper: false, lower: 0 },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="text-center text-xs text-gray-500 font-semibold uppercase tracking-wide">
        Tap beads to build <span className="text-numi-accent">{target}</span>
      </div>

      <div className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-2xl border-2 border-amber-300 p-3">
        <div className="grid grid-cols-3 gap-2">
          {cols.map((col, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="text-[10px] font-semibold text-gray-500 mb-1">{COLS[i]}</div>

              {/* upper bead area */}
              <div className="h-16 flex flex-col justify-end items-center">
                <motion.button
                  onClick={() => toggleUpper(i)}
                  animate={{ y: col.upper ? 20 : 0 }}
                  className="w-10 h-6 rounded-full bg-sky-500 border-2 border-sky-600 shadow"
                  aria-label={`Upper bead ${COLS[i]}`}
                />
              </div>

              {/* reckoning bar */}
              <div className="w-full h-1 bg-amber-700 rounded my-1" />

              {/* lower beads (4 beads, tap to slide up) */}
              <div className="h-24 flex flex-col-reverse items-center gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <motion.button
                    key={n}
                    onClick={() => setLower(i, col.lower >= n ? n - 1 : n)}
                    animate={{ y: col.lower >= n ? -8 : 0 }}
                    className="w-10 h-5 rounded-full bg-orange-500 border-2 border-orange-600 shadow"
                    aria-label={`Lower bead ${n} of ${COLS[i]}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">
          Current: <span className="text-numi-accent">{value}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-3 py-1 rounded-lg bg-white border border-gray-300 text-sm font-semibold text-gray-600"
          >
            Reset
          </button>
          <button
            onClick={() => onSubmit(value, value === target)}
            className="px-4 py-2 rounded-xl bg-numi-accent text-white font-bold shadow"
          >
            Check!
          </button>
        </div>
      </div>
    </div>
  );
}
