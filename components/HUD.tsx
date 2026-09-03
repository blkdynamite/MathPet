"use client";
import { motion } from "framer-motion";
import { STAGE_NAMES, PetStage } from "@/lib/skills";

export function HUD({
  petName,
  stage,
  masteredCount,
  totalPowers,
  hunger,
  coins,
  streak,
  onShop,
  onParent,
  onPowers,
  onFeed,
  canFeed,
  aiMode,
  onToggleAi,
}: {
  petName: string;
  stage: PetStage;
  masteredCount: number;
  totalPowers: number;
  hunger: number; // 0 = full, 100 = starving
  coins: number;
  streak: number;
  onShop: () => void;
  onParent: () => void;
  onPowers: () => void;
  onFeed: () => void;
  canFeed: boolean;
  aiMode: boolean;
  onToggleAi: () => void;
}) {
  const fullness = 100 - hunger;
  const hungerColor =
    hunger >= 70 ? "from-red-400 to-orange-400" : hunger >= 40 ? "from-amber-400 to-yellow-300" : "from-emerald-400 to-sky-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="text-xs uppercase text-gray-500 font-semibold">{petName}</div>
          <div className="text-lg font-bold leading-tight">{STAGE_NAMES[stage]}</div>
        </div>
        <div className="flex items-center gap-1.5">
          {streak > 0 && (
            <div className="chip bg-orange-100 text-orange-700 flex items-center gap-1">🔥 {streak}</div>
          )}
          <button
            onClick={onPowers}
            className="chip bg-sky-100 text-sky-800 font-bold"
            title="Math Powers"
          >
            ⚡ {masteredCount}/{totalPowers}
          </button>
          <button
            onClick={onToggleAi}
            className={`chip font-bold ${
              aiMode
                ? "bg-fuchsia-500 text-white"
                : "bg-white text-gray-500 border border-gray-300"
            }`}
            title={aiMode ? "AI mode: problems generated live" : "Switch to AI-generated problems"}
          >
            🤖 {aiMode ? "AI" : "Off"}
          </button>
          <button
            onClick={onFeed}
            disabled={!canFeed}
            className="chip bg-emerald-100 text-emerald-800 font-bold disabled:opacity-40"
            title="Feed a cupcake (⭐20)"
          >
            🧁
          </button>
          <button onClick={onShop} className="chip bg-numi-coin/20 text-amber-800 font-bold">
            ⭐ {coins}
          </button>
          <button
            onClick={onParent}
            className="chip bg-violet-100 text-violet-700 font-semibold"
            aria-label="Parent & tutor view"
          >
            👨‍👩‍👧
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-gray-500 w-12">
          {hunger >= 70 ? "HUNGRY" : hunger >= 40 ? "Peckish" : "Full"}
        </span>
        <div className="flex-1 h-3 bg-white/70 rounded-full overflow-hidden border border-amber-200 shadow-inner">
          <motion.div
            className={`h-full bg-gradient-to-r ${hungerColor}`}
            initial={false}
            animate={{ width: `${fullness}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <span className="text-[10px] text-gray-500 w-8 text-right">{fullness}%</span>
      </div>
    </div>
  );
}
