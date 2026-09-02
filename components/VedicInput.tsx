"use client";
import { useState } from "react";
import { NumberPad } from "./NumberPad";

// Visualizes the Vedic ×11 trick (split digits, add middle) or the
// base-10 complement trick, then accepts a numeric answer.

export function VedicInput({
  kind,
  a,
  b,
  answer,
  onSubmit,
}: {
  kind: "x11" | "base10_complement";
  a: number;
  b: number;
  answer: number;
  onSubmit: (value: number, correct: boolean) => void;
}) {
  const [val, setVal] = useState("");

  return (
    <div className="space-y-3">
      {kind === "x11" ? (
        <div className="bg-fuchsia-50 border-2 border-fuchsia-200 rounded-2xl p-3 text-center">
          <div className="text-xs uppercase font-semibold text-fuchsia-700 tracking-wide">Vedic ×11 trick</div>
          <div className="mt-2 flex justify-center gap-2 text-3xl font-bold">
            <span>{Math.floor(a / 10)}</span>
            <span className="text-fuchsia-500">_</span>
            <span>{a % 10}</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Put ({Math.floor(a / 10)} + {a % 10}) in the middle → carry if it's 10+
          </div>
        </div>
      ) : (
        <div className="bg-fuchsia-50 border-2 border-fuchsia-200 rounded-2xl p-3 text-center">
          <div className="text-xs uppercase font-semibold text-fuchsia-700 tracking-wide">Base-10 complement</div>
          <div className="mt-2 text-lg text-gray-700">
            100 − {a} = <b>{100 - a}</b> &nbsp;·&nbsp; 100 − {b} = <b>{100 - b}</b>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Answer = ({a} − {100 - b}) then × 100, plus ({100 - a} × {100 - b})
          </div>
        </div>
      )}

      <div className="text-center text-2xl font-bold">
        {a} × {b} = <span className="text-numi-accent">{val || "?"}</span>
      </div>

      <NumberPad
        value={val}
        onChange={setVal}
        onSubmit={() => {
          const n = Number(val);
          if (!Number.isFinite(n)) return;
          onSubmit(n, n === answer);
        }}
      />
    </div>
  );
}
