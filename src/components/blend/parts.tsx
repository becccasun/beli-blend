"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, MapPin, Send, Share, X } from "lucide-react";
import { cityName, countries, countryFlag, countryOf, fmtScore, friendById, friendRatings, me, type Friend } from "@/lib/data";
import { commonLabel, type BlendResult, type BlendRow, type CityOption, type Person, type RatingMap } from "@/lib/blend";
import { useStore } from "@/lib/store";
import { Avatar, AvatarStack, ScoreBadge } from "@/components/ui";
import { CityWheel } from "./CityWheel";

/** Everyone's scores, with the signed-in user's live rankings under "me". */
export function useRatings(): RatingMap {
  const { ranked } = useStore();
  return useMemo(() => {
    const mine: Record<string, number> = {};
    for (const e of ranked) mine[e.restaurantId] = e.score;
    return { ...friendRatings, me: mine };
  }, [ranked]);
}

export const toPeople = (friends: Friend[]): Person[] => [
  { id: "me", name: "You" },
  ...friends.map((f) => ({ id: f.id, name: f.name })),
];

/** "Maya" or "Maya and Judy" */
export const namesOf = (friends: Friend[]) => friends.map((f) => f.name).join(" and ");

export const personAvatar = (id: string) => (id === "me" ? me.avatar : friendById(id).avatar);
export const firstName = (p: Person) => (p.id === "me" ? "You" : p.name);

export function groupTitle(friends: Friend[]) {
  return friends.length === 1 ? `You + ${friends[0].name}` : `You, ${friends[0].name} + ${friends[1].name}`;
}

export function usePortalTarget() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => setEl(document.getElementById("phone-root")), []);
  return el;
}

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Little "who scored what" pills: avatar + score, side by side. */
export function PersonScores({ row, people }: { row: BlendRow; people: Person[] }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {people.map((p) => {
        const s = row.scores[p.id];
        return (
          <span
            key={p.id}
            className="inline-flex h-[24px] items-center gap-1 rounded-full bg-fill pl-0.5 pr-2 text-[12px] font-semibold tabular-nums text-ink-2"
          >
            <Avatar src={personAvatar(p.id)} size={20} className="border-0" />
            {s === undefined ? "new" : fmtScore(s)}
          </span>
        );
      })}
    </div>
  );
}

/** Numbered list row in Beli's list style, with a circled blended score on the right. */
export function BlendListRow({
  row,
  index,
  people,
  sub,
  showScores = true,
  predicted = false,
}: {
  row: BlendRow;
  index?: number;
  people: Person[];
  sub?: string;
  showScores?: boolean;
  predicted?: boolean;
}) {
  const r = row.restaurant;
  return (
    <Link href={`/restaurant/${r.id}`} className="flex items-start gap-3 border-b border-line px-4 py-3 active:bg-fill">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-bold text-ink">
          {index !== undefined && `${index}. `}
          {r.name}
        </div>
        <div className="truncate text-[13px] text-ink-2">
          {r.price} | {r.cuisines.join(", ")}
        </div>
        {sub && <div className="mt-0.5 text-[13px] text-teal">{sub}</div>}
        {showScores && <PersonScores row={row} people={people} />}
      </div>
      <div className="flex flex-col items-center gap-0.5 pt-0.5">
        <ScoreBadge score={row.blended} size={40} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-3">
          {predicted ? "predicted" : "blend"}
        </span>
      </div>
    </Link>
  );
}

