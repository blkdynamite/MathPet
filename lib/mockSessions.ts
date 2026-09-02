import { Session } from "./types";

// Deterministic mock data for the Parent Summary demo.
// In production these would come from Supabase; here they show what the AI
// summary would generate from real telemetry.
export const MOCK_SESSIONS: Session[] = [
  { concept: "abacus_build",     correct: true,  hintsUsed: 0, timeSec: 12, technique: "abacus" },
  { concept: "abacus_build",     correct: true,  hintsUsed: 0, timeSec: 9,  technique: "abacus" },
  { concept: "mult_x11",         correct: true,  hintsUsed: 0, timeSec: 15, technique: "vedic" },
  { concept: "mult_x11",         correct: true,  hintsUsed: 1, timeSec: 22, technique: "vedic" },
  { concept: "division_word",    correct: false, hintsUsed: 2, timeSec: 45, technique: "input" },
  { concept: "division_word",    correct: true,  hintsUsed: 1, timeSec: 30, technique: "input" },
  { concept: "division_word",    correct: false, hintsUsed: 2, timeSec: 51, technique: "input" },
  { concept: "mult_2x2",         correct: true,  hintsUsed: 0, timeSec: 40, technique: "lattice" },
  { concept: "mult_2x2",         correct: true,  hintsUsed: 0, timeSec: 35, technique: "lattice" },
  { concept: "multistep_word",   correct: false, hintsUsed: 2, timeSec: 60, technique: "input" },
];
