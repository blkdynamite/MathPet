"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INTERESTS = [
  { id: "space", label: "Space", emoji: "🚀" },
  { id: "animals", label: "Animals", emoji: "🐾" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "art", label: "Art", emoji: "🎨" },
  { id: "music", label: "Music", emoji: "🎵" },
];

export function Onboarding({
  onDone,
}: {
  onDone: (data: { name: string; interests: string[] }) => void;
}) {
  const [name, setName] = useState("Sparky");
  const [picked, setPicked] = useState<string[]>([]);
  const [phase, setPhase] = useState<"pick" | "hatch">("pick");

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  }

  if (phase === "hatch") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-amber-100 to-amber-50">
        <motion.div
          animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5 }}
          className="text-9xl"
          onAnimationComplete={() => setTimeout(() => onDone({ name, interests: picked }), 400)}
        >
          🥚
        </motion.div>
        <div className="mt-6 text-2xl font-bold">Hatching {name}…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="text-6xl mb-4">🥚</div>
      <h1 className="text-3xl font-bold mb-1">Meet your pet!</h1>
      <p className="text-gray-600 text-center mb-6">
        Pick a name and up to 3 things you like — Sparky&apos;s math problems will use them.
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 12))}
        className="w-full text-center text-xl font-bold p-3 rounded-2xl border-2 border-amber-300 mb-4 bg-white"
        placeholder="Pet name"
      />

      <div className="grid grid-cols-3 gap-2 w-full mb-6">
        {INTERESTS.map((i) => {
          const on = picked.includes(i.id);
          return (
            <motion.button
              key={i.id}
              onClick={() => {
                if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                  try {
                    navigator.vibrate(12);
                  } catch {
                    /* ignore */
                  }
                }
                toggle(i.id);
              }}
              whileTap={{ scale: 0.9 }}
              animate={on ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className={`card p-3 flex flex-col items-center ${
                on ? "border-2 border-emerald-400 bg-emerald-50 shadow-md" : ""
              }`}
            >
              <div className="text-3xl">{i.emoji}</div>
              <div className="text-xs font-semibold mt-1">{i.label}</div>
              {on && <div className="text-[10px] text-emerald-600 font-bold">✓ picked</div>}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {picked.length > 0 && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase("hatch")}
            className="w-full py-4 rounded-2xl bg-numi-accent text-white font-bold text-lg shadow-lg"
          >
            Hatch {name}! ✨
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
