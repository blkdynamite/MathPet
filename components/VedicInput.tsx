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
          <div className="text-xs uppercase font-semibold text-fuchsia-700 tracking-wide">
            Vedic ×11 trick
          </div>
          <div className="mt-2 flex justify-center gap-3 text-3xl font-bold items-center">
            <span>{Math.floor(a / 10)}</span>
            <span className="text-fuchsia-400 text-2xl">_</span>
            <span>{a % 10}</span>
          </div>
          <div className="text-sm text-gray-700 mt-2 space-y-0.5">
            <div>
              <b>Step 1:</b> add the digits → {Math.floor(a / 10)} + {a % 10} ={" "}
              <b className="text-fuchsia-700">{Math.floor(a / 10) + (a % 10)}</b>
            </div>
            <div>
              <b>Step 2:</b> drop the sum in the middle → {Math.floor(a / 10)}
              <span className="text-fuchsia-700"> {Math.floor(a / 10) + (a % 10)} </span>
              {a % 10}
            </div>
            {Math.floor(a / 10) + (a % 10) >= 10 && (
              <div className="text-xs text-orange-600 italic">
                Sum ≥ 10 → carry the 1 to the front!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-fuchsia-50 border-2 border-fuchsia-200 rounded-2xl p-3 text-center">
          <div className="text-xs uppercase font-semibold text-fuchsia-700 tracking-wide">
            Both close to 100
          </div>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div>
              <b>Step 1 · deficits:</b> 100 − {a} = <b>{100 - a}</b> · 100 − {b} = <b>{100 - b}</b>
            </div>
            <div>
              <b>Step 2 · cross-subtract:</b> {a} − {100 - b} ={" "}
              <b className="text-fuchsia-700">{a - (100 - b)}</b> (first digits)
            </div>
            <div>
              <b>Step 3 · multiply deficits:</b> {100 - a} × {100 - b} ={" "}
              <b className="text-fuchsia-700">{(100 - a) * (100 - b)}</b> (last digits)
            </div>
            <div className="pt-1 text-gray-500 italic">
              Stick them together — that&apos;s your answer.
            </div>
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
