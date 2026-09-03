"use client";
import { motion } from "framer-motion";
import { SHOP } from "@/lib/shop";

export type NudgeReason = "streak" | "levelup";

export function RewardNudge({
  reason,
  petName,
  coins,
  streak,
  hunger,
  onFeed,
  onShop,
  onDismiss,
}: {
  reason: NudgeReason;
  petName: string;
  coins: number;
  streak: number;
  hunger: number; // 0 full … 100 starving
  onFeed: (itemId: string) => void;
  onShop: () => void;
  onDismiss: () => void;
}) {
  const foods = SHOP.filter((i) => i.kind === "food");
  const title = reason === "streak" ? `🔥 ${streak} in a row!` : `✨ ${petName} evolved!`;
  const body =
    reason === "streak"
      ? `${petName} is proud of you. Pick a treat to feed ${petName} — you have ⭐${coins}.`
      : `You earned +25 coins. Celebrate with a treat — you have ⭐${coins}.`;
  const fullness = 100 - hunger;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3"
    >
      <motion.div
        initial={{ y: 30, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-5 text-center"
      >
        <div className="text-2xl font-bold text-numi-accent">{title}</div>
        <div className="text-sm text-gray-700 mt-1 mb-3">{body}</div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold text-gray-500 w-10 text-left">
            {hunger >= 70 ? "Hungry" : hunger >= 40 ? "Peckish" : "Full"}
          </span>
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${hunger >= 70 ? "bg-red-400" : hunger >= 40 ? "bg-amber-400" : "bg-emerald-400"}`}
              style={{ width: `${fullness}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {foods.map((f) => {
            const can = coins >= f.price;
            return (
              <motion.button
                key={f.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => can && onFeed(f.id)}
                disabled={!can}
                className={`rounded-2xl border-2 p-2 flex flex-col items-center gap-0.5 ${
                  can ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-gray-50 opacity-50"
                }`}
              >
                <span className="text-3xl">{f.emoji}</span>
                <span className="text-xs font-bold">{f.name}</span>
                <span className="text-[10px] text-gray-500">{f.effect}</span>
                <span className="text-xs font-bold text-amber-700">⭐ {f.price}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onShop}
            className="flex-1 py-2.5 rounded-2xl bg-sky-500 text-white font-bold text-sm shadow"
          >
            🛍️ Shop
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-2xl bg-white border border-gray-300 text-gray-600 font-semibold text-sm"
          >
            Keep practicing
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
