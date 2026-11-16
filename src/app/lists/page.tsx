"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Bookmark,
  ChevronDown,
  CirclePlus,
  Ellipsis,
  Map,
  Search,
  Share,
  SlidersHorizontal,
} from "lucide-react";
import { restaurantById, restaurants } from "@/lib/data";
import { useStore } from "@/lib/store";
import { OutlineChip, ScoreBadge } from "@/components/ui";
import { ScreenSkeleton, useLoaded } from "@/components/skeleton";

const tabs = ["Been", "Want to Try", "Recs", "Playlists"] as const;

export default function ListsPage() {
  const loaded = useLoaded("lists");
  const { ranked } = useStore();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Been");
  const rankedIds = new Set(ranked.map((e) => e.restaurantId));
  const unranked = restaurants.filter((r) => !rankedIds.has(r.id));
  const recs = [...unranked].sort((a, b) => b.recScore - a.recScore);
  const want = unranked.slice(3, 9);

  if (!loaded) return <ScreenSkeleton kind="list" />;

  return (
    <div className="pb-6">
      <div className="relative flex h-10 items-center justify-center">
        <span className="text-[12px] font-bold uppercase tracking-[0.1em]">My Lists</span>
        <div className="absolute right-4 flex items-center gap-4">
          <Share size={20} strokeWidth={1.8} />
          <Ellipsis size={22} />
        </div>
      </div>
      <div className="flex items-center gap-1 px-4 text-[22px] font-bold">
        Restaurants <ChevronDown size={20} strokeWidth={2.4} />
      </div>
      <div className="mt-1 flex gap-5 border-b border-line px-4 text-[15px] font-semibold">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-1.5 ${
              tab === t ? "border-ink text-ink" : "border-transparent text-ink-3"
            }`}
          >
            {t}
          </button>
        ))}
        <span className="pb-1.5 text-ink-3">More</span>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        <OutlineChip active>
          <SlidersHorizontal size={14} />
        </OutlineChip>
        {["City", "Reserve", "Open now", "Cuisine", "Price"].map((c) => (
          <OutlineChip key={c}>
            {c}
            {(c === "City" || c === "Cuisine") && <ChevronDown size={14} />}
          </OutlineChip>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 pb-1 text-[14px] font-medium text-teal">
        <span className="flex items-center gap-1">
          <ArrowUpDown size={14} /> Score
        </span>
        <Search size={18} />
      </div>

      {tab === "Been" &&
        ranked.map((e, i) => {
          const r = restaurantById(e.restaurantId);
          return (
            <Link
              key={r.id}
              href={`/restaurant/${r.id}`}
              className="flex items-start gap-3 border-b border-line px-4 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-bold">
                  {i + 1}. {r.name}
                </div>
                <div className="text-[13.5px]">
                  {r.price} | {r.cuisines.join(", ")}
                </div>
                <div className="text-[13.5px]">
                  {r.hood}, {r.city}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-3">
                  0.{(i * 3 + 2) % 9 || 4} mi · {r.hours}
                  {e.method === "manual" && (
                    <span className="rounded-full bg-teal-tint px-1.5 py-px text-[10px] font-semibold text-teal">
                      Scored by you
                    </span>
                  )}
                </div>
              </div>
              <ScoreBadge score={e.score} />
            </Link>
          );
        })}

      {(tab === "Recs" || tab === "Want to Try") &&
        (tab === "Recs" ? recs : want).map((r) => (
          <Link
            key={r.id}
            href={`/restaurant/${r.id}`}
            className="block border-b border-line px-4 py-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-bold">{r.name}</div>
                <div className="text-[13.5px]">
                  {r.price} | {r.cuisines.join(", ")}
                </div>
                <div className="text-[13.5px]">
                  {r.hood}, {r.city}
                </div>
              </div>
              <ScoreBadge score={r.recScore} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[12px] text-ink-3">0.4 mi · {r.hours}</span>
              <span className="flex gap-3">
                <CirclePlus size={24} strokeWidth={1.6} />
                <Bookmark size={24} strokeWidth={1.6} fill={tab === "Want to Try" ? "#111" : "none"} />
              </span>
            </div>
          </Link>
        ))}

      {tab === "Playlists" && (
        <div className="px-8 py-16 text-center text-[14px] text-ink-3">
          Playlists are not part of this prototype.
        </div>
      )}

      <div className="pointer-events-none sticky bottom-3 flex justify-end px-4">
        <span className="flex h-10 items-center gap-1.5 rounded-full bg-teal px-4 text-[14px] font-semibold text-white shadow-lg">
          <Map size={16} /> View Map
        </span>
      </div>
    </div>
  );
}
