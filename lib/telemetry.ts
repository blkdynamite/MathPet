import { Session } from "./types";
import { SKILLS, SkillId, getSkill, MASTERY_THRESHOLD } from "./skills";
import { MISCONCEPTION_LABELS, Misconception } from "./misconceptions";

// Code does the math; the LLM does the language. Both the Parent Summary and
// the Tutor Brief receive this compact, pre-aggregated table — never raw logs.

export type SkillStat = {
  skillId: SkillId;
  name: string;
  family: string;
  ccss: string[];
  attempts: number;
  firstTry: number;
  scaffolds: number;
  avgTimeSec: number;
  mastered: boolean;
  misconceptions: { type: Misconception; label: string; count: number }[];
};

export type Aggregate = {
  totalAttempts: number;
  accuracyFirstTry: number;     // 0..1
  scaffoldRate: number;         // 0..1
  masteredPowers: string[];
  strongest?: SkillStat;
  weakest?: SkillStat;
  topMisconception?: { type: Misconception; label: string; count: number; skill: string };
  bySkill: SkillStat[];
  daysActive: number;
};

export function aggregate(sessions: Session[]): Aggregate {
  const bySkill = new Map<SkillId, SkillStat>();
  for (const s of sessions) {
    const skill = getSkill(s.skillId);
    const stat =
      bySkill.get(s.skillId) ??
      ({
        skillId: s.skillId,
        name: skill.name,
        family: skill.family,
        ccss: skill.ccss,
        attempts: 0,
        firstTry: 0,
        scaffolds: 0,
        avgTimeSec: 0,
        mastered: false,
        misconceptions: [],
      } as SkillStat);
    stat.attempts += 1;
    stat.firstTry += s.firstTry ? 1 : 0;
    stat.scaffolds += s.scaffoldUsed ? 1 : 0;
    stat.avgTimeSec += s.timeSec;
    if (s.misconception && s.misconception !== "unknown") {
      const m = stat.misconceptions.find((x) => x.type === s.misconception);
      if (m) m.count += 1;
      else
        stat.misconceptions.push({
          type: s.misconception,
          label: MISCONCEPTION_LABELS[s.misconception],
          count: 1,
        });
    }
    bySkill.set(s.skillId, stat);
  }
  const stats = [...bySkill.values()].map((st) => ({
    ...st,
    avgTimeSec: Math.round(st.avgTimeSec / st.attempts),
    mastered: st.firstTry >= MASTERY_THRESHOLD,
    misconceptions: st.misconceptions.sort((a, b) => b.count - a.count),
  }));

  const total = sessions.length;
  const firstTry = sessions.filter((s) => s.firstTry).length;
  const scaffolds = sessions.filter((s) => s.scaffoldUsed).length;

  // strongest = highest first-try rate (ties → more attempts).
  // weakest = most scaffolds needed (ties → lowest first-try rate). Using
  // scaffold count keeps "weakest" aligned with where misconceptions occurred
  // rather than a single unlucky attempt.
  const rate = (s: SkillStat) => s.firstTry / s.attempts;
  const strongest = [...stats].sort((a, b) => rate(b) - rate(a) || b.attempts - a.attempts)[0];
  const weakest = [...stats].sort((a, b) => b.scaffolds - a.scaffolds || rate(a) - rate(b))[0];
  const ranked = [strongest, weakest].filter(Boolean) as SkillStat[];

  let topMisconception: Aggregate["topMisconception"];
  for (const st of stats) {
    for (const m of st.misconceptions) {
      if (!topMisconception || m.count > topMisconception.count)
        topMisconception = { ...m, skill: st.name };
    }
  }

  const days = new Set(sessions.map((s) => new Date(s.ts).toDateString())).size;

  return {
    totalAttempts: total,
    accuracyFirstTry: total ? firstTry / total : 0,
    scaffoldRate: total ? scaffolds / total : 0,
    masteredPowers: stats.filter((s) => s.mastered).map((s) => s.name),
    strongest: ranked[0],
    weakest: ranked[ranked.length - 1],
    topMisconception,
    bySkill: stats.sort(
      (a, b) => SKILLS.findIndex((s) => s.id === a.skillId) - SKILLS.findIndex((s) => s.id === b.skillId)
    ),
    daysActive: days,
  };
}
