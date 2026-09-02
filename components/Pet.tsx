"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export type PetMood = "idle" | "thinking" | "happy" | "sad" | "levelup";

export function Pet({
  mood,
  hat,
  bubble,
}: {
  mood: PetMood;
  hat?: string | null;
  bubble?: string | null;
}) {
  const [confetti, setConfetti] = useState<Array<{ dx: number; dy: number; color: string }>>([]);

  useEffect(() => {
    if (mood === "levelup") {
      const dots = Array.from({ length: 24 }).map(() => ({
        dx: (Math.random() - 0.5) * 320,
        dy: -Math.random() * 220 - 40,
        color: ["#f97316", "#22c55e", "#0ea5e9", "#fbbf24", "#ec4899"][Math.floor(Math.random() * 5)],
      }));
      setConfetti(dots);
      const t = setTimeout(() => setConfetti([]), 1000);
      return () => clearTimeout(t);
    }
  }, [mood]);

  const eyeY = mood === "sad" ? 4 : mood === "thinking" ? -2 : 0;
  const mouthPath =
    mood === "happy" || mood === "levelup"
      ? "M 65 118 Q 90 138 115 118"
      : mood === "sad"
      ? "M 65 125 Q 90 108 115 125"
      : "M 70 122 Q 90 128 110 122";

  const anim =
    mood === "happy" || mood === "levelup"
      ? { y: [0, -12, 0], transition: { duration: 0.5, repeat: mood === "levelup" ? 2 : 0 } }
      : mood === "sad"
      ? { rotate: [-3, 3, -3, 3, 0], transition: { duration: 0.4 } }
      : { y: [0, -4, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } };

  return (
    <div className="relative w-full flex justify-center items-end pt-4 pb-2">
      {/* confetti */}
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

      {/* speech bubble */}
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white border-2 border-amber-300 rounded-2xl px-4 py-2 shadow-md text-sm font-semibold text-gray-700 max-w-[80%] text-center z-10"
          >
            {bubble}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-amber-300 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div animate={anim} className="relative">
        {/* hat */}
        {hat && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-5xl select-none">
            {hat}
          </div>
        )}

        {/* SVG pet: a chunky round creature */}
        <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
          {/* body shadow */}
          <ellipse cx="90" cy="165" rx="55" ry="6" fill="rgba(0,0,0,0.12)" />
          {/* body */}
          <ellipse cx="90" cy="105" rx="65" ry="55" fill="#fb923c" stroke="#c2410c" strokeWidth="3" />
          {/* belly */}
          <ellipse cx="90" cy="120" rx="40" ry="30" fill="#fed7aa" />
          {/* ears */}
          <path d="M 40 65 Q 25 30 55 45 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="3" />
          <path d="M 140 65 Q 155 30 125 45 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="3" />
          {/* cheeks */}
          <circle cx="55" cy="110" r="8" fill="#fca5a5" opacity="0.7" />
          <circle cx="125" cy="110" r="8" fill="#fca5a5" opacity="0.7" />
          {/* eyes */}
          <g transform={`translate(0 ${eyeY})`}>
            {mood === "happy" || mood === "levelup" ? (
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
          {/* mouth */}
          <path d={mouthPath} stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* feet */}
          <ellipse cx="65" cy="158" rx="14" ry="8" fill="#c2410c" />
          <ellipse cx="115" cy="158" rx="14" ry="8" fill="#c2410c" />
        </svg>
      </motion.div>
    </div>
  );
}
