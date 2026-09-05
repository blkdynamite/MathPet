"use client";
import { useState } from "react";
import { Problem } from "@/lib/types";
import { getSkill } from "@/lib/skills";
import { AbacusInput } from "./AbacusInput";
import { VedicInput } from "./VedicInput";
import { LatticeInput } from "./LatticeInput";
import { NumberPad } from "./NumberPad";

export function QuestionCard({
  problem,
  disabled = false,
  onResult,
  onAskHelp,
}: {
  problem: Problem;
  /** Disables every input in the card (native <fieldset disabled>) — used by
   *  the page's phase machine so taps during a celebration or scaffold are inert. */
  disabled?: boolean;
  onResult: (correct: boolean, userAnswer: number) => void;
  onAskHelp: () => void;
}) {
  const [val, setVal] = useState("");

  return (
    <fieldset disabled={disabled} aria-busy={disabled} className="card space-y-3 disabled:opacity-90">
      <div className="text-xs font-bold text-gray-400 tracking-wide flex justify-between items-center">
        <span className="text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-2 py-0.5">
          ⚡ {getSkill(problem.skillId).emoji} {getSkill(problem.skillId).name}
        </span>
        <span className="font-mono text-[10px]">{problem.ccss[0]}</span>
      </div>
      <div className="text-lg font-semibold text-gray-800 leading-snug">{problem.prompt}</div>
      {problem.hint && (
        <div className="text-sm text-gray-500 font-normal leading-snug -mt-1">
          <span className="text-gray-400">Hint:</span> {problem.hint}
        </div>
      )}

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

      <button
        onClick={onAskHelp}
        className="w-full text-center text-sm text-sky-700 font-semibold py-2 rounded-xl bg-sky-50 border border-sky-100"
      >
        🤔 I&apos;m stuck — help me build up
      </button>
    </fieldset>
  );
}
