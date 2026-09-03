import { Session } from "./types";

// Seed telemetry for the Parent Summary / Tutor Brief when a fresh browser
// hasn't played enough yet. The app prefers REAL sessions from the current
// device and only falls back to these. In production this table is Nerdy's.
const base = Date.now() - 3 * 24 * 3600 * 1000;
const t = (h: number) => base + h * 3600 * 1000;

export const MOCK_SESSIONS: Session[] = [
  { ts: t(0),  problemId: "ab-3", skillId: "make10",    concept: "abacus_add",          ccss: ["2.OA.B.2"],  technique: "input",   correct: true,  firstTry: true,  scaffoldUsed: false, timeSec: 11 },
  { ts: t(0.1),problemId: "ab-4", skillId: "make10",    concept: "abacus_add",          ccss: ["2.OA.B.2"],  technique: "input",   correct: true,  firstTry: true,  scaffoldUsed: false, timeSec: 9 },
  { ts: t(0.2),problemId: "ab-1", skillId: "abacus",    concept: "abacus_build_23",     ccss: ["2.NBT.A.1"], technique: "abacus",  correct: true,  firstTry: true,  scaffoldUsed: false, timeSec: 14 },
  { ts: t(24), problemId: "wp-1", skillId: "fairshare", concept: "division_word",       ccss: ["3.OA.A.2"],  technique: "input",   correct: true,  firstTry: false, scaffoldUsed: true,  misconception: "multiplied_instead_of_divided", userAnswer: 144, timeSec: 48 },
  { ts: t(24.2),problemId:"wp-2", skillId: "fairshare", concept: "division_word",       ccss: ["3.OA.A.2"],  technique: "input",   correct: true,  firstTry: false, scaffoldUsed: true,  misconception: "multiplied_instead_of_divided", userAnswer: 576, timeSec: 52 },
  { ts: t(24.4),problemId:"ve-1", skillId: "x11",       concept: "mult_x11",            ccss: ["4.NBT.B.5"], technique: "vedic",   correct: true,  firstTry: true,  scaffoldUsed: false, timeSec: 16 },
  { ts: t(48), problemId: "ve-2", skillId: "x11",       concept: "mult_x11",            ccss: ["4.NBT.B.5"], technique: "vedic",   correct: true,  firstTry: true,  scaffoldUsed: false, timeSec: 13 },
  { ts: t(48.2),problemId:"la-1", skillId: "lattice",   concept: "mult_2x2",            ccss: ["4.NBT.B.5"], technique: "lattice", correct: true,  firstTry: false, scaffoldUsed: true,  misconception: "skipped_a_step", userAnswer: 600, timeSec: 61 },
  { ts: t(48.4),problemId:"wp-3", skillId: "twostep",   concept: "multistep_word",      ccss: ["3.OA.D.8"],  technique: "input",   correct: true,  firstTry: false, scaffoldUsed: true,  misconception: "skipped_a_step", userAnswer: 45,  timeSec: 58 },
  { ts: t(48.6),problemId:"wp-7", skillId: "fairshare", concept: "division_word",       ccss: ["3.OA.A.2"],  technique: "input",   correct: true,  firstTry: true,  scaffoldUsed: false, timeSec: 30 },
];
