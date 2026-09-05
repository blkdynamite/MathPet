"use client";
import { useEffect, useState } from "react";
import { Session } from "@/lib/types";
import { Aggregate } from "@/lib/telemetry";
import { Modal } from "./Modal";

type Brief = {
  headline: string;
  focus: string;
  pattern: string;
  suggested_opener: string;
  wins: string;
  standards: string[];
};

export function ParentModal({
  sessions,
  petName,
  onClose,
}: {
  sessions: Session[];
  petName: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"parent" | "tutor">("parent");
  const [summary, setSummary] = useState<string>("");
  const [brief, setBrief] = useState<Brief | null>(null);
  const [agg, setAgg] = useState<Aggregate | null>(null);
  const [source, setSource] = useState<"live" | "seed">("seed");
  const [loadingP, setLoadingP] = useState(true);
  const [loadingT, setLoadingT] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    const body = JSON.stringify({ sessions, petName, studentName: "Your student" });
    fetch("/api/parent-summary", { method: "POST", headers: { "content-type": "application/json" }, body, signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setSummary(d.summary);
        setAgg(d.aggregate);
        setSource(d.source);
      })
      .catch(() => {})
      .finally(() => setLoadingP(false));
    fetch("/api/tutor-brief", { method: "POST", headers: { "content-type": "application/json" }, body, signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBrief(d.brief))
      .catch(() => {})
      .finally(() => setLoadingT(false));
    return () => ctrl.abort();
  }, [sessions, petName]);

  const weakest = agg?.weakest?.name ?? "division";

  return (
    <Modal onClose={onClose} labelledBy="parent-title" paddedFooter>
      <div className="p-4">
        {/* Screen-reader-only title so aria-labelledby has a target even though
            the visible tab UI acts as the heading. */}
        <h2 id="parent-title" className="sr-only">
          For parents and tutors
        </h2>

        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "parent"}
              onClick={() => setTab("parent")}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                tab === "parent" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              👨‍👩‍👧 For Parents
            </button>
            <button
              role="tab"
              aria-selected={tab === "tutor"}
              onClick={() => setTab("tutor")}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                tab === "tutor" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              🎓 Tutor Brief
            </button>
          </div>
          <button onClick={onClose} className="text-2xl px-2 text-gray-500" aria-label="Close parent view">
            ✕
          </button>
        </div>

        {agg && (
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            <Stat label="Problems" value={agg.totalAttempts} />
            <Stat label="1st-try" value={`${Math.round(agg.accuracyFirstTry * 100)}%`} />
            <Stat label="Powers" value={agg.masteredPowers.length} />
            <Stat label="Days" value={agg.daysActive} />
          </div>
        )}

        {tab === "parent" ? (
          <div
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 min-h-[160px] text-sm text-gray-700 leading-relaxed"
            role="tabpanel"
            aria-live="polite"
          >
            {loadingP ? (
              <span className="animate-pulse text-gray-500">{petName} is writing your note…</span>
            ) : (
              renderMarkdown(summary)
            )}
          </div>
        ) : (
          <div
            className="bg-violet-50 border border-violet-200 rounded-2xl p-4 min-h-[160px] text-sm text-gray-800 space-y-2"
            role="tabpanel"
            aria-live="polite"
          >
            {loadingT || !brief ? (
              <span className="animate-pulse text-gray-500">Preparing pre-session brief…</span>
            ) : (
              <>
                <div className="font-bold text-violet-900">{brief.headline}</div>
                <Row k="Focus" v={brief.focus} />
                <Row k="Pattern" v={brief.pattern} />
                <Row k="Open with" v={brief.suggested_opener} />
                <Row k="Praise" v={brief.wins} />
                <div className="flex flex-wrap gap-1 pt-1">
                  {brief.standards.map((s) => (
                    <span key={s} className="font-mono text-[10px] bg-white border border-violet-200 rounded px-1.5 py-0.5">
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <a
          href="https://www.varsitytutors.com/elementary_math-tutors"
          target="_blank"
          rel="noreferrer"
          className="mt-3 block w-full text-center py-3 rounded-2xl bg-numi-accent text-white font-bold shadow"
        >
          Book a live session on {weakest} →
        </a>

        <div className="text-[10px] text-gray-400 mt-2 text-center">
          {source === "live"
            ? `Generated from ${sessions.length} real attempts on this device.`
            : "Showing seed data — play a few rounds to see your own report."}
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-sky-50 border border-sky-100 rounded-xl py-1.5 text-center">
      <div className="text-base font-bold text-sky-700">{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-gray-500 font-semibold">{label}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-2">
      <div className="text-[10px] uppercase tracking-wide font-bold text-violet-700 pt-0.5">{k}</div>
      <div className="text-sm">{v}</div>
    </div>
  );
}

function renderMarkdown(md: string) {
  return md.split(/\n\n+/).map((para, i) => (
    <p key={i} className="mb-2 last:mb-0">
      {para.split(/(\*\*[^*]+\*\*)/g).map((chunk, j) =>
        chunk.startsWith("**") && chunk.endsWith("**") ? (
          <strong key={j}>{chunk.slice(2, -2)}</strong>
        ) : (
          <span key={j}>{chunk}</span>
        )
      )}
    </p>
  ));
}
