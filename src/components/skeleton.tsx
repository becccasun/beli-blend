"use client";

import { useEffect, useState } from "react";
import { BackHeader } from "./ui";

/**
 * Pretend network. The prototype has no backend, so each screen waits a beat the first time
 * its data is "fetched" and shows a skeleton meanwhile. Anything already loaded this session
 * comes back instantly, the way a cached screen would. A full reload clears it.
 */
const seen = new Set<string>();

export const markLoaded = (key: string) => {
  seen.add(key);
};

/** False while `key` is loading for the first time. Pass null when there is nothing to load. */
export function useLoaded(key: string | null, ms = 750) {
  const [ready, setReady] = useState<string | null>(() => (key && seen.has(key) ? key : null));
  useEffect(() => {
    if (!key) return;
    if (seen.has(key)) {
      setReady(key);
      return;
    }
    const t = setTimeout(() => {
      seen.add(key);
      setReady(key);
    }, ms);
    return () => clearTimeout(t);
  }, [key, ms]);
  return !key || ready === key || seen.has(key);
}

/** The shimmer and the "curating" dots. Mounted once in PhoneShell. */
export function SkeletonStyles() {
  return <style>{`/* Loading placeholders: a soft band of light sweeping across grey blocks. */
@keyframes skeleton-sweep {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
.skeleton {
  background: linear-gradient(90deg, #eef0f0 0%, #eef0f0 35%, #f8f9f9 50%, #eef0f0 65%, #eef0f0 100%);
  background-size: 200% 100%;
  animation: skeleton-sweep 1.3s linear infinite;
}

/* "Curating": three dots taking turns. */
@keyframes curating-hop {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
.curating-dots {
  display: inline-flex;
  gap: 3px;
}
.curating-dots i {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--teal);
  animation: curating-hop 1s ease-in-out infinite;
}
.curating-dots i:nth-child(2) {
  animation-delay: 0.15s;
}
.curating-dots i:nth-child(3) {
  animation-delay: 0.3s;
}
@media (prefers-reduced-motion: reduce) {
  .skeleton,
  .curating-dots i {
    animation: none;
  }
}`}</style>;
}

/** One shimmering block. Size it with classes. */
export function Bone({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`skeleton block rounded-[6px] ${className}`} />;
}

const Busy = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div role="status" aria-label={label} aria-busy="true">
    {children}
  </div>
);

/** Rows in Beli's list style: two lines of text and a round score. */
export function RowsSkeleton({ rows = 4, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="border-t border-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3">
          {avatar && <Bone className="h-11 w-11 shrink-0 !rounded-full" />}
          <div className="min-w-0 flex-1">
            <Bone className={`h-4 ${["w-[62%]", "w-[48%]", "w-[70%]", "w-[55%]"][i % 4]}`} />
            <Bone className={`mt-2 h-3 ${["w-[40%]", "w-[52%]", "w-[36%]", "w-[44%]"][i % 4]}`} />
          </div>
          {!avatar && <Bone className="h-10 w-10 shrink-0 !rounded-full" />}
        </div>
      ))}
    </div>
  );
}

/** Stacked cards on the Blends page. */
export function BlendCardsSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <Busy label="Loading pairings">
      <Bone className="mx-4 mb-2 mt-5 h-3 w-24" />
      <div className="mx-4 flex flex-col gap-2.5">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-[16px] border border-line p-3.5">
            <span className="flex shrink-0">
              <Bone className="h-12 w-12 !rounded-full" />
              <Bone className="-ml-3.5 h-12 w-12 !rounded-full border-2 border-white" />
            </span>
            <div className="min-w-0 flex-1">
              <Bone className="h-4 w-[58%]" />
              <Bone className="mt-2 h-3 w-[38%]" />
            </div>
            <Bone className="h-7 w-12" />
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** Someone's profile. */
export function ProfileSkeleton() {
  return (
    <Busy label="Loading profile">
      <BackHeader />
      <div className="flex flex-col items-center pt-2">
        <Bone className="h-[88px] w-[88px] !rounded-full" />
        <Bone className="mt-3 h-4 w-28" />
        <Bone className="mt-2 h-3 w-20" />
        <div className="mt-3 flex gap-2">
          <Bone className="h-9 w-[104px] !rounded-lg" />
          <Bone className="h-9 w-[104px] !rounded-lg" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 justify-items-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <Bone className="h-4 w-10" />
            <Bone className="mt-1.5 h-3 w-14" />
          </div>
        ))}
      </div>
      <Bone className="mx-4 mt-5 h-[84px] !rounded-[16px]" />
      <div className="mx-4 mt-3 grid grid-cols-2 gap-2.5">
        <Bone className="h-[62px] !rounded-xl" />
        <Bone className="h-[62px] !rounded-xl" />
      </div>
      <Bone className="mx-4 mb-2 mt-5 h-3 w-32" />
      <RowsSkeleton rows={3} />
    </Busy>
  );
}

