"use client";
import { motion } from "framer-motion";

export type NudgeReason = "streak" | "levelup";

export function RewardNudge({
  reason,
  coins,
  streak,
  onFeed,
  onShop,
  onDismiss,
  canFeed,
}: {
  reason: NudgeReason;
  coins: number;
  streak: number;
  onFeed: () => void;
  onShop: () => void;
  onDismiss: () => void;
  canFeed: boolean;
}) {
  const title =
    reason === "streak"
      ? `🔥 ${streak} in a row!`
      : `🎉 Level up!`;
  const body =
    reason === "streak"
      ? `Sparky is proud of you. Reward yourself — feed a treat or spend your ⭐${coins} in the shop.`
      : `You leveled up and earned +25 coins. That's ⭐${coins} to spend on Sparky!`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3"
    >
      <motion.div
        initial={{ y: 30, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-5 text-center"
      >
        <div className="text-4xl mb-2">{reason === "streak" ? "🔥" : "🎉"}</div>
        <div className="text-2xl font-bold text-numi-accent mb-1">{title}</div>
        <div className="text-sm text-gray-700 mb-4">{body}</div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onFeed}
            disabled={!canFeed}
            className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold shadow disabled:opacity-40"
          >
            🧁 Feed Sparky a Cupcake (⭐ 20)
          </button>
          <button
            onClick={onShop}
            className="w-full py-3 rounded-2xl bg-sky-500 text-white font-bold shadow"
          >
            🛍️ Open the Pet Shop
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2 rounded-2xl bg-white border border-gray-300 text-gray-600 font-semibold text-sm"
          >
            Keep practicing
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
