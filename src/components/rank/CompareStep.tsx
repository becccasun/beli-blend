"use client";

import { useState } from "react";
import { Clock, CornerUpLeft, CornerUpRight, HelpCircle } from "lucide-react";
import {
  fmtScore,
  restaurantById,
  scoreTone,
  timeAgo,
  type RankedEntry,
  type Restaurant,
} from "@/lib/data";

export type CompareResult = { index: number; picks: number; forgotten: number };

// Roughly 18 months: past this, the memory of a place is probably fuzzy.
const STALE_DAYS = 548;
const NOW = new Date("2026-11-12");
const daysSince = (iso: string) => (NOW.getTime() - new Date(iso).getTime()) / 86400000;

const toneText = { liked: "text-good", fine: "text-ok", disliked: "text-bad" } as const;

type State = { lo: number; hi: number; skipped: string[]; picks: number; forgotten: number };

/** Nearest comparable opponent to the middle of [lo, hi), ignoring dropped ones. */
function pickOpponent(pool: RankedEntry[], s: State): number {
  const mid = Math.floor((s.lo + s.hi) / 2);
  for (let d = 0; d < s.hi - s.lo; d++) {
    for (const i of [mid + d, mid - d]) {
      if (i >= s.lo && i < s.hi && !s.skipped.includes(pool[i].restaurantId)) return i;
    }
  }
  return -1;
}

/**
 * Classic Beli bracket: binary search through the same-sentiment bucket. The proposal
 * adds the visit date to each opponent and lets the user drop ones they no longer
 * remember, which just narrows who they get compared with.
 */
export default function CompareStep({
  place,
  pool,
  onFinish,
}: {
  place: Restaurant;
  pool: RankedEntry[];
  onFinish: (r: CompareResult) => void;
}) {
  const [history, setHistory] = useState<State[]>([]);
  const [state, setState] = useState<State>({ lo: 0, hi: pool.length, skipped: [], picks: 0, forgotten: 0 });

  const oppIndex = state.lo < state.hi ? pickOpponent(pool, state) : -1;

  const advance = (next: State) => {
    setHistory((h) => [...h, state]);
    if (next.lo >= next.hi) {
      onFinish({ index: next.lo, picks: next.picks, forgotten: next.forgotten });
      return;
    }
    if (pickOpponent(pool, next) === -1) {
      // everyone left in range was dropped: land in the middle of that range, no penalty
      onFinish({
        index: Math.floor((next.lo + next.hi) / 2),
        picks: next.picks,
        forgotten: next.forgotten,
      });
      return;
    }
    setState(next);
  };

  if (pool.length === 0 || oppIndex === -1) {
    return (
      <div className="rounded-2xl bg-white px-4 py-5 text-center">
        <div className="text-[16px] font-semibold text-ink">Nothing to compare yet</div>
        <p className="mx-auto mt-1 max-w-[260px] text-[13px] leading-snug text-ink-3">
          This is your first place in this group, so it goes straight to the top.
        </p>
        <button
          onClick={() => onFinish({ index: 0, picks: 0, forgotten: 0 })}
          className="mt-4 h-[44px] w-full rounded-full bg-teal text-[15px] font-semibold text-white"
        >
          Add it
        </button>
      </div>
    );
  }

  const opp = pool[oppIndex];
  const oppPlace = restaurantById(opp.restaurantId);
  const stale = daysSince(opp.visitedAt) > STALE_DAYS;
  const step = history.length + 1;
  const total = history.length + Math.ceil(Math.log2(state.hi - state.lo + 1));

  const preferNew = () => advance({ ...state, hi: oppIndex, picks: state.picks + 1 });
  const preferOpp = () => advance({ ...state, lo: oppIndex + 1, picks: state.picks + 1 });
  const tie = () => onFinish({ index: oppIndex + 1, picks: state.picks + 1, forgotten: state.forgotten });
  // Skip and "don't remember" both swap in the next nearest opponent; only the latter is counted
  const drop = (forgot: boolean) =>
    advance({
      ...state,
      skipped: [...state.skipped, opp.restaurantId],
      forgotten: state.forgotten + (forgot ? 1 : 0),
    });
  const undo = () => {
    if (!history.length) return;
    setState(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  };

  return (
    <div className="rounded-2xl bg-white px-3 pb-3 pt-2.5">
      <div className="relative mb-2.5 flex items-center justify-center text-[16px] font-semibold leading-none text-ink">
        Which do you prefer?
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[12px] font-medium leading-none text-ink-3 tabular-nums">
          {step} of ~{Math.max(total, step)}
        </span>
      </div>

      <div className="relative flex gap-2">
        <button
          onClick={preferNew}
          className="flex min-h-[132px] flex-1 flex-col items-center justify-center rounded-xl border-[1.5px] border-teal px-2 py-3 text-center active:bg-teal-tint"
        >
          <span className="font-serif text-[17px] font-bold leading-tight text-ink">
            {place.name}
          </span>
          <span className="mt-1 text-[12px] text-ink-2">{place.hood}</span>
          <span className="mt-1.5 text-[11px] font-medium text-teal">Visited today</span>
        </button>

        <span className="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-teal text-[11px] font-bold text-white">
          OR
        </span>

        <button
          key={opp.restaurantId}
          onClick={preferOpp}
          className="flex min-h-[132px] flex-1 flex-col items-center justify-center rounded-xl border-[1.5px] border-teal px-2 py-3 text-center active:bg-teal-tint"
        >
          <span className="font-serif text-[17px] font-bold leading-tight text-ink">
            {oppPlace.name}
          </span>
          <span className="mt-1 text-[12px] text-ink-2">
            {oppPlace.hood} ·{" "}
            <span className={`font-semibold ${toneText[scoreTone(opp.score)]}`}>
              {fmtScore(opp.score)}
            </span>
          </span>
          {stale ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-[11px] font-medium text-ink-2">
              <Clock size={11} />
              Visited {timeAgo(opp.visitedAt)}
            </span>
          ) : (
            <span className="mt-1.5 text-[11px] text-ink-3">Visited {timeAgo(opp.visitedAt)}</span>
          )}
        </button>
      </div>

      {stale && (
        <div className="mt-2.5 flex justify-center">
          <button
            onClick={() => drop(true)}
            className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-teal-tint px-3 py-1.5 text-[12px] font-semibold text-teal"
          >
            <HelpCircle size={13} />
            I don&apos;t remember this one
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between px-1">
        <button
          onClick={undo}
          disabled={!history.length}
          className="inline-flex items-center gap-1 text-[15px] font-medium text-teal disabled:opacity-35"
        >
          <CornerUpLeft size={18} strokeWidth={2.2} />
          Undo
        </button>
        <button
          onClick={tie}
          className="rounded-lg border-[1.5px] border-teal px-3 py-1.5 text-[15px] font-medium text-teal"
        >
          Too tough
        </button>
        <button
          onClick={() => drop(false)}
          className="inline-flex items-center gap-1 text-[15px] font-medium text-teal"
        >
          Skip
          <CornerUpRight size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
