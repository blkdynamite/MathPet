"use client";
import { motion } from "framer-motion";
import { SKILLS, SkillProgress, isMastered, MASTERY_THRESHOLD, STAGE_NAMES, PetStage } from "@/lib/skills";

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-2"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-numi-bg rounded-3xl p-4 shadow-2xl border-4 border-sky-300 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold">⚡ Math Powers</h2>
          <button onClick={onClose} className="text-2xl px-2 text-gray-500">
            ✕
          </button>
        </div>
        <div className="text-xs text-gray-600 mb-3">
          {mastered} of {SKILLS.length} mastered · Sparky is a <b>{STAGE_NAMES[stage]}</b>
          {next && (
            <>
              {" "}
              · {next - mastered} more to evolve
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SKILLS.map((s) => {
            const p = progress[s.id];
            const done = isMastered(progress, s.id);
            const pct = Math.min(100, Math.round((p.cleanSolves / MASTERY_THRESHOLD) * 100));
            return (
              <div
                key={s.id}
                className={`card p-3 ${
                  done ? "border-2 border-emerald-400 bg-emerald-50" : p.attempts > 0 ? "border-amber-300" : "opacity-70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{done ? "🏅" : s.emoji}</div>
                  <div className="leading-tight">
                    <div className="text-sm font-bold">{s.name}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wide">{s.family}</div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-600 mt-1">{s.oneLiner}</div>
                <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden border border-gray-200">
                  <div
                    className={`h-full ${done ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                  <span>
                    {done ? "Mastered" : `${p.cleanSolves}/${MASTERY_THRESHOLD} clean solves`}
                  </span>
                  <span className="font-mono">{s.ccss[0]}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] text-gray-400 mt-3 text-center">
          A clean solve = correct on the first try, no scaffold. Powers are the strategies, not the answers.
        </div>
      </motion.div>
    </motion.div>
  );
}
