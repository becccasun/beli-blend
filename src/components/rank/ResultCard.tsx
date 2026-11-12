"use client";

import { GitCompareArrows, SlidersHorizontal } from "lucide-react";
import { PrimaryButton, ScoreBadge } from "@/components/ui";

export type RankResult = {
  score: number;
  rank: number;
  method: "compare" | "manual";
  picks?: number;
  forgotten?: number;
};

export default function ResultCard({
  result,
  name,
  onDone,
}: {
  result: RankResult;
  name: string;
  onDone: () => void;
}) {
  const manual = result.method === "manual";
  const Icon = manual ? SlidersHorizontal : GitCompareArrows;
  const how = manual
    ? "You set this score"
    : result.picks
      ? `Ranked by comparing · ${result.picks} ${result.picks === 1 ? "pick" : "picks"}`
      : "Ranked by comparing";

  return (
    <div className="animate-sheet-up rounded-2xl bg-white px-4 pb-4 pt-5 text-center">
      <div className="flex justify-center">
        <ScoreBadge score={result.score} size={84} />
      </div>
      <div className="mt-3 font-serif text-[19px] font-bold leading-tight text-ink">
        {name} ranked!
      </div>
      <div className="mt-0.5 text-[14px] text-ink-2">
        <span className="font-semibold text-ink">#{result.rank}</span> on your Been list
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal-tint px-3 py-1 text-[12px] font-semibold text-teal">
        <Icon size={13} />
        {how}
      </div>
      {!manual && !!result.forgotten && (
        <div className="mt-1.5 text-[12px] text-ink-3">
          Left out {result.forgotten} {result.forgotten === 1 ? "place" : "places"} you didn&apos;t
          remember
        </div>
      )}
      <PrimaryButton className="mt-4" onClick={onDone}>
        Done
      </PrimaryButton>
    </div>
  );
}
