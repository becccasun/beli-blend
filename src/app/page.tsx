"use client";

import Link from "next/link";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  CirclePlus,
  Heart,
  Menu,
  MessageCircle,
  Navigation,
  RefreshCw,
  Search,
  Send,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";
import { FeedSkeleton, useLoaded } from "@/components/skeleton";
import { feed, friendById, friends, me, restaurantById } from "@/lib/data";
import { Avatar, AvatarStack, PrimaryButton, ScoreBadge, TealChip } from "@/components/ui";

const unlocks = ["Average Scores", "Dish Search", "Stealth Mode", "Social Links"];

export default function FeedPage() {
  const loaded = useLoaded("feed", 900);
  return (
    <div className="pb-6">
      {/* header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-2">
        <span className="font-serif text-[26px] font-bold leading-none text-teal">beli</span>
        <div className="flex items-center gap-4 text-ink">
          <CalendarDays size={23} strokeWidth={1.8} />
          <Bell size={23} strokeWidth={1.8} />
          <Menu size={25} strokeWidth={1.8} />
        </div>
      </div>

      <Link
        href="/search"
        className="mx-4 flex h-[36px] items-center gap-2 rounded-[10px] bg-fill px-3 text-[15px] text-ink-3"
      >
        <Search size={17} /> Search a restaurant, member, etc.
      </Link>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        <TealChip>
          <Navigation size={14} /> Recs Nearby
        </TealChip>
        <TealChip>
          <TrendingUp size={14} /> Trending
        </TealChip>
        <TealChip href="/blend">
          <Users size={14} /> Friend recs
        </TealChip>
      </div>

      {/* invites card */}
      <div className="mx-4 mt-3 rounded-xl border border-line p-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="text-[16px] font-bold text-teal">You have 3 invites left!</div>
        <div className="text-[13px] text-ink-3">Unlock features as friends join (4/5)</div>
        <div className="mt-3 flex justify-between">
          {unlocks.map((u) => (
            <div key={u} className="flex w-[64px] flex-col items-center gap-1.5 text-center">
              <span className="flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-line">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-good text-white">
                  <Check size={15} strokeWidth={3} />
                </span>
              </span>
              <span className="text-[12px] leading-tight text-teal">{u}</span>
            </div>
          ))}
        </div>
        <PrimaryButton className="mt-3">Invite friends</PrimaryButton>
      </div>

      {/* proposal entry point, styled like Beli's recap banner */}
      <Link
        href="/blend"
        className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-teal bg-teal-tint p-3 text-teal"
      >
        <AvatarStack srcs={[me.avatar, friends[0].avatar]} size={30} />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-[17px] font-bold leading-tight">Pairing</div>
          <div className="mt-0.5 text-[12px] leading-snug text-teal/80">Find places you and a friend both love</div>
        </div>
        <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          New
        </span>
      </Link>

      <div className="px-4 pb-1 pt-5 text-[12px] font-bold uppercase tracking-[0.08em]">
        Your feed
      </div>

      {!loaded ? (
        <FeedSkeleton />
      ) : (
        <div className="animate-fade-in">
      {feed.map((item) => {
        const f = friendById(item.friendId);
        const r = restaurantById(item.restaurantId);
        return (
          <article key={item.id} className="border-b border-line px-4 py-4">
            <div className="flex gap-3">
              <Link href={`/user/${f.id}`} aria-label={`${f.name}'s profile`} className="shrink-0">
                <Avatar src={f.avatar} size={56} />
              </Link>
              <Link href={`/restaurant/${r.id}`} className="min-w-0 flex-1 text-[15px] leading-snug">
                <div>
                  <b>{f.name}</b> {item.verb} <b>{r.name}</b>
                  {item.withNames && (
                    <>
                      {" "}
                      with <b>{item.withNames}</b>
                    </>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink-3">
                  <Utensils size={12} /> · {r.hood}, {r.city.split(",")[0]}
                </div>
                {item.visits && (
                  <div className="flex items-center gap-1 text-[12.5px] text-ink-3">
                    <RefreshCw size={11} /> {item.visits} {item.visits === 1 ? "visit" : "visits"}
                  </div>
                )}
              </Link>
              {item.score && <ScoreBadge score={item.score} />}
            </div>

            {item.photos && (
              <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4">
                {item.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={p} alt="" className="h-[118px] w-[118px] shrink-0 rounded-lg object-cover" />
                ))}
              </div>
            )}
            {item.notes && (
              <p className="mt-3 text-[14.5px] leading-snug">
                <b>Notes:</b> {item.notes}… <span className="text-ink-3">See more</span>
              </p>
            )}
            {item.photos && (
              <div className="mt-2.5 flex justify-between text-[12px] text-ink-2">
                <span>
                  {item.likes} likes&nbsp;&nbsp;&nbsp;View {item.comments} comments
                </span>
                <span>{item.bookmarks} bookmarks</span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-4">
                <Heart size={23} strokeWidth={1.7} />
                <MessageCircle size={23} strokeWidth={1.7} />
                <Send size={22} strokeWidth={1.7} />
              </div>
              <div className="flex gap-4">
                <CirclePlus size={23} strokeWidth={1.7} />
                <Bookmark size={23} strokeWidth={1.7} />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-ink-3">{item.when}</div>
          </article>
        );
      })}
        </div>
      )}
    </div>
  );
}
