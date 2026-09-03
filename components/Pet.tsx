"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { PetStage } from "@/lib/skills";

export type PetMood = "idle" | "thinking" | "happy" | "sad" | "levelup" | "evolve" | "hungry";

const STAGE_SCALE: Record<PetStage, number> = { 0: 0.88, 1: 1, 2: 1.08, 3: 1.16 };

export function Pet({
  mood,
  stage = 0,
  hat,
  bubble,
}: {
  mood: PetMood;
  stage?: PetStage;
  hat?: string | null;
  bubble?: string | null;
}) {
  const [confetti, setConfetti] = useState<Array<{ dx: number; dy: number; color: string }>>([]);

  useEffect(() => {
    if (mood === "levelup" || mood === "evolve") {
      const n = mood === "evolve" ? 40 : 24;
      const palette =
        mood === "evolve"
          ? ["#a78bfa", "#60a5fa", "#fbbf24", "#f472b6", "#34d399"]
          : ["#f97316", "#22c55e", "#0ea5e9", "#fbbf24", "#ec4899"];
      const dots = Array.from({ length: n }).map(() => ({
        dx: (Math.random() - 0.5) * 340,
        dy: -Math.random() * 240 - 40,
        color: palette[Math.floor(Math.random() * palette.length)],
      }));
      setConfetti(dots);
      const t = setTimeout(() => setConfetti([]), 1100);
      return () => clearTimeout(t);
    }
  }, [mood]);

  const eyeY = mood === "sad" || mood === "hungry" ? 4 : mood === "thinking" ? -2 : 0;
  const happy = mood === "happy" || mood === "levelup" || mood === "evolve";
  const mouthPath = happy
    ? "M 65 118 Q 90 138 115 118"
    : mood === "sad" || mood === "hungry"
    ? "M 65 125 Q 90 108 115 125"
    : "M 70 122 Q 90 128 110 122";

  const anim =
    mood === "evolve"
      ? { scale: [1, 1.25, 0.9, 1.1, 1], rotate: [0, -6, 6, -3, 0], transition: { duration: 1.2 } }
      : happy
      ? { y: [0, -12, 0], transition: { duration: 0.5, repeat: mood === "levelup" ? 2 : 0 } }
      : mood === "sad"
      ? { rotate: [-3, 3, -3, 3, 0], transition: { duration: 0.4 } }
      : mood === "hungry"
      ? { y: [0, -2, 0], rotate: [-1.5, 1.5, -1.5], transition: { duration: 1.2, repeat: Infinity } }
      : { y: [0, -4, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } };

  // Stage-driven body palette: same creature, growing brighter/more magical.
  const body = ["#fb923c", "#fb923c", "#f59e0b", "#a78bfa"][stage];
  const stroke = ["#c2410c", "#c2410c", "#b45309", "#6d28d9"][stage];
  const belly = ["#fed7aa", "#fed7aa", "#fde68a", "#ede9fe"][stage];

  return (
    <div className="relative w-full flex justify-center items-end pt-4 pb-2">
      {confetti.map((c, i) => (
        <span
          key={i}
          className="confetti-dot"
          style={
            {
              left: "50%",
              top: "50%",
              background: c.color,
              "--dx": `${c.dx}px`,
              "--dy": `${c.dy}px`,
            } as React.CSSProperties
          }
        />
      ))}

      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white border-2 border-amber-300 rounded-2xl px-4 py-2 shadow-md text-sm font-semibold text-gray-700 max-w-[85%] text-center z-10"
          >
            {bubble}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-amber-300 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div animate={anim} className="relative" style={{ scale: STAGE_SCALE[stage] }}>
        {hat && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-5xl select-none z-10">
            {hat}
          </div>
        )}

        {/* Sage aura */}
        {stage === 3 && (
          <div className="absolute inset-0 -m-6 rounded-full bg-violet-300/30 blur-xl animate-pulse" />
        )}

        <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="90" cy="165" rx="55" ry="6" fill="rgba(0,0,0,0.12)" />

          {/* Wizard+ wings */}
          {stage >= 2 && (
            <>
              <path d="M 30 100 Q 5 70 28 60 Q 40 85 45 110 Z" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="2" />
              <path d="M 150 100 Q 175 70 152 60 Q 140 85 135 110 Z" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="2" />
            </>
          )}

          <ellipse cx="90" cy="105" rx="65" ry="55" fill={body} stroke={stroke} strokeWidth="3" />
          <ellipse cx="90" cy="120" rx="40" ry="30" fill={belly} />

          {/* Wizard+ star on belly */}
          {stage >= 2 && (
            <text x="90" y="128" textAnchor="middle" fontSize="22">
              ⭐
            </text>
          )}

          <path d="M 40 65 Q 25 30 55 45 Z" fill={body} stroke={stroke} strokeWidth="3" />
          <path d="M 140 65 Q 155 30 125 45 Z" fill={body} stroke={stroke} strokeWidth="3" />

          {/* Sprite+ sprout */}
          {stage >= 1 && (
            <g>
              <path d="M 90 52 Q 90 36 90 30" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" />
              <ellipse cx="82" cy="34" rx="7" ry="4" fill="#4ade80" transform="rotate(-30 82 34)" />
              <ellipse cx="98" cy="34" rx="7" ry="4" fill="#4ade80" transform="rotate(30 98 34)" />
            </g>
          )}

          <circle cx="55" cy="110" r="8" fill="#fca5a5" opacity="0.7" />
          <circle cx="125" cy="110" r="8" fill="#fca5a5" opacity="0.7" />

          <g transform={`translate(0 ${eyeY})`}>
            {happy ? (
              <>
                <path d="M 60 90 Q 68 82 76 90" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M 104 90 Q 112 82 120 90" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="68" cy="90" r="7" fill="#1f2937" />
                <circle cx="112" cy="90" r="7" fill="#1f2937" />
                <circle cx="70" cy="88" r="2" fill="#fff" />
                <circle cx="114" cy="88" r="2" fill="#fff" />
              </>
            )}
          </g>
          <path d={mouthPath} stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="65" cy="158" rx="14" ry="8" fill={stroke} />
          <ellipse cx="115" cy="158" rx="14" ry="8" fill={stroke} />
        </svg>
      </motion.div>
    </div>
  );
}
