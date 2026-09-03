"use client";
import { useState } from "react";
import { NumberPad } from "./NumberPad";

// Shows the box/lattice method for 2-digit × 2-digit as a 2x2 grid,
// pre-labeled with the split values. Kid fills the cells then the total.

export function LatticeInput({
  a,
  b,
  answer,
  onSubmit,
}: {
  a: number;
  b: number;
  answer: number;
  onSubmit: (value: number, correct: boolean) => void;
}) {
  const [val, setVal] = useState("");
  const aTens = Math.floor(a / 10) * 10;
  const aOnes = a % 10;
  const bTens = Math.floor(b / 10) * 10;
  const bOnes = b % 10;

  const cells = [
    [aTens * bTens, aOnes * bTens],
    [aTens * bOnes, aOnes * bOnes],
  ];

  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3">
        <div className="text-xs uppercase font-semibold text-emerald-700 tracking-wide text-center mb-1">
          Lattice for {a} × {b}
        </div>
        <div className="text-xs text-gray-600 text-center mb-2">
          Split {a} into {aTens} + {aOnes}, and {b} into {bTens} + {bOnes}
        </div>

        <div className="grid grid-cols-[auto_1fr_1fr] gap-1 text-center text-sm font-semibold">
          <div />
          <div className="bg-emerald-200 rounded py-1">{aTens}</div>
          <div className="bg-emerald-200 rounded py-1">{aOnes}</div>

          <div className="bg-emerald-200 rounded px-2 py-2 flex items-center justify-center">
            {bTens}
          </div>
          <div className="bg-white rounded py-3 text-emerald-700 flex flex-col leading-tight">
            <span className="text-[10px] text-gray-400">
              {aTens}×{bTens}
            </span>
            {cells[0][0]}
          </div>
          <div className="bg-white rounded py-3 text-emerald-700 flex flex-col leading-tight">
            <span className="text-[10px] text-gray-400">
              {aOnes}×{bTens}
            </span>
            {cells[0][1]}
          </div>

          <div className="bg-emerald-200 rounded px-2 py-2 flex items-center justify-center">
            {bOnes}
          </div>
          <div className="bg-white rounded py-3 text-emerald-700 flex flex-col leading-tight">
            <span className="text-[10px] text-gray-400">
              {aTens}×{bOnes}
            </span>
            {cells[1][0]}
          </div>
          <div className="bg-white rounded py-3 text-emerald-700 flex flex-col leading-tight">
            <span className="text-[10px] text-gray-400">
              {aOnes}×{bOnes}
            </span>
            {cells[1][1]}
          </div>
        </div>

        <div className="text-center text-xs text-gray-700 mt-2 font-semibold">
          Add all 4 cells: {cells[0][0]} + {cells[0][1]} + {cells[1][0]} + {cells[1][1]}
        </div>
      </div>

      <div className="text-center text-2xl font-bold">
        Total = <span className="text-numi-accent">{val || "?"}</span>
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
