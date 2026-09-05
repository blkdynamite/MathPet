"use client";
import { SKILLS, SkillProgress, isMastered, MASTERY_THRESHOLD, STAGE_NAMES, PetStage } from "@/lib/skills";
import { Modal } from "./Modal";

export function SkillMap({
  progress,
  stage,
  onClose,
}: {
  progress: SkillProgress;
  stage: PetStage;
  onClose: () => void;
}) {
  const mastered = SKILLS.filter((s) => isMastered(progress, s.id)).length;
  const next = stage === 0 ? 1 : stage === 1 ? 3 : stage === 2 ? 5 : null;

  return (
    <Modal onClose={onClose} labelledBy="powers-title">
      <div className="bg-numi-bg rounded-3xl p-4 border-4 border-sky-300">
        <div className="flex items-center justify-between mb-1">
          <h2 id="powers-title" className="text-xl font-bold">⚡ Math Powers</h2>
          <button onClick={onClose} className="text-2xl px-2 text-gray-500" aria-label="Close Math Powers">
            ✕
          </button>
        </div>
        <div className="text-xs text-gray-600 mb-3">
          {mastered} of {SKILLS.length} mastered · Sparky is a <b>{STAGE_NAMES[stage]}</b>
          {next && (
            <>
              {" "}· {next - mastered} more to evolve
            </>
          )}
        </div>

        <ul className="grid grid-cols-2 gap-2 list-none">
          {SKILLS.map((s) => {
            const p = progress[s.id];
            const done = isMastered(progress, s.id);
            const pct = Math.min(100, Math.round((p.cleanSolves / MASTERY_THRESHOLD) * 100));
            return (
              <li
                key={s.id}
                className={`card p-3 ${
                  done ? "border-2 border-emerald-400 bg-emerald-50" : p.attempts > 0 ? "border-amber-300" : "opacity-70"
                }`}
                aria-label={`${s.name}: ${done ? "mastered" : `${p.cleanSolves} of ${MASTERY_THRESHOLD} clean solves`}`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-2xl" aria-hidden="true">{done ? "🏅" : s.emoji}</div>
                  <div className="leading-tight">
                    <div className="text-sm font-bold">{s.name}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">{s.family}</div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">{s.oneLiner}</div>
                <div
                  className="mt-2 h-1.5 bg-white rounded-full overflow-hidden border border-gray-200"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className={`h-full ${done ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                  <span>{done ? "Mastered" : `${p.cleanSolves}/${MASTERY_THRESHOLD} clean solves`}</span>
                  <span className="font-mono">{s.ccss[0]}</span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="text-[10px] text-gray-400 mt-3 text-center">
          A clean solve = correct on the first try, no scaffold. Powers are the strategies, not the answers.
        </div>
      </div>
    </Modal>
  );
}
