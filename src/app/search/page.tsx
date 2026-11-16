"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CirclePlus, Search } from "lucide-react";
import { restaurants } from "@/lib/data";
import { useStore } from "@/lib/store";
import { RowsSkeleton, useLoaded } from "@/components/skeleton";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const loaded = useLoaded("search");
  const { getEntry } = useStore();
  const results = restaurants.filter((r) =>
    (r.name + r.cuisines.join(" ")).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-white px-4 pb-2 pt-2">
        <label className="flex h-[36px] items-center gap-2 rounded-[10px] bg-fill px-3">
          <Search size={17} className="text-ink-3" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a restaurant to rank"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-3"
          />
        </label>
        <div className="mt-2 flex gap-5 text-[14px] font-semibold">
          <span className="border-b-2 border-ink pb-1">Restaurants</span>
          <span className="pb-1 text-ink-3">Members</span>
        </div>
      </div>
      {!loaded && <RowsSkeleton rows={7} avatar />}
      {loaded &&
        results.map((r) => {
        const done = !!getEntry(r.id);
        return (
          <Link
            key={r.id}
            href={`/restaurant/${r.id}`}
            className="flex items-center gap-3 border-b border-line px-4 py-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.photo} alt="" className="h-11 w-11 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15.5px] font-semibold">{r.name}</div>
              <div className="truncate text-[13px] text-ink-3">
                {r.cuisines[0]} · {r.hood}, {r.city}
              </div>
            </div>
            {done ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-good text-good">
                <Check size={14} strokeWidth={3} />
              </span>
            ) : (
              <CirclePlus size={24} strokeWidth={1.6} />
            )}
          </Link>
        );
        })}
    </div>
  );
}
