"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share, X } from "lucide-react";
import { fmtScore, friendById, me, type Friend } from "@/lib/data";
import type { BlendResult, BlendRow, Person } from "@/lib/blend";
import { Avatar, AvatarStack, ScoreBadge } from "@/components/ui";

export const personAvatar = (id: string) => (id === "me" ? me.avatar : friendById(id).avatar);
export const firstName = (p: Person) => (p.id === "me" ? "You" : p.name);

export function groupTitle(friends: Friend[]) {
  return friends.length === 1 ? `You + ${friends[0].name}` : `You, ${friends[0].name} + ${friends[1].name}`;
}

function usePortalTarget() {
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
  useEffect(() => {
    const t = setTimeout(onDone, prefersReducedMotion() ? 500 : 1500);
    return () => clearTimeout(t);
  }, [onDone]);
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
  onClose,
  onShare,
}: {
  result: BlendResult;
  title: string;
  onClose: () => void;
  onShare: () => void;
}) {
  const target = usePortalTarget();
  if (!target) return null;
  const picks = (result.shared.length ? result.shared : result.tryTogether).slice(0, 3);
  const pickLabel = result.shared.length ? "Top shared picks" : "Top picks to try together";
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
