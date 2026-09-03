"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { PROBLEMS, DEMO_ORDER, getProblemById } from "@/lib/problems";
import { Scaffold, Session, Problem } from "@/lib/types";
import { getItem } from "@/lib/shop";
import {
  SKILLS,
  SkillProgress,
  emptyProgress,
  isMastered,
  masteredCount,
  stageFor,
  getSkill,
  STAGE_NAMES,
} from "@/lib/skills";
import { classify } from "@/lib/misconceptions";
import { Pet, PetMood } from "@/components/Pet";
import { HUD } from "@/components/HUD";
import { QuestionCard } from "@/components/QuestionCard";
import { ScaffoldLadder } from "@/components/ScaffoldLadder";
import { PetShop } from "@/components/PetShop";
import { ParentModal } from "@/components/ParentModal";
import { Onboarding } from "@/components/Onboarding";
import { RewardNudge, NudgeReason } from "@/components/RewardNudge";
import { SkillMap } from "@/components/SkillMap";

type SaveState = {
  name: string;
  interests: string[];
  coins: number;
  streak: number;
  owned: string[];
  equipped: string | null;
  progress: SkillProgress;
  sessions: Session[];
  lastFedAt: number;      // ms epoch
  fedToday: number;       // correct answers since last "hungry" reset
};

const LS_KEY = "numi_state_v2";
const CUPCAKE_COST = 20;
// Feed modal fires after the 2nd correct answer, then every 3rd after that (2, 5, 8…).
const shouldNudgeAt = (streak: number) => streak === 2 || (streak > 2 && (streak - 2) % 3 === 0);
const HUNGER_FULL_AFTER_MS = 8 * 3600 * 1000; // starving after 8h away
const FEED_PER_CORRECT = 34;                   // 3 correct answers = full
const QUEST_SIZE = 3;

function loadState(): SaveState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveState(s: SaveState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}
function fresh(name: string, interests: string[]): SaveState {
  return {
    name,
    interests,
    coins: 30,
    streak: 0,
    owned: [],
    equipped: null,
    progress: emptyProgress(),
    sessions: [],
    lastFedAt: Date.now(),
    fedToday: 0,
  };
}

