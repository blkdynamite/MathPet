import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        numi: {
          bg: "#fff8ec",
          ink: "#1f2937",
          accent: "#f97316",
          coin: "#fbbf24",
          good: "#22c55e",
          bad: "#ef4444",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", '"Fredoka"', "system-ui", "sans-serif"],
      },
      keyframes: {
        bob: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        wiggle: { "0%,100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
        pop: { "0%": { transform: "scale(0.6)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: {
        bob: "bob 3s ease-in-out infinite",
        wiggle: "wiggle 0.4s ease-in-out 3",
        pop: "pop 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
