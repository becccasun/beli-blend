"use client";

import Link from "next/link";
import { useState } from "react";
import { fmtScore } from "@/lib/data";
import type { BlendResult, BlendRow, MatchParts, Person } from "@/lib/blend";
import { Avatar, ScoreBadge, SectionLabel } from "@/components/ui";
import { personAvatar } from "./parts";

/**
 * One colour per person, in a fixed order (you, then each friend), so a face keeps its colour
 * everywhere. Checked for colour-blind separation and contrast on white.
 */
export const PERSON_COLORS = ["#00889e", "#cf7417", "#8b5fd0"];

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

const LO = 5;
const HI = 10;
const pct = (score: number) => ((Math.max(LO, Math.min(HI, score)) - LO) / (HI - LO)) * 100;

/**
 * Taste profile: one row per kind of place, one dot per person at their average score for it.
 * Dots close together mean you agree; the grey bar between them is the gap. Tap a row for the numbers.
 */
export function TasteProfile({ traits, people }: { traits: BlendResult["traits"]; people: Person[] }) {
  const [sel, setSel] = useState<string | null>(null);
  if (!traits.length) return null;
  const color = (id: string) => PERSON_COLORS[people.findIndex((p) => p.id === id)] ?? PERSON_COLORS[0];
  return (
    <section>
      <SectionLabel>Taste profile</SectionLabel>
      <div className="mx-4 rounded-[14px] bg-fill p-3.5">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {people.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color(p.id) }} />
              <Avatar src={personAvatar(p.id)} size={16} className="border-0" />
              {p.name}
            </span>
          ))}
        </div>

        <div className="flex flex-col" onMouseLeave={() => setSel(null)}>
          {traits.map((t) => {
            const pts = people
              .filter((p) => t.per[p.id] !== undefined)
              .map((p) => ({ id: p.id, name: p.name, score: t.per[p.id] }))
              .sort((a, b) => a.score - b.score);
            const lo = pts[0];
            const hi = pts[pts.length - 1];
            const on = sel === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSel(on ? null : t.id)}
                onMouseEnter={() => setSel(t.id)}
                onFocus={() => setSel(t.id)}
                aria-label={`${t.label}: ${pts.map((p) => `${p.name} ${fmtScore(p.score)}`).join(", ")}`}
                className="flex h-[34px] items-center gap-2 rounded-[8px] text-left"
              >
                <span className={`w-[72px] shrink-0 text-[13px] ${on ? "font-bold text-ink" : "font-semibold text-ink"}`}>
                  {t.label}
                </span>
                <span className="relative h-full flex-1">
                  {/* scale: faint ticks at 6, 8 and 10 */}
                  {[6, 8, 10].map((g) => (
                    <span key={g} className="absolute inset-y-0 w-px bg-white" style={{ left: `${pct(g)}%` }} />
                  ))}
                  <span
                    className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#b9c2c2]"
                    style={{ left: `${pct(lo.score)}%`, width: `${pct(hi.score) - pct(lo.score)}%` }}
                  />
                  {pts.map((p) => (
                    <span
                      key={p.id}
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#efefef]"
                      style={{ left: `${pct(p.score)}%`, background: color(p.id) }}
                    />
                  ))}
                  {on && (
                    <>
                      <span
                        className="absolute top-1/2 -translate-y-1/2 pr-2.5 text-[11px] font-semibold tabular-nums text-ink"
                        style={{ right: `${100 - pct(lo.score)}%` }}
                      >
                        {fmtScore(lo.score)}
                      </span>
                      {hi !== lo && (
                        <span
                          className="absolute top-1/2 -translate-y-1/2 pl-2.5 text-[11px] font-semibold tabular-nums text-ink"
                          style={{ left: `${pct(hi.score)}%` }}
                        >
                          {fmtScore(hi.score)}
                        </span>
                      )}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1 text-[10px] tabular-nums text-ink-3" aria-hidden>
          <span className="w-[72px] shrink-0" />
          <span className="relative h-3 flex-1">
            {[6, 8, 10].map((g) => (
              <span key={g} className="absolute -translate-x-1/2" style={{ left: `${pct(g)}%` }}>
                {g}
              </span>
            ))}
          </span>
        </div>

        {/* the same numbers as a table, for screen readers */}
        <table className="sr-only">
          <caption>Average score by kind of place</caption>
          <thead>
            <tr>
              <th>Kind of place</th>
              {people.map((p) => (
                <th key={p.id}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {traits.map((t) => (
              <tr key={t.id}>
                <th>{t.label}</th>
                {people.map((p) => (
                  <td key={p.id}>{t.per[p.id] === undefined ? "none" : fmtScore(t.per[p.id])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
