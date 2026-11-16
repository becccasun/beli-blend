"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Ellipsis, Utensils } from "lucide-react";
import { me, restaurantById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar, ProgressBar, ScoreBadge } from "@/components/ui";
import { ScreenSkeleton, useLoaded } from "@/components/skeleton";

const GOAL = 36;
const BASE = 23; // places ranked earlier in the year, before the demo list

export default function ChallengePage() {
  const loaded = useLoaded("challenge");
  const router = useRouter();
  const { ranked } = useStore();
  const done = Math.min(GOAL, BASE + ranked.length);
  const recent = [...ranked].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)).slice(0, 6);

  if (!loaded) return <ScreenSkeleton kind="cards" />;

  return (
    <div className="pb-8">
      <div className="relative h-[150px] bg-gradient-to-b from-[#0a1f25] via-teal-dark to-teal text-white">
        <div className="flex items-center justify-between px-3 pt-2">
          <button aria-label="Back" onClick={() => router.back()} className="p-1">
            <ChevronLeft size={26} strokeWidth={2.2} />
          </button>
          <span className="font-serif text-[18px] font-bold">beli</span>
          <Ellipsis size={24} className="mr-1" />
        </div>
        <h1 className="mt-3 text-center font-serif text-[22px] font-bold">
          2026 Restaurant Challenge
        </h1>
        <div className="absolute -bottom-9 left-1/2 flex h-[76px] w-[76px] -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#9fc3bd] bg-white">
          <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border border-teal font-serif text-[17px] font-bold text-teal">
            2026
          </span>
        </div>
      </div>

      <div className="mx-4 mt-14 rounded-xl border border-line p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div className="text-[15px] font-semibold">
          {done} of {GOAL} restaurants
        </div>
        <ProgressBar value={done / GOAL} className="mt-2.5" />
        <div className="mt-2.5 text-[15px]">49 days left</div>
      </div>

      <div className="px-4 pb-1 pt-5 text-[12px] font-bold uppercase tracking-[0.08em]">
        Recent
      </div>
      {recent.map((e) => {
        const r = restaurantById(e.restaurantId);
        return (
          <Link
            key={r.id}
            href={`/restaurant/${r.id}`}
            className="flex items-center gap-3 border-b border-line px-4 py-3.5"
          >
            <Avatar src={me.avatar} size={50} />
            <div className="min-w-0 flex-1 text-[15px] leading-snug">
              <b>You</b> ranked <b>{r.name}</b>
              <div className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink-3">
                <Utensils size={12} /> · {r.hood}, {r.city}
              </div>
            </div>
            <ScoreBadge score={e.score} />
          </Link>
        );
      })}
    </div>
  );
}
