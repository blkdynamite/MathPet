"use client";
import { motion } from "framer-motion";

export function HUD({
  petName,
  level,
  xp,
  xpToNext,
  coins,
  streak,
  onShop,
  onParent,
  onFeed,
  canFeed,
}: {
  petName: string;
  level: number;
  xp: number;
  xpToNext: number;
  coins: number;
  streak: number;
  onShop: () => void;
  onParent: () => void;
  onFeed: () => void;
  canFeed: boolean;
}) {
  const pct = Math.min(100, Math.round((xp / xpToNext) * 100));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="text-xs uppercase text-gray-500 font-semibold">{petName}</div>
          <div className="text-lg font-bold">Level {level}</div>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="chip bg-orange-100 text-orange-700 flex items-center gap-1">
              🔥 {streak}
            </div>
          )}
          <button
            onClick={onFeed}
            disabled={!canFeed}
            className="chip bg-emerald-100 text-emerald-800 font-bold disabled:opacity-40"
            title="Feed Sparky a cupcake (⭐20)"
          >
            🧁
          </button>
          <button onClick={onShop} className="chip bg-numi-coin/20 text-amber-800 font-bold">
            ⭐ {coins}
          </button>
          <button
            onClick={onParent}
            className="chip bg-sky-100 text-sky-700 font-semibold"
            aria-label="Parent view"
          >
            👨‍👩‍👧
          </button>
        </div>
      </div>

      <div className="h-3 bg-white/70 rounded-full overflow-hidden border border-amber-200 shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-sky-400"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="text-[10px] text-gray-500 text-right">
        {xp} / {xpToNext} XP
      </div>
    </div>
  );
}
