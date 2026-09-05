"use client";
import { SHOP } from "@/lib/shop";
import { Modal } from "./Modal";
import { motion } from "framer-motion";

// Item copy now matches what actually happens. Food resets the hunger timer
// (that's what "feed" does in the game loop); "XP" was never a stat in this
// build, so a claim like "+5 XP" was trust-breaking. Backgrounds don't yet
// change the scene, so they're marked "Coming soon" and disabled — a kid
// can't spend 100 coins on a no-op.

const KID_HINTS: Record<string, string> = {
  "hat-wizard": "Style points",
  "hat-astro": "Space ready",
  "hat-cape": "Fly around",
  "food-cupcake": "Feeds Sparky",
  "food-pizza": "Feeds Sparky",
  "food-smoothie": "Rainbow feed",
};

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
    <Modal onClose={onClose} labelledBy="shop-title">
      <div className="bg-numi-bg rounded-3xl p-4 border-4 border-amber-300">
        <div className="flex items-center justify-between mb-3">
          <h2 id="shop-title" className="text-xl font-bold">🛍️ Pet Shop</h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-numi-coin/20 rounded-full text-sm font-bold text-amber-800" aria-label={`${coins} coins`}>
              ⭐ {coins}
            </span>
            <button onClick={onClose} className="text-2xl px-2 text-gray-500" aria-label="Close shop">
              ✕
            </button>
          </div>
        </div>

        {(["hat", "food", "background"] as const).map((cat) => (
          <div key={cat} className="mb-3">
            <div className="text-xs uppercase font-bold text-gray-500 tracking-wide mb-1">
              {cat === "hat" ? "Hats" : cat === "food" ? "Food" : "Backgrounds — coming soon"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SHOP.filter((i) => i.kind === cat).map((item) => {
                const isOwned = owned.has(item.id);
                const isEquipped = equipped === item.id;
                const notYet = cat === "background";
                const canAfford = coins >= item.price && !notYet;
                const hint = KID_HINTS[item.id];
                return (
                  <motion.div
                    key={item.id}
                    whileHover={notYet ? undefined : { y: -2 }}
                    className={`card text-center p-2 ${isEquipped ? "border-emerald-400 border-2" : ""} ${notYet ? "opacity-60" : ""}`}
                  >
                    <div className="text-3xl" aria-hidden="true">{item.emoji}</div>
                    <div className="text-xs font-semibold">{item.name}</div>
                    {hint && !notYet && <div className="text-[10px] text-gray-500">{hint}</div>}
                    {notYet && <div className="text-[10px] text-gray-500">Not ready yet</div>}
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
                        aria-label={
                          isEquipped
                            ? `${item.name} equipped`
                            : cat === "hat"
                            ? `Wear ${item.name}`
                            : `${item.name} owned`
                        }
                      >
                        {isEquipped ? "Equipped" : cat === "hat" ? "Wear" : "Owned"}
                      </button>
                    ) : (
                      <button
                        onClick={() => canAfford && onBuy(item.id)}
                        disabled={!canAfford}
                        className={`mt-1 text-xs font-bold w-full rounded-lg py-1 ${
                          canAfford ? "bg-numi-accent text-white" : "bg-gray-200 text-gray-400"
                        }`}
                        aria-label={
                          notYet
                            ? `${item.name} — coming soon`
                            : canAfford
                            ? `Buy ${item.name} for ${item.price} coins`
                            : `${item.name} costs ${item.price} coins — not enough yet`
                        }
                      >
                        ⭐ {item.price}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
