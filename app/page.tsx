"use client";
import { useEffect, useMemo, useState } from "react";
import { PROBLEMS, DEMO_ORDER, getProblemById } from "@/lib/problems";
import { Scaffold } from "@/lib/types";
import { getItem } from "@/lib/shop";
import { Pet, PetMood } from "@/components/Pet";
import { HUD } from "@/components/HUD";
import { QuestionCard } from "@/components/QuestionCard";
import { ScaffoldLadder } from "@/components/ScaffoldLadder";
import { PetShop } from "@/components/PetShop";
import { ParentModal } from "@/components/ParentModal";
import { Onboarding } from "@/components/Onboarding";

type SaveState = {
  name: string;
  interests: string[];
  level: number;
  xp: number;
  coins: number;
  streak: number;
  owned: string[];
  equipped: string | null;
};

const LS_KEY = "numi_state_v1";
const XP_TO_NEXT = 30;

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

  useEffect(() => {
    const saved = loadState();
    if (saved) setState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const currentProblem = useMemo(() => {
    const id = DEMO_ORDER[demoIndex % DEMO_ORDER.length];
    return getProblemById(id) ?? PROBLEMS[0];
  }, [demoIndex]);

  if (!ready) return null;

  if (!state) {
    return (
      <Onboarding
        onDone={({ name, interests }) =>
          setState({
            name,
            interests,
            level: 1,
            xp: 0,
            coins: 30,
            streak: 0,
            owned: [],
            equipped: null,
          })
        }
      />
    );
  }

  function say(text: string, ms = 3000) {
    setBubble(text);
    setTimeout(() => setBubble((b) => (b === text ? null : b)), ms);
  }

  function grantReward(base: number) {
    setState((s) => {
      if (!s) return s;
      let xp = s.xp + base;
      let level = s.level;
      let coins = s.coins + 5;
      let leveledUp = false;
      if (xp >= XP_TO_NEXT) {
        xp = xp - XP_TO_NEXT;
        level += 1;
        coins += 25;
        leveledUp = true;
      }
      if (leveledUp) {
        setMood("levelup");
        say(`🎉 Level ${level}! +25 coins!`, 3500);
        setTimeout(() => setMood("idle"), 2500);
      }
      return { ...s, xp, level, coins, streak: s.streak + 1 };
    });
  }

  async function handleResult(correct: boolean, userAnswer: number) {
    if (correct) {
      setMood("happy");
      say("Yes! 🎉");
      grantReward(10);
      setScaffold(null);
      setTimeout(() => {
        setMood("idle");
        setBubble(null);
        setDemoIndex((i) => i + 1);
      }, 1500);
      return;
    }

    // wrong answer → fetch scaffold
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
          originalQuestion: currentProblem.prompt,
          correctAnswer: currentProblem.answer,
          userAnswer,
          concept: currentProblem.concept,
          technique: currentProblem.technique,
        }),
      });
      const data = (await res.json()) as Scaffold;
      setScaffold(data);
    } catch {
      // hard fallback: minimal scaffold
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
    // Give the child a small coin bonus for persistence.
    setState((s) => (s ? { ...s, coins: s.coins + 5 } : s));
  }

  function buyItem(id: string) {
    const item = getItem(id);
    if (!item) return;
    setState((s) => {
      if (!s || s.coins < item.price || s.owned.includes(id)) return s;
      return {
        ...s,
        coins: s.coins - item.price,
        owned: [...s.owned, id],
        equipped: item.kind === "hat" ? id : s.equipped,
      };
    });
    say(`Yum! Got the ${item.name}! ${item.emoji}`);
    setMood("happy");
    setTimeout(() => setMood("idle"), 1200);
  }

  function equipItem(id: string) {
    setState((s) => (s ? { ...s, equipped: id } : s));
  }

  const equippedItem = state.equipped ? getItem(state.equipped) : null;
  const petHat = equippedItem?.kind === "hat" ? equippedItem.emoji : null;

  return (
    <main className="min-h-screen max-w-md mx-auto p-3 flex flex-col gap-3">
      <HUD
        petName={state.name}
        level={state.level}
        xp={state.xp}
        xpToNext={XP_TO_NEXT}
        coins={state.coins}
        streak={state.streak}
        onShop={() => setShowShop(true)}
        onParent={() => setShowParent(true)}
      />

      <div className="card bg-gradient-to-b from-sky-100 to-white min-h-[240px] flex items-end justify-center relative">
        <Pet mood={mood} hat={petHat} bubble={bubble} />
      </div>

      {scaffold ? (
        <ScaffoldLadder scaffold={scaffold} onComplete={completeScaffold} />
      ) : scaffoldLoading ? (
        <div className="card text-center py-8 text-gray-500">
          <span className="animate-pulse">Sparky is thinking of an easier way…</span>
        </div>
      ) : (
        <QuestionCard problem={currentProblem} onResult={handleResult} />
      )}

      <div className="text-[10px] text-gray-400 text-center pt-2">
        Numi · demo build · math their pet learned first
      </div>

      {showShop && (
        <PetShop
          coins={state.coins}
          owned={new Set(state.owned)}
          equipped={state.equipped}
          onBuy={buyItem}
          onEquip={equipItem}
          onClose={() => setShowShop(false)}
        />
      )}
      {showParent && <ParentModal onClose={() => setShowParent(false)} />}
    </main>
  );
}