/** A blend: the two faces, the match, then whatever comes next. */
export function BlendSkeleton() {
  return (
    <Busy label="Loading pairing">
      <BackHeader title="Pairing" />
      <div className="flex flex-col items-center px-4 pb-4 pt-3">
        <span className="flex">
          <Bone className="h-16 w-16 !rounded-full" />
          <Bone className="-ml-5 h-16 w-16 !rounded-full border-2 border-white" />
        </span>
        <Bone className="mt-3 h-4 w-24" />
        <Bone className="mt-2 h-[48px] w-[104px] !rounded-[10px]" />
        <Bone className="mt-2 h-3 w-24" />
      </div>
      <Bone className="mx-4 h-[44px] !rounded-full" />
      <Bone className="mx-4 mb-2 mt-5 h-3 w-28" />
      <Bone className="mx-4 h-[180px] !rounded-[14px]" />
    </Busy>
  );
}

/**
 * Shown while a city's list is put together: three dots that take turns, the city's name,
 * and the shape of the list that is about to land.
 */
export function CuratingSkeleton({ city }: { city: string }) {
  return (
    <Busy label={`Finding places in ${city}`}>
      <div className="flex items-center justify-center gap-2 px-4 pt-4 text-[13px] font-semibold text-teal">
        <span className="curating-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        Finding places in {city}
      </div>
      <div className="mx-4 mt-3 rounded-[16px] border border-line p-3">
        <div className="flex gap-3">
          <Bone className="h-[76px] w-[76px] shrink-0 !rounded-[10px]" />
          <div className="min-w-0 flex-1 pt-1">
            <Bone className="h-3 w-16" />
            <Bone className="mt-2 h-5 w-[70%]" />
            <Bone className="mt-2 h-3 w-[52%]" />
          </div>
          <Bone className="h-10 w-10 shrink-0 !rounded-full" />
        </div>
        <Bone className="mt-3 h-10 !rounded-full" />
      </div>
      <Bone className="mx-4 mb-2 mt-5 h-3 w-28" />
      <RowsSkeleton rows={4} />
    </Busy>
  );
}

/** Posts on the home feed. */
export function FeedSkeleton({ posts = 3 }: { posts?: number }) {
  return (
    <Busy label="Loading feed">
      {Array.from({ length: posts }, (_, i) => (
        <div key={i} className="border-b border-line px-4 py-4">
          <div className="flex gap-3">
            <Bone className="h-14 w-14 shrink-0 !rounded-full" />
            <div className="min-w-0 flex-1 pt-1">
              <Bone className="h-4 w-[82%]" />
              <Bone className="mt-2 h-3 w-[46%]" />
            </div>
            <Bone className="h-10 w-10 shrink-0 !rounded-full" />
          </div>
          {i % 2 === 0 && (
            <div className="mt-3 flex gap-1.5 overflow-hidden">
              <Bone className="h-[118px] w-[118px] shrink-0 !rounded-lg" />
              <Bone className="h-[118px] w-[118px] shrink-0 !rounded-lg" />
              <Bone className="h-[118px] w-[118px] shrink-0 !rounded-lg" />
            </div>
          )}
        </div>
      ))}
    </Busy>
  );
}

