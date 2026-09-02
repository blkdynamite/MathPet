"use client";
import { useState } from "react";
import { Problem } from "@/lib/types";
import { AbacusInput } from "./AbacusInput";
import { VedicInput } from "./VedicInput";
import { LatticeInput } from "./LatticeInput";
import { NumberPad } from "./NumberPad";

export function QuestionCard({
  problem,
  onResult,
}: {
  problem: Problem;
  onResult: (correct: boolean, userAnswer: number) => void;
}) {
  const [val, setVal] = useState("");

  return (
    <div className="card space-y-3">
      <div className="text-xs uppercase font-bold text-gray-400 tracking-wide flex justify-between">
        <span>Technique: {problem.technique.toUpperCase()}</span>
        <span>Level {problem.difficulty}</span>
      </div>
      <div className="text-lg font-semibold text-gray-800 leading-snug">{problem.prompt}</div>

      {problem.technique === "abacus" && problem.abacus && (
        <AbacusInput
          target={problem.abacus.target}
          onSubmit={(v, ok) => onResult(ok, v)}
        />
      )}

      {problem.technique === "vedic" && problem.vedic && (
        <VedicInput
          kind={problem.vedic.kind}
          a={problem.vedic.a}
          b={problem.vedic.b}
          answer={problem.answer}
          onSubmit={(v, ok) => onResult(ok, v)}
        />
      )}

      {problem.technique === "lattice" && problem.lattice && (
        <LatticeInput
          a={problem.lattice.a}
          b={problem.lattice.b}
          answer={problem.answer}
          onSubmit={(v, ok) => onResult(ok, v)}
        />
      )}

      {problem.technique === "input" && (
        <>
          <div className="text-center text-2xl font-bold">
            Answer: <span className="text-numi-accent">{val || "?"}</span>
          </div>
          <NumberPad
            value={val}
            onChange={setVal}
            onSubmit={() => {
              const n = Number(val);
              if (!Number.isFinite(n)) return;
              onResult(n === problem.answer, n);
              setVal("");
            }}
          />
        </>
      )}
    </div>
  );
}
