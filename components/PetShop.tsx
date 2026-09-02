"use client";
import { SHOP } from "@/lib/shop";
import { motion } from "framer-motion";

export function PetShop({
  coins,
  owned,
  equipped,
  onBuy,
  onEquip,
  onClose,
}: {
  coins: number;
  owned: Set<string>;
  equipped: string | null;
  onBuy: (id: string) => void;
  onEquip: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-2"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-numi-bg rounded-3xl p-4 shadow-2xl border-4 border-amber-300 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">🛍️ Pet Shop</h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-numi-coin/20 rounded-full text-sm font-bold text-amber-800">
              ⭐ {coins}
            </span>
            <button onClick={onClose} className="text-2xl px-2 text-gray-500">
              ✕
            </button>
          </div>
        </div>

        {(["hat", "food", "background"] as const).map((cat) => (
          <div key={cat} className="mb-3">
            <div className="text-xs uppercase font-bold text-gray-500 tracking-wide mb-1">
              {cat === "hat" ? "Hats" : cat === "food" ? "Food" : "Backgrounds"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SHOP.filter((i) => i.kind === cat).map((item) => {
                const isOwned = owned.has(item.id);
                const isEquipped = equipped === item.id;
                const canAfford = coins >= item.price;
                return (
                  <div
                    key={item.id}
                    className={`card text-center p-2 ${isEquipped ? "border-emerald-400 border-2" : ""}`}
                  >
                    <div className="text-3xl">{item.emoji}</div>
                    <div className="text-xs font-semibold">{item.name}</div>
                    {isOwned ? (
                      <button
                        onClick={() => onEquip(item.id)}
                        disabled={cat !== "hat"}
                        className={`mt-1 text-xs font-bold w-full rounded-lg py-1 ${
                          isEquipped
                            ? "bg-emerald-500 text-white"
                            : cat === "hat"
                            ? "bg-sky-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isEquipped ? "Equipped" : cat === "hat" ? "Wear" : "Owned"}
                      </button>
                    ) : (
                      <button
                        onClick={() => canAfford && onBuy(item.id)}
                        disabled={!canAfford}
                        className={`mt-1 text-xs font-bold w-full rounded-lg py-1 ${
                          canAfford
                            ? "bg-numi-accent text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        ⭐ {item.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
