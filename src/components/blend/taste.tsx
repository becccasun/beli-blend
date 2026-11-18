"use client";

import Link from "next/link";
import type { BlendRow, MatchParts } from "@/lib/blend";
import { Avatar, ScoreBadge } from "@/components/ui";
import { personAvatar } from "./parts";

const PARTS: { key: keyof MatchParts; label: string }[] = [
  { key: "places", label: "Places" },
  { key: "vibe", label: "Vibe" },
  { key: "cuisine", label: "Cuisine" },
];

/**
 * What the match is made of: three meters instead of a sentence. With no places in common
 * the first track stays empty and dashed, and the other two carry the number.
 */
export function MatchMeters({ parts, overlap, className = "" }: { parts: MatchParts; overlap: number; className?: string }) {
  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      {PARTS.map(({ key, label }) => {
        const v = parts[key];
        return (
          <div key={key} className="flex items-center gap-2 text-[12px]">
            <span className="w-[52px] shrink-0 text-left font-semibold text-ink-2">{label}</span>
            <span
              className={`relative h-[6px] flex-1 overflow-hidden rounded-full ${
                v === null ? "border border-dashed border-[#c4cccc]" : "bg-[#e9ecec]"
              }`}
              role="meter"
              aria-label={`${label} match`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={v ?? 0}
            >
              {v !== null && <span className="absolute inset-y-0 left-0 rounded-full bg-teal" style={{ width: `${v}%` }} />}
            </span>
            <span className="w-[92px] shrink-0 whitespace-nowrap text-right tabular-nums text-ink-2">
              {key === "places"
                ? overlap
                  ? `${v}% · ${overlap} shared`
                  : "0 shared"
                : v === null
                  ? "No data"
                  : `${v}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * For two people with no place in common: instead of a shared favourite, each side's best
 * spot the other has not tried, face to face.
 */
export function SwapCard({ theirs, mine }: { theirs?: BlendRow; mine?: BlendRow }) {
  const rows = [theirs, mine].filter((r): r is BlendRow => !!r);
  if (!rows.length) return null;
  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-[16px] border border-teal bg-teal-tint">
      <div className="px-3 pt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-teal">Swap favourites</div>
      {rows.map((row) => {
        const r = row.restaurant;
        const by = row.by ?? "me";
        return (
          <Link key={r.id} href={`/restaurant/${r.id}`} className="flex items-center gap-3 px-3 py-2.5 active:opacity-80">
            <span className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photo} alt="" className="h-[56px] w-[56px] rounded-[10px] object-cover" />
              <Avatar src={personAvatar(by)} size={24} className="absolute -bottom-1.5 -right-1.5 border-2 border-white" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-[17px] font-bold leading-tight text-ink">{r.name}</div>
              <div className="truncate text-[13px] text-ink-2">
                {r.price} | {r.cuisines.join(", ")}
              </div>
            </div>
            <ScoreBadge score={row.scores[by] ?? row.blended} size={40} />
          </Link>
        );
      })}
      <div className="h-1" />
    </div>
  );
}
