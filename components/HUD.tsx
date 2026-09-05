"use client";
import { motion } from "framer-motion";
import { STAGE_NAMES, PetStage } from "@/lib/skills";

// Two rows, 44px hit targets, and no engineering toggles on the kid surface.
// Adaptive/AI switches render only when `debug` is true (?debug=1) — they are
// for judges and devs, not for an 8-year-old's thumb.

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
  muted,
  onToggleMute,
  debug,
  aiMode,
  onToggleAi,
  adaptiveMode,
  onToggleAdaptive,
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
  muted: boolean;
  onToggleMute: () => void;
  debug: boolean;
  aiMode: boolean;
  onToggleAi: () => void;
  adaptiveMode: boolean;
  onToggleAdaptive: () => void;
}) {
  const fullness = 100 - hunger;
  const hungerColor =
    hunger >= 70
      ? "from-red-400 to-orange-400"
      : hunger >= 40
      ? "from-amber-400 to-yellow-300"
      : "from-emerald-400 to-sky-400";
  const hungerLabel = hunger >= 70 ? "Hungry" : hunger >= 40 ? "Peckish" : "Full";

  return (
    <div className="space-y-2">
      {/* Row 1: identity + the four kid actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs uppercase text-gray-500 font-semibold truncate">{petName}</div>
          <div className="text-lg font-bold leading-tight">{STAGE_NAMES[stage]}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {streak > 0 && (
            <div className="chip-btn bg-orange-100 text-orange-700" aria-label={`${streak} in a row`}>
              🔥 {streak}
            </div>
          )}
          <button onClick={onPowers} className="chip-btn bg-sky-100 text-sky-800 font-bold" aria-label="Math Powers">
            ⚡ {masteredCount}/{totalPowers}
          </button>
          <button onClick={onShop} className="chip-btn bg-numi-coin/20 text-amber-800 font-bold" aria-label={`${coins} coins, open shop`}>
            ⭐ {coins}
          </button>
          <button onClick={onParent} className="chip-btn bg-violet-100 text-violet-700" aria-label="Parent and tutor view">
            👨‍👩‍👧
          </button>
        </div>
      </div>

      {/* Row 2: hunger + feed + mute */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600 w-14">{hungerLabel}</span>
        <div
          className="flex-1 h-3 bg-white/70 rounded-full overflow-hidden border border-amber-200 shadow-inner"
          role="progressbar"
          aria-label="Fullness"
          aria-valuenow={fullness}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className={`h-full bg-gradient-to-r ${hungerColor}`}
            initial={false}
            animate={{ width: `${fullness}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <button
          onClick={onFeed}
          disabled={!canFeed}
          className="chip-btn bg-emerald-100 text-emerald-800 font-bold disabled:opacity-40"
          aria-label="Feed a cupcake for 20 coins"
        >
          🧁
        </button>
        <button
          onClick={onToggleMute}
          className="chip-btn bg-white text-gray-500 border border-gray-300"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
          aria-pressed={muted}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* Row 3 (debug only): engineering toggles */}
      {debug && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="uppercase tracking-wide font-semibold">debug</span>
          <button
            onClick={onToggleAdaptive}
            className={`chip-btn ${adaptiveMode ? "bg-sky-500 text-white" : "bg-white text-gray-500 border border-gray-300"}`}
            aria-pressed={adaptiveMode}
          >
            🎯 {adaptiveMode ? "Adaptive" : "Script"}
          </button>
          <button
            onClick={onToggleAi}
            className={`chip-btn ${aiMode ? "bg-fuchsia-500 text-white" : "bg-white text-gray-500 border border-gray-300"}`}
            aria-pressed={aiMode}
          >
            🤖 {aiMode ? "AI" : "Off"}
          </button>
        </div>
      )}
    </div>
  );
}
