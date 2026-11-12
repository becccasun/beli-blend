"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/** Dark teal gradient header with serif title, like the Beli challenge screen. */
export function ChallengeHero({
  title,
  medal,
  done = false,
  children,
}: {
  title: string;
  medal: string;
  done?: boolean;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="relative">
      <div className="bg-gradient-to-b from-teal via-teal-dark to-[#06181c] px-4 pb-14 pt-2 text-white">
        <div className="relative flex h-9 items-center justify-center">
          <button aria-label="Back" onClick={() => router.back()} className="absolute left-0 -ml-1 p-1">
            <ChevronLeft size={26} strokeWidth={2.2} />
          </button>
          <span className="font-serif text-[20px] font-bold">beli</span>
        </div>
        <h1 className="mt-3 text-center font-serif text-[25px] font-bold leading-tight">{title}</h1>
        {children}
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
        <Medallion label={medal} done={done} />
      </div>
    </div>
  );
}

export function Medallion({ label, done = false, size = 84 }: { label: string; done?: boolean; size?: number }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full border-[5px] shadow-[0_4px_14px_rgba(0,0,0,0.18)] ${
        done ? "border-[#d9b65c] bg-[#fff8e6]" : "border-[#cfe0e2] bg-white"
      }`}
      style={{ width: size, height: size }}
    >
      <div
        className={`flex items-center justify-center rounded-full border ${done ? "border-[#d9b65c]" : "border-teal-soft"}`}
        style={{ width: size - 18, height: size - 18 }}
      >
        <span className={`font-serif font-bold ${done ? "text-[#9a7420]" : "text-teal"}`} style={{ fontSize: size * 0.27 }}>
          {label}
        </span>
      </div>
    </div>
  );
}