export default function Home() {
  const [state, setState] = useState<SaveState | null>(null);
  const [ready, setReady] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [mood, setMood] = useState<PetMood>("idle");
  const [bubble, setBubble] = useState<string | null>(null);
  const [scaffold, setScaffold] = useState<Scaffold | null>(null);
  const [scaffoldLoading, setScaffoldLoading] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const [showPowers, setShowPowers] = useState(false);
  const [nudge, setNudge] = useState<NudgeReason | null>(null);
  const [hungerOverride, setHungerOverride] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [aiMode, setAiMode] = useState(false);
  const [aiProblem, setAiProblem] = useState<Problem | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState<"live" | "template" | null>(null);

  // per-problem attempt tracking
  const startedAt = useRef<number>(Date.now());
  const usedScaffold = useRef(false);
  const lastMisconception = useRef<Session["misconception"]>(undefined);
  const lastWrongAnswer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const saved = loadState();
    if (saved) setState(saved);
    setReady(true);
    // ?demo=hungry simulates "came back the next morning" for the video
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      if (q.get("demo") === "hungry") setHungerOverride(85);
      if (q.get("demo") === "reset") {
        localStorage.removeItem(LS_KEY);
        setState(null);
      }
      if (q.get("ai") === "1") setAiMode(true);
    }
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const staticProblem = useMemo(() => {
    const id = DEMO_ORDER[demoIndex % DEMO_ORDER.length];
    return getProblemById(id) ?? PROBLEMS[0];
  }, [demoIndex]);
  const currentProblem = aiMode && aiProblem ? aiProblem : staticProblem;

  // In AI mode, fetch a freshly-generated problem for the same skillId as
  // the demo sequence would have used. Story from the LLM (via tool-use);
  // verifier already ran server-side and served the safe template if the
  // model produced a broken story.
  useEffect(() => {
    if (!aiMode) return;
    setAiLoading(true);
    setAiProblem(null);
    fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        skillId: staticProblem.skillId,
        difficulty: staticProblem.difficulty,
        interests: state?.interests ?? [],
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.problem) {
          setAiProblem(d.problem);
          setAiSource(d.source);
        }
      })
      .finally(() => setAiLoading(false));
  }, [aiMode, demoIndex, staticProblem.skillId, staticProblem.difficulty, state?.interests]);

  // reset per-problem trackers when the problem changes
  useEffect(() => {
    startedAt.current = Date.now();
    usedScaffold.current = false;
    lastMisconception.current = undefined;
    lastWrongAnswer.current = undefined;
  }, [currentProblem.id]);

  if (!ready) return null;
  if (!state) {
    return <Onboarding onDone={({ name, interests }) => setState(fresh(name, interests))} />;
  }

  // ---- derived ----
  const hunger =
    hungerOverride ??
    Math.min(100, Math.round(((now - state.lastFedAt) / HUNGER_FULL_AFTER_MS) * 100));
  const isHungry = hunger >= 60;
  const mastered = masteredCount(state.progress);
  const stage = stageFor(mastered);
  const equippedItem = state.equipped ? getItem(state.equipped) : null;
  const petHat = equippedItem?.kind === "hat" ? equippedItem.emoji : null;

  function say(text: string, ms = 3000) {
    setBubble(text);
    setTimeout(() => setBubble((b) => (b === text ? null : b)), ms);
  }

  function logSession(correct: boolean) {
    const s: Session = {
      ts: Date.now(),
      problemId: currentProblem.id,
      skillId: currentProblem.skillId,
      concept: currentProblem.concept,
      ccss: currentProblem.ccss,
      technique: currentProblem.technique,
      correct,
      firstTry: correct && !usedScaffold.current,
      scaffoldUsed: usedScaffold.current,
      misconception: lastMisconception.current,
      userAnswer: lastWrongAnswer.current,
      timeSec: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
    };
    return s;
  }

  function feedItem(itemId: string) {
    const item = getItem(itemId);
    if (!item || item.kind !== "food") return;
    if (state!.coins < item.price) return;
    setState((s) =>
      s
        ? { ...s, coins: s.coins - item.price, lastFedAt: Date.now(), fedToday: QUEST_SIZE }
        : s
    );
    setHungerOverride(null);
    say(`Nom nom! ${item.emoji} ${item.id === "food-smoothie" ? "Rainbow power!" : "So full!"}`);
    setMood(item.id === "food-smoothie" ? "levelup" : "happy");
    setTimeout(() => setMood("idle"), item.id === "food-smoothie" ? 2000 : 1200);
    setNudge(null);
  }

  async function handleResult(correct: boolean, userAnswer: number) {
    if (correct) {
      const session = logSession(true);
      const skillId = currentProblem.skillId;
      const wasMastered = isMastered(state!.progress, skillId);
      const prevStage = stageFor(masteredCount(state!.progress));

      // compute the next state synchronously so we can react to it
      const p = { ...state!.progress };
      p[skillId] = {
        cleanSolves: p[skillId].cleanSolves + (session.firstTry ? 1 : 0),
        attempts: p[skillId].attempts + 1,
        scaffolds: p[skillId].scaffolds + (session.scaffoldUsed ? 1 : 0),
      };
      const nowMastered = isMastered(p, skillId);
      const justMastered = nowMastered && !wasMastered;
      const nextStage = stageFor(masteredCount(p));
      const evolved = nextStage > prevStage;
      const newStreak = state!.streak + 1;
      const coinGain = 5 + (session.scaffoldUsed ? 5 : 0) + (justMastered ? 25 : 0);

      // hunger: each correct answer "feeds" the pet a third of the way
      const fedMs = Math.min(
        Date.now(),
        state!.lastFedAt + (FEED_PER_CORRECT / 100) * HUNGER_FULL_AFTER_MS
      );
      const newHungerOverride =
        hungerOverride === null ? null : Math.max(0, hungerOverride - FEED_PER_CORRECT);

      setState((s) =>
        s
          ? {
              ...s,
              progress: p,
              sessions: [...s.sessions, session],
              streak: newStreak,
              coins: s.coins + coinGain,
              lastFedAt: hungerOverride === null ? fedMs : s.lastFedAt,
              fedToday: s.fedToday + 1,
            }
          : s
      );
      if (hungerOverride !== null) {
        setHungerOverride(newHungerOverride);
        if (newHungerOverride === 0) {
          // fully fed in demo mode → clear override and stamp real time
          setHungerOverride(null);
          setState((s) => (s ? { ...s, lastFedAt: Date.now() } : s));
        }
      }

      setScaffold(null);
      setMood("happy");
      say(session.scaffoldUsed ? "You worked it out! 💪" : "Yes! 🎉");

      const skill = getSkill(skillId);
      const afterHappy = () => {
        if (evolved) {
          setMood("evolve");
          say(`✨ ${state!.name} evolved into a ${STAGE_NAMES[nextStage]}!`, 3500);
          setTimeout(() => {
            setMood("idle");
            setNudge("levelup");
          }, 2200);
        } else if (justMastered) {
          setMood("levelup");
          say(`🏅 Power mastered: ${skill.emoji} ${skill.name}! +25 coins`, 3500);
          setTimeout(() => {
            setMood("idle");
            setDemoIndex((i) => i + 1);
          }, 2200);
        } else if (shouldNudgeAt(newStreak)) {
          setMood("idle");
          setBubble(null);
          setTimeout(() => setNudge("streak"), 200);
        } else {
          setMood("idle");
          setBubble(null);
          setDemoIndex((i) => i + 1);
        }
      };
      setTimeout(afterHappy, 1300);
      return;
    }

    // ---- wrong answer → classify → scaffold ----
    const misconception = classify(currentProblem, userAnswer);
    lastMisconception.current = misconception;
    lastWrongAnswer.current = userAnswer;
    usedScaffold.current = true;

    setMood("sad");
    setState((s) => (s ? { ...s, streak: 0 } : s));
    say("Hmm, let's build up to it!");
    setScaffoldLoading(true);
    try {
      const res = await fetch("/api/scaffold", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          problemId: currentProblem.id,
          skillId: currentProblem.skillId,
          originalQuestion: currentProblem.prompt,
          correctAnswer: currentProblem.answer,
          userAnswer,
          concept: currentProblem.concept,
          technique: currentProblem.technique,
          misconception,
        }),
      });
      setScaffold((await res.json()) as Scaffold);
    } catch {
      setScaffold({
        diagnosis: "Not quite! Let's try again.",
        encouragement: "Every mistake is a step forward.",
        scaffold: [],
        bridge_back: "Give it another shot.",
      });
    } finally {
      setScaffoldLoading(false);
      setTimeout(() => setMood("idle"), 500);
    }
  }

  function completeScaffold() {
    setScaffold(null);
    say("Now try the original! 💪");
  }

  function buyItem(id: string) {
    const item = getItem(id);
    if (!item) return;
    setState((s) => {
      if (!s || s.coins < item.price || s.owned.includes(id)) return s;
      const fed = item.kind === "food";
      return {
        ...s,
        coins: s.coins - item.price,
        owned: fed ? s.owned : [...s.owned, id],
        equipped: item.kind === "hat" ? id : s.equipped,
        lastFedAt: fed ? Date.now() : s.lastFedAt,
      };
    });
    if (item.kind === "food") setHungerOverride(null);
    say(item.kind === "food" ? `Yum! ${item.emoji}` : `Got the ${item.name}! ${item.emoji}`);
    setMood("happy");
    setTimeout(() => setMood("idle"), 1200);
  }

  const petMood: PetMood = mood === "idle" && isHungry ? "hungry" : mood;
  const idleBubble =
    bubble ?? (isHungry && !scaffold ? `I'm hungry! Solve ${Math.max(1, Math.ceil(hunger / FEED_PER_CORRECT))} to feed me 🍽️` : null);

  return (
    <main className="min-h-screen max-w-md mx-auto p-3 flex flex-col gap-3">
      <HUD
        petName={state.name}
        stage={stage}
        masteredCount={mastered}
        totalPowers={SKILLS.length}
        hunger={hunger}
        coins={state.coins}
        streak={state.streak}
        onShop={() => setShowShop(true)}
        onParent={() => setShowParent(true)}
        onPowers={() => setShowPowers(true)}
        onFeed={() => feedItem("food-cupcake")}
        canFeed={state.coins >= CUPCAKE_COST}
        aiMode={aiMode}
        onToggleAi={() => setAiMode((v) => !v)}
      />

      <div
        className={`card min-h-[240px] flex items-end justify-center relative ${
          stage >= 3
            ? "bg-gradient-to-b from-violet-100 to-white"
            : stage >= 2
            ? "bg-gradient-to-b from-amber-100 to-white"
            : "bg-gradient-to-b from-sky-100 to-white"
        }`}
      >
        <Pet mood={petMood} stage={stage} hat={petHat} bubble={idleBubble} />
      </div>

      {scaffold ? (
        <ScaffoldLadder scaffold={scaffold} onComplete={completeScaffold} />
      ) : scaffoldLoading ? (
        <div className="card text-center py-8 text-gray-500">
          <span className="animate-pulse">{state.name} is thinking of an easier way…</span>
        </div>
      ) : aiMode && aiLoading ? (
        <div className="card text-center py-8 text-gray-500">
          <div className="animate-pulse">🤖 Generating a fresh problem…</div>
          <div className="text-[10px] text-gray-400 mt-2">
            code picks the numbers · Claude wraps the story · verifier checks it
          </div>
        </div>
      ) : (
        <>
          <QuestionCard key={currentProblem.id} problem={currentProblem} onResult={handleResult} />
          {aiMode && aiSource && (
            <div className="text-[10px] text-fuchsia-500 text-center -mt-1">
              🤖 {aiSource === "live" ? "Story generated live and verified" : "LLM story rejected — showing safe template"}
            </div>
          )}
        </>
      )}

      <div className="text-[10px] text-gray-400 text-center pt-2">
        Numi · the between-sessions layer · {state.sessions.length} attempts logged on this device
      </div>

      {showShop && (
        <PetShop
          coins={state.coins}
          owned={new Set(state.owned)}
          equipped={state.equipped}
          onBuy={buyItem}
          onEquip={(id) => setState((s) => (s ? { ...s, equipped: id } : s))}
          onClose={() => {
            setShowShop(false);
            if (nudge) {
              setNudge(null);
              setDemoIndex((i) => i + 1);
            }
          }}
        />
      )}
      {showPowers && <SkillMap progress={state.progress} stage={stage} onClose={() => setShowPowers(false)} />}
      {showParent && (
        <ParentModal sessions={state.sessions} petName={state.name} onClose={() => setShowParent(false)} />
      )}
      {nudge && !showShop && (
        <RewardNudge
          reason={nudge}
          petName={state.name}
          coins={state.coins}
          streak={state.streak}
          hunger={hunger}
          onFeed={(id) => {
            feedItem(id);
            setDemoIndex((i) => i + 1);
          }}
          onShop={() => setShowShop(true)}
          onDismiss={() => {
            setNudge(null);
            setDemoIndex((i) => i + 1);
          }}
        />
      )}
    </main>
  );
}
