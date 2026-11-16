"use client";

import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  CircleCheck,
  Flame,
  Heart,
  Menu,
  Share,
  Shuffle,
  Trophy,
} from "lucide-react";
import { friends, me } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar, ProgressBar } from "@/components/ui";
import { ScreenSkeleton, useLoaded } from "@/components/skeleton";

export default function ProfilePage() {
  const loaded = useLoaded("profile");
  const { ranked } = useStore();
  const rows = [
    { icon: CircleCheck, label: "Been", n: ranked.length, href: "/lists" },
    { icon: Bookmark, label: "Want to Try", n: 6, href: "/lists" },
    { icon: Heart, label: "Recs for You", n: null, href: "/lists" },
    { icon: Shuffle, label: "Blends", n: null, href: "/blend", isNew: true },
  ];
  if (!loaded) return <ScreenSkeleton kind="me" />;

  return (
    <div className="pb-8">
      <div className="flex h-10 items-center justify-between px-4">
        <span className="text-[16px] font-bold">Rebecca S.</span>
        <div className="flex items-center gap-4">
          <Share size={20} strokeWidth={1.8} />
          <Menu size={24} strokeWidth={1.8} />
        </div>
      </div>
      <div className="flex flex-col items-center pt-2">
        <Avatar src={me.avatar} size={88} />
        <div className="mt-2 text-[16px] font-bold">@becca</div>
        <div className="text-[13px] text-ink-3">Member since August 2023</div>
        <div className="mt-2 flex gap-2">
          <span className="rounded-lg border border-[#cfcfcf] px-4 py-1.5 text-[14px] font-semibold">
            Edit profile
          </span>
          <span className="rounded-lg border border-[#cfcfcf] px-4 py-1.5 text-[14px] font-semibold">
            Share profile
          </span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 text-center">
        {[
          ["42", "Followers"],
          [String(friends.length), "Following"],
          ["#832", "Rank on Beli"],
        ].map(([n, l]) => (
          <div key={l}>
            <div className="text-[16px] font-bold">{n}</div>
            <div className="text-[12.5px] text-ink-3">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        {rows.map(({ icon: Icon, label, n, href, isNew }) => (
          <Link key={label} href={href} className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Icon size={24} strokeWidth={1.7} />
            <span className="flex-1 text-[16px] font-semibold">
              {label}
              {isNew && (
                <span className="ml-2 rounded-full bg-teal px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-white">
                  New
                </span>
              )}
            </span>
            {n !== null && <span className="text-[16px] font-bold">{n}</span>}
            <ChevronRight size={18} className="text-ink-3" />
          </Link>
        ))}
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Trophy size={15} /> Rank on Beli
          </div>
          <div className="mt-0.5 text-[16px] font-bold">#832</div>
        </div>
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Flame size={15} /> Current Streak
          </div>
          <div className="mt-0.5 text-[16px] font-bold">{me.streak} weeks</div>
        </div>
      </div>

      <Link href="/challenge" className="mx-4 mt-3 block rounded-xl border border-line p-3.5">
        <div className="flex items-center justify-between text-[15px] font-semibold">
          2026 Restaurant Challenge <ChevronRight size={18} className="text-ink-3" />
        </div>
        <ProgressBar value={(23 + ranked.length) / 36} className="mt-2.5" />
        <div className="mt-2 flex justify-between text-[13px] text-ink-2">
          <span>{Math.min(36, 23 + ranked.length)} of 36 restaurants</span>
          <span>49 days left</span>
        </div>
      </Link>
    </div>
  );
}
