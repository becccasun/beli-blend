"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Utensils, X } from "lucide-react";
import { restaurantById, type RankedEntry, type Sentiment } from "@/lib/data";
import { useStore } from "@/lib/store";
import { BANDS, insertAt, insertManual, sortRanked } from "@/lib/scoring";
import CompareStep, { type CompareResult } from "./CompareStep";
import ManualStep from "./ManualStep";
import ResultCard, { type RankResult } from "./ResultCard";

export const TODAY = "2026-11-12";

const SENTIMENTS: {
  key: Sentiment;
  label: string;
  soft: string;
  solid: string;
}[] = [
  { key: "liked", label: "I liked it!", soft: "bg-good-soft", solid: "bg-good" },
  { key: "fine", label: "It was fine", soft: "bg-ok-soft", solid: "bg-ok" },
  { key: "disliked", label: "I didn't like it", soft: "bg-bad-soft", solid: "bg-bad" },
];

type Mode = "compare" | "manual";

export default function RankSheet({
  restaurantId,
  open,
  onClose,
}: {
  restaurantId: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  // keyed so every open starts fresh
  return <Sheet key={restaurantId} restaurantId={restaurantId} onClose={onClose} />;
}

function Sheet({ restaurantId, onClose }: { restaurantId: string; onClose: () => void }) {
  const { ranked, setRanked, getEntry, showToast } = useStore();
  const place = restaurantById(restaurantId);
  const existing = getEntry(restaurantId);

  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [mode, setMode] = useState<Mode>("compare");
  const [result, setResult] = useState<RankResult | null>(null);

  // Re-rank: the old entry never shows up as an opponent or neighbour.
  const others = useMemo(
    () => sortRanked(ranked.filter((e) => e.restaurantId !== restaurantId)),
    [ranked, restaurantId]
  );
  const pool = useMemo(
    () => (sentiment ? others.filter((e) => e.sentiment === sentiment) : []),
    [others, sentiment]
  );

  const commit = (next: RankedEntry[], method: Mode, extra: Partial<RankResult> = {}) => {
    const sorted = sortRanked(next);
    const idx = sorted.findIndex((e) => e.restaurantId === restaurantId);
    setRanked(sorted);
    setResult({
      score: sorted[idx].score,
      rank: idx + 1,
      method,
      ...extra,
    });
    showToast(`${place.name} ranked!`);
  };

  const finishCompare = (r: CompareResult) => {
    if (!sentiment) return;
    const entry: RankedEntry = {
      restaurantId,
      sentiment,
      score: BANDS[sentiment].max,
      method: "compare",
      visitedAt: TODAY,
    };
    commit(insertAt(others, entry, r.index), "compare", {
      picks: r.picks,
      forgotten: r.forgotten,
    });
  };

  const finishManual = (score: number) => {
    if (!sentiment) return;
    commit(
      insertManual(others, {
        restaurantId,
        sentiment,
        score,
        method: "manual",
        visitedAt: TODAY,
      }),
      "manual"
    );
  };

  const pickSentiment = (s: Sentiment) => {
    if (result) return;
    setSentiment(s);
    setMode("compare");
  };

  return (
    <div className="absolute inset-0 z-50 overflow-y-auto bg-black/45 [scrollbar-width:none]">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative flex flex-col gap-1.5 px-2.5 pb-8 pt-12">
        {/* 1. Header */}
        <div className="flex items-start justify-between rounded-2xl bg-white px-4 py-3">
          <div className="min-w-0">
            <div className="truncate font-serif text-[19px] font-bold leading-tight text-ink">
              {place.name}
            </div>
            <div className="truncate text-[13px] text-ink-3">
              {place.price} | {place.cuisines.join(", ")}
            </div>
            {existing && !result && (
              <div className="mt-0.5 text-[12px] text-ink-3">
                Re-ranking · you had it at {existing.score.toFixed(1)}
              </div>
            )}
          </div>
          <button aria-label="Close" onClick={onClose} className="-mr-1 shrink-0 p-1 text-ink">
            <X size={24} strokeWidth={1.8} />
          </button>
        </div>

        {/* 2. List picker (static, matches the real app) */}
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-[15px] text-ink">
          Add to my list of
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ink px-2.5 py-1 font-semibold">
            <Utensils size={15} />
            Restaurants
            <ChevronDown size={15} strokeWidth={2.5} />
          </span>
        </div>

        {/* 3. How was it? */}
        <div className="rounded-2xl bg-white px-3 pb-3 pt-2.5">
          <div className="pb-2 text-center text-[16px] font-semibold text-ink">How was it?</div>
          <div className="flex justify-around">
            {SENTIMENTS.map((s) => {
              const selected = sentiment === s.key;
              const faded = sentiment !== null && !selected;
              return (
                <button
                  key={s.key}
                  onClick={() => pickSentiment(s.key)}
                  disabled={!!result}
                  className="flex w-[104px] flex-col items-center gap-1.5"
                >
                  <span
                    className={`flex h-[64px] w-[64px] items-center justify-center rounded-full transition ${
                      selected ? s.solid : s.soft
                    } ${faded ? "opacity-70" : ""}`}
                  >
                    {selected && <Check size={30} strokeWidth={2.2} className="text-white" />}
                  </span>
                  <span
                    className={`text-[13px] ${
                      selected ? "font-medium text-ink" : faded ? "text-ink-3" : "text-ink-2"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {sentiment && result && (
          <ResultCard result={result} name={place.name} onDone={onClose} />
        )}

        {sentiment && !result && (
          <>
            {/* Proposal: choose how to score */}
            <div className="flex rounded-2xl bg-white p-1">
              {(
                [
                  ["compare", "Compare"],
                  ["manual", "Score it myself"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`h-9 flex-1 rounded-xl text-[14px] font-semibold transition ${
                    mode === key ? "bg-teal text-white" : "text-ink-2"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "compare" ? (
              <CompareStep
                key={sentiment}
                place={place}
                pool={pool}
                onFinish={finishCompare}
              />
            ) : (
              <ManualStep
                key={sentiment}
                restaurantId={restaurantId}
                sentiment={sentiment}
                others={others}
                onConfirm={finishManual}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