/** Two (or three) avatars sliding together, then the result appears. ~1.5s, instant-ish with reduced motion. */
export function BlendingMoment({ friends, onDone }: { friends: Friend[]; onDone: () => void }) {
  const target = usePortalTarget();
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const t = setTimeout(() => done.current(), prefersReducedMotion() ? 500 : 1500);
    return () => clearTimeout(t);
  }, []);
  if (!target) return null;
  const srcs = [me.avatar, ...friends.map((f) => f.avatar)];
  const offsets = srcs.length === 2 ? [-46, 46] : [-60, 0, 60];
  return createPortal(
    <div className="absolute inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-white">
      <style>{`
        @keyframes blend-merge { 0% { transform: translateX(var(--from)) scale(1); } 70% { transform: translateX(calc(var(--from) * 0.12)) scale(0.96); } 100% { transform: translateX(calc(var(--from) * 0.18)) scale(1); } }
        @keyframes blend-pulse { 0%, 60% { opacity: 0; transform: scale(0.6); } 100% { opacity: 1; transform: scale(1); } }
        .blend-merge { animation: blend-merge 1.3s cubic-bezier(0.5, 0, 0.2, 1) both; }
        .blend-pulse { animation: blend-pulse 1.4s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .blend-merge { animation: none; transform: translateX(calc(var(--from) * 0.18)); }
          .blend-pulse { animation: none; }
        }
      `}</style>
      <div className="relative flex h-[120px] w-[240px] items-center justify-center">
        <span className="blend-pulse absolute h-[112px] w-[112px] rounded-full bg-teal-tint" />
        {srcs.map((s, i) => (
          <span
            key={s}
            className="blend-merge absolute"
            style={{ ["--from" as string]: `${offsets[i]}px`, zIndex: i }}
          >
            <Avatar src={s} size={72} className="border-[3px] border-white shadow-md" />
          </span>
        ))}
      </div>
      <div className="mt-6 font-serif text-[24px] font-bold text-ink">Blending your tastes</div>
      <div className="mt-1 text-[14px] text-ink-2">Comparing every ranking, give us a sec</div>
    </div>,
    target
  );
}

