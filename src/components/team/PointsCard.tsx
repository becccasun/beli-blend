"use client";

import Link from "next/link";
import { Check, ChevronRight, Trophy } from "lucide-react";
import type { PointLine } from "@/lib/team";

/** Shows how a challenge feeds the leaderboard: what is banked and what is still on the table. */
export function PointsCard({
  lines,
  earned,
  possible,
  finished,
}: {
  lines: PointLine[];
  earned: number;
  possible: number;
  finished: boolean;
}) {
  return (
    <Link href="/leaderboard" className="mt-3 block rounded-2xl border border-line p-4">
      <div className="flex items-center gap-2">
        <Trophy size={18} className="text-teal" />
        <span className="flex-1 text-[15px] font-semibold">Leaderboard points</span>
        <span className="text-[15px] font-bold tabular-nums text-teal">+{earned}</span>
        <span className="text-[13px] tabular-nums text-ink-3">of {possible}</span>
        <ChevronRight size={16} className="text-ink-3" />
      </div>
      <div className="mt-3 space-y-2.5">
        {lines.map((l) => {
          const full = l.earned === l.possible;
          return (
            <div key={l.label} className="flex items-center gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  full ? "border-good bg-good text-white" : "border-[#cfcfcf] text-transparent"
                }`}
              >
                <Check size={12} strokeWidth={3.5} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] leading-tight">{l.label}</div>
                <div className="text-[12px] text-ink-3">{l.detail}</div>
              </div>
              <span
                className={`text-[14px] font-semibold tabular-nums ${
                  l.earned > 0 ? "text-teal" : "text-ink-3"
                }`}
              >
                +{l.earned > 0 && !full ? `${l.earned}/${l.possible}` : l.possible}
              </span>
            </div>
          );
        })}
      </div>
      {!finished && (
        <p className="mt-3 border-t border-line pt-2.5 text-[12px] text-ink-3">
          On top of the usual +1 for every place you rank.
        </p>
      )}
    </Link>
  );
}
