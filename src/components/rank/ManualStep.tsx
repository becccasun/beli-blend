"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { fmtScore, restaurantById, type RankedEntry, type Sentiment } from "@/lib/data";
import { BANDS, clampToBand, manualPreview } from "@/lib/scoring";
import { PrimaryButton, ScoreBadge } from "@/components/ui";

const TODAY = "2026-11-12";

/**
 * Proposal: the user owns the number. The slider is locked to the sentiment band so the
 * score still agrees with "liked / fine / didn't like", and the preview shows where the
 * place slots into the existing list as they drag.
 */
export default function ManualStep({
  restaurantId,
  sentiment,
  others,
  onConfirm,
}: {
  restaurantId: string;
  sentiment: Sentiment;
  others: RankedEntry[];
  onConfirm: (score: number) => void;
}) {
  const band = BANDS[sentiment];
  const [score, setScore] = useState(() => clampToBand((band.min + band.max) / 2, sentiment));
  const set = (n: number) => setScore(clampToBand(n, sentiment));

  const preview = useMemo(
    () =>
      manualPreview(others, {
        restaurantId,
        sentiment,
        score,
        method: "manual",
        visitedAt: TODAY,
      }),
    [others, restaurantId, sentiment, score]
  );

  const name = (e?: RankedEntry) => (e ? restaurantById(e.restaurantId).name : "");
  const summary =
    preview.above && preview.below
      ? `between ${name(preview.above)} and ${name(preview.below)}`
      : preview.below
        ? `above ${name(preview.below)}`
        : preview.above
          ? `below ${name(preview.above)}`
          : "your first place";

  const rows: { e?: RankedEntry; rank: number; isNew?: boolean }[] = [
    { e: preview.above, rank: preview.rank - 1 },
    { rank: preview.rank, isNew: true },
    { e: preview.below, rank: preview.rank + 1 },
  ];

  return (
    <div className="rounded-2xl bg-white px-4 pb-4 pt-2.5">
      <div className="pb-3 text-center text-[16px] font-semibold text-ink">
        What would you give it?
      </div>

      <div className="flex justify-center">
        <ScoreBadge score={score} size={84} />
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          aria-label="Lower score"
          onClick={() => set(score - 0.1)}
          disabled={score <= band.min}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink disabled:opacity-35"
        >
          <Minus size={16} strokeWidth={2.4} />
        </button>
        <input
          type="range"
          min={band.min}
          max={band.max}
          step={0.1}
          value={score}
          onChange={(e) => set(parseFloat(e.target.value))}
          aria-label="Score"
          className="h-2 min-w-0 flex-1 cursor-pointer accent-teal"
        />
        <button
          aria-label="Raise score"
          onClick={() => set(score + 0.1)}
          disabled={score >= band.max}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink disabled:opacity-35"
        >
          <Plus size={16} strokeWidth={2.4} />
        </button>
      </div>
      <div className="mt-1 flex justify-between px-12 text-[11px] text-ink-3 tabular-nums">
        <span>{fmtScore(band.min)}</span>
        <span>{fmtScore(band.max)}</span>
      </div>

      <div className="mt-3 rounded-xl bg-fill px-3 py-2.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-2">
          Where this lands
        </div>
        <div className="mt-0.5 text-[13px] leading-snug text-ink">
          <span className="font-semibold">#{preview.rank}</span> · {summary}
        </div>
        <div className="mt-2 flex flex-col gap-1">
          {rows.map((r) =>
            r.isNew ? (
              <div
                key="new"
                className="flex items-center gap-2 rounded-lg border-[1.5px] border-teal bg-white px-2 py-1.5"
              >
                <span className="w-6 text-[12px] font-semibold text-teal tabular-nums">
                  {r.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                  {restaurantById(restaurantId).name}
                </span>
                <ScoreBadge score={score} size={28} />
              </div>
            ) : r.e ? (
              <div key={r.e.restaurantId} className="flex items-center gap-2 px-2 py-1 opacity-70">
                <span className="w-6 text-[12px] text-ink-3 tabular-nums">{r.rank}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{name(r.e)}</span>
                <ScoreBadge score={r.e.score} size={28} />
              </div>
            ) : null
          )}
        </div>
      </div>

      <PrimaryButton className="mt-4" onClick={() => onConfirm(score)}>
        Set score
      </PrimaryButton>
    </div>
  );
}