/** Beli-style share card: teal background, white card, serif wordmark. */
export function BlendShareCard({
  result,
  title,
  city,
  onClose,
  onShare,
}: {
  result: BlendResult;
  title: string;
  city?: string;
  onClose: () => void;
  onShare: () => void;
}) {
  const target = usePortalTarget();
  if (!target) return null;
  const picks = (result.shared.length ? result.shared : result.tryTogether).slice(0, 3);
  const where = city ? ` in ${cityName(city)}` : "";
  const pickLabel = result.shared.length ? `Top shared picks${where}` : `Top picks to try together${where}`;
  return createPortal(
    <div className="absolute inset-0 z-50 flex animate-fade-in flex-col bg-teal">
      <div className="flex h-14 items-center justify-between px-4 pt-10">
        <button aria-label="Close" onClick={onClose} className="p-1 text-white">
          <X size={24} />
        </button>
        <button aria-label="Share" onClick={onShare} className="p-1 text-white">
          <Share size={22} />
        </button>
      </div>
      <div className="flex flex-1 items-center px-5">
        <div className="w-full animate-sheet-up rounded-[18px] bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AvatarStack srcs={result.people.map((p) => personAvatar(p.id))} size={44} />
              <div className="min-w-0">
                <div className="text-[13px] text-ink-2">Our Beli Blend</div>
                <div className="truncate text-[15px] font-bold text-ink">{title}</div>
              </div>
            </div>
            <span className="font-serif text-[26px] font-bold leading-none text-teal">beli</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-[44px] font-bold leading-none text-teal">{result.match}%</span>
            <span className="text-[14px] font-semibold text-ink-2">taste match</span>
          </div>
          <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3">{pickLabel}</div>
          <div className="mt-1">
            {picks.map((row, i) => (
              <div key={row.restaurant.id} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-ink">
                    {i + 1}. {row.restaurant.name}
                  </div>
                  <div className="truncate text-[12px] text-ink-3">
                    {row.restaurant.cuisines[0]} · {row.restaurant.hood}
                  </div>
                </div>
                <ScoreBadge score={row.blended} size={36} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="h-24" />
    </div>,
    target
  );
}

/**
 * "Where are you eating?" as a bottom sheet. The pair turns the wheel to a city and confirms;
 * Blend only notes how many places they have in common there.
 */
export function CitySheet({
  options,
  current,
  onPick,
  onClose,
}: {
  options: CityOption[];
  current?: string;
  onPick: (city: string) => void;
  onClose: () => void;
}) {
  const target = usePortalTarget();
  const [city, setCity] = useState(current ?? options[0]?.city ?? "");
  const country = countryOf(city);
  const here = options.filter((o) => countryOf(o.city) === country);
  if (!target) return null;
  return createPortal(
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="animate-fade-in absolute inset-0 bg-black/40" />
      <div className="animate-sheet-up relative rounded-t-[20px] bg-white pb-8 pt-3">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" />
        <div className="text-center font-serif text-[22px] font-bold text-ink">Where are you eating?</div>
        <div role="tablist" aria-label="Country" className="no-scrollbar mt-3 flex justify-center gap-1.5 overflow-x-auto px-4">
          {countries.map((c) => {
            const on = c === country;
            return (
              <button
                key={c}
                role="tab"
                aria-selected={on}
                aria-label={c}
                onClick={() => {
                  // Switching country lands on its first city, the one with the most in common.
                  if (!on) setCity(options.find((o) => countryOf(o.city) === c)?.city ?? city);
                }}
                className={`inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[14px] font-semibold transition ${
                  on ? "border-teal bg-teal text-white" : "border-[#cfcfcf] bg-white text-ink"
                }`}
              >
                <span aria-hidden>{countryFlag[c]}</span>
                {c === "United States" ? "USA" : c}
              </button>
            );
          })}
        </div>
        <div className="px-4">
          <CityWheel
            key={country}
            items={here.map((o) => ({ value: o.city, label: cityName(o.city), note: commonLabel(o.common) }))}
            value={city}
            onChange={setCity}
          />
          <button
            onClick={() => onPick(city)}
            className="flex h-[44px] w-full items-center justify-center gap-2 rounded-full bg-teal text-[15px] font-semibold text-white transition active:scale-[0.99]"
          >
            <MapPin size={16} />
            Eat in {cityName(city)}
          </button>
        </div>
      </div>
    </div>,
    target
  );
}

/** One suggestion at the top of a city's list, with a way to act on it. */
export function StartHereCard({
  row,
  predicted,
  toName,
  onSuggest,
}: {
  row: BlendRow;
  predicted: boolean;
  toName: string;
  onSuggest: () => void;
}) {
  const [sent, setSent] = useState(false);
  const r = row.restaurant;
  return (
    <div className="mx-4 mt-4 overflow-hidden rounded-[16px] border border-teal bg-teal-tint">
      <Link href={`/restaurant/${r.id}`} className="flex gap-3 p-3 active:opacity-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.photo} alt="" className="h-[76px] w-[76px] shrink-0 rounded-[10px] object-cover" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-teal">Start here</div>
          <div className="truncate font-serif text-[19px] font-bold leading-tight text-ink">{r.name}</div>
          <div className="truncate text-[13px] text-ink-2">
            {r.price} | {r.cuisines.join(", ")}
          </div>
          <div className="truncate text-[13px] text-ink-3">{r.hood}</div>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <ScoreBadge score={row.blended} size={40} />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-3">
            {predicted ? "predicted" : "score"}
          </span>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <button
          onClick={() => {
            if (sent) return;
            setSent(true);
            onSuggest();
          }}
          className={`flex h-[40px] w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold transition active:scale-[0.99] ${
            sent ? "border border-teal bg-white text-teal" : "bg-teal text-white"
          }`}
        >
          {sent ? <Check size={16} strokeWidth={3} /> : <Send size={15} />}
          {sent ? `Suggested to ${toName}` : `Suggest it to ${toName}`}
        </button>
      </div>
    </div>
  );
}
