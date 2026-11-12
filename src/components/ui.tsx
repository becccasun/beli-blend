"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { fmtScore, scoreTone } from "@/lib/data";

const toneText = { liked: "text-good", fine: "text-ok", disliked: "text-bad" } as const;

/** The circled score that appears next to every ranked place. */
export function ScoreBadge({
  score,
  size = 40,
  className = "",
}: {
  score: number | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-[#cfcfcf] bg-white font-semibold tabular-nums ${
        score === null ? "text-ink-3" : toneText[scoreTone(score)]
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {score === null ? "?" : fmtScore(score)}
    </span>
  );
}

export function Avatar({
  src,
  size = 56,
  className = "",
  alt = "",
}: {
  src: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 rounded-full border border-line object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Overlapping avatar row for teams and blends. */
export function AvatarStack({ srcs, size = 32 }: { srcs: string[]; size?: number }) {
  return (
    <span className="flex">
      {srcs.map((s, i) => (
        <Avatar
          key={s + i}
          src={s}
          size={size}
          className="border-2 border-white"
          // overlap
          alt=""
        />
      )).map((el, i) => (
        <span key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          {el}
        </span>
      ))}
    </span>
  );
}

/** Solid teal pill used in the feed header ("Trending", "Recs Nearby"). */
export function TealChip({
  children,
  href,
  muted = false,
}: {
  children: React.ReactNode;
  href?: string;
  muted?: boolean;
}) {
  const cls = `inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold text-white ${
    muted ? "bg-teal-soft" : "bg-teal"
  }`;
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <span className={cls}>{children}</span>
  );
}

/** Outlined filter pill used on list screens. */
export function OutlineChip({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-[30px] shrink-0 items-center gap-1 rounded-full border px-3 text-[13px] font-medium ${
        active ? "border-teal bg-teal-tint text-teal" : "border-ink text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/** Primary full-width teal button ("Invite friends", "Set goal"). */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-[44px] w-full rounded-full bg-teal text-[15px] font-semibold text-white transition active:scale-[0.99] disabled:bg-teal-soft ${className}`}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-2 pt-4 text-[12px] font-bold uppercase tracking-[0.08em] text-ink">
      {children}
    </div>
  );
}

/** Plain top bar with a back chevron and centered title, used on pushed screens. */
export function BackHeader({ title, right }: { title?: string; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-20 flex h-11 items-center justify-between bg-white px-3">
      <button aria-label="Back" onClick={() => router.back()} className="-ml-1 p-1">
        <ChevronLeft size={26} strokeWidth={2.2} />
      </button>
      {title && (
        <div className="absolute left-1/2 -translate-x-1/2 text-[12px] font-bold uppercase tracking-[0.1em]">
          {title}
        </div>
      )}
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
}

/** Thin progress bar matching the challenge screen. */
export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-[6px] w-full overflow-hidden rounded-full bg-[#e9ecec] ${className}`}>
      <div
        className="h-full rounded-full bg-[#4f7c87] transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}