/**
 * Stand-ins for the rest of the app, by the shape of the screen:
 *  - "list":   a title, filter chips and ranked rows (Your Lists, Search)
 *  - "board":  a tab strip and rows of people (Leaderboard)
 *  - "place":  a map and photo header, then details (a restaurant)
 *  - "cards":  a title and stacked cards (the yearly challenge)
 *  - "detail": a header card, a progress bar and rows (one challenge)
 *  - "me":     your own profile
 */
export function ScreenSkeleton({ kind }: { kind: "list" | "board" | "place" | "cards" | "detail" | "me" }) {
  if (kind === "place")
    return (
      <Busy label="Loading restaurant">
        <Bone className="h-[230px] !rounded-none" />
        <div className="px-4 pt-4">
          <Bone className="h-6 w-[64%]" />
          <Bone className="mt-2 h-3 w-[46%]" />
          <div className="mt-3 flex gap-2">
            <Bone className="h-7 w-20 !rounded-full" />
            <Bone className="h-7 w-24 !rounded-full" />
            <Bone className="h-7 w-16 !rounded-full" />
          </div>
          <Bone className="mt-4 h-11 !rounded-full" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Bone className="h-[70px] !rounded-xl" />
            <Bone className="h-[70px] !rounded-xl" />
            <Bone className="h-[70px] !rounded-xl" />
          </div>
        </div>
        <Bone className="mx-4 mb-2 mt-5 h-3 w-28" />
        <RowsSkeleton rows={2} avatar />
      </Busy>
    );
  if (kind === "me")
    return (
      <Busy label="Loading profile">
        <div className="flex h-10 items-center justify-between px-4">
          <Bone className="h-4 w-24" />
          <Bone className="h-5 w-14" />
        </div>
        <div className="flex flex-col items-center pt-2">
          <Bone className="h-[88px] w-[88px] !rounded-full" />
          <Bone className="mt-3 h-4 w-20" />
          <Bone className="mt-2 h-3 w-36" />
          <div className="mt-3 flex gap-2">
            <Bone className="h-9 w-[104px] !rounded-lg" />
            <Bone className="h-9 w-[112px] !rounded-lg" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 justify-items-center">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center">
              <Bone className="h-4 w-10" />
              <Bone className="mt-1.5 h-3 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Bone className="h-6 w-6" />
              <Bone className={`h-4 ${["w-16", "w-28", "w-32", "w-36", "w-20"][i]}`} />
            </div>
          ))}
        </div>
      </Busy>
    );
  if (kind === "cards" || kind === "detail")
    return (
      <Busy label="Loading">
        <BackHeader />
        <div className="px-4 pt-2">
          <Bone className="h-7 w-[58%]" />
          <Bone className="mt-2 h-3 w-[72%]" />
        </div>
        {kind === "detail" ? (
          <>
            <Bone className="mx-4 mt-4 h-[120px] !rounded-[16px]" />
            <Bone className="mx-4 mt-4 h-2 !rounded-full" />
            <Bone className="mx-4 mb-2 mt-5 h-3 w-24" />
            <RowsSkeleton rows={4} />
          </>
        ) : (
          <div className="mx-4 mt-4 flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-[16px] border border-line p-3.5">
                <Bone className="h-4 w-[52%]" />
                <Bone className="mt-2 h-3 w-[70%]" />
                <Bone className="mt-3 h-2 !rounded-full" />
              </div>
            ))}
          </div>
        )}
      </Busy>
    );
  return (
    <Busy label="Loading">
      <div className="flex h-10 items-center justify-center">
        <Bone className="h-3 w-24" />
      </div>
      {kind === "board" ? (
        <Bone className="mx-4 h-9 !rounded-lg" />
      ) : (
        <div className="flex gap-2 px-4 pt-1">
          <Bone className="h-[30px] w-16 !rounded-full" />
          <Bone className="h-[30px] w-24 !rounded-full" />
          <Bone className="h-[30px] w-20 !rounded-full" />
        </div>
      )}
      <div className="mt-4">
        <RowsSkeleton rows={6} avatar={kind === "board"} />
      </div>
    </Busy>
  );
}
