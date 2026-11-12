"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { friendById, me } from "@/lib/data";
import { useStore } from "@/lib/store";
import { challengePoints, challenges, maxPoints, spotStatuses, useTeams, type Challenge } from "@/lib/team";
import { AvatarStack, BackHeader, ProgressBar, SectionLabel } from "@/components/ui";
import { Medallion } from "@/components/team/parts";
import { JoinSheet } from "@/components/team/JoinSheet";

export default function TeamHub() {
  const router = useRouter();
  const { getEntry } = useStore();
  const { teams, join } = useTeams();
  const [joining, setJoining] = useState<Challenge | null>(null);

  const mine = challenges.filter((c) => teams[c.id]);
  const open = challenges.filter((c) => !teams[c.id]);

  return (
    <div className="pb-8">
      <BackHeader title="Challenges" />

      <SectionLabel>Your challenges</SectionLabel>
      {mine.length === 0 ? (
        <p className="px-4 text-[14px] text-ink-3">No challenges yet. Pick one below!</p>
      ) : (
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {mine.map((c) => {
            const t = teams[c.id];
            const spots = spotStatuses(t, c, getEntry);
            const done = spots.filter((s) => s.counted).length;
            const finished = done === c.restaurantIds.length;
            const pts = challengePoints(t, c, getEntry);
            return (
              <Link
                key={c.id}
                href={`/team/${c.id}`}
                className={`block shrink-0 snap-start overflow-hidden rounded-2xl border border-line ${
                  mine.length === 1 ? "w-full" : "w-[300px]"
                }`}
              >
                <div className="bg-gradient-to-br from-teal to-teal-dark p-4 text-white">
                  <div className="flex items-start justify-between">
                    <Medallion label={c.medal} size={52} done={finished} />
                    <AvatarStack
                      srcs={[me.avatar, ...t.memberIds.map((id) => friendById(id).avatar)]}
                      size={28}
                    />
                  </div>
                  <div className="mt-3 truncate font-serif text-[21px] font-bold leading-tight">
                    {c.title}
                  </div>
                  <div className="truncate text-[13px] text-white/75">
                    {t.mode === "solo" ? "Solo" : t.name}
                    {t.status === "pending" && " · invites pending"}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between text-[14px]">
                    <span className="font-semibold">
                      {done} of {c.restaurantIds.length} spots
                    </span>
                    <span className="text-ink-3">
                      {finished ? "Finished!" : `${c.daysLeft} days left`}
                    </span>
                  </div>
                  <ProgressBar value={done / c.restaurantIds.length} className="mt-2" />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-2">
                      <Trophy size={13} className="text-teal" />
                      <b className="text-teal">+{pts.earned}</b> of {pts.possible} leaderboard pts
                    </span>
                    <span className="rounded-full bg-teal px-3.5 py-1.5 text-[13px] font-semibold text-white">
                      {finished ? "View" : "Continue"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <SectionLabel>Recommended for you</SectionLabel>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {open.map((c) => (
          <div
            key={c.id}
            className="flex w-[172px] shrink-0 snap-start flex-col rounded-2xl border border-line p-3"
          >
            <button onClick={() => router.push(`/team/${c.id}`)} className="flex-1 text-left">
              <Medallion label={c.medal} size={46} />
              <div className="mt-2 font-serif text-[16px] font-bold leading-tight">{c.title}</div>
              <div className="mt-0.5 text-[12px] text-ink-2">
                {c.restaurantIds.length} spots · {c.daysLeft} days left
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <AvatarStack
                  srcs={c.joinedFriendIds.slice(0, 3).map((id) => friendById(id).avatar)}
                  size={18}
                />
                <span className="truncate text-[12px] text-ink-3">
                  {friendById(c.joinedFriendIds[0]).name}
                  {c.joinedFriendIds.length > 1 && ` + ${c.joinedFriendIds.length - 1}`} joined
                </span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-ink-2">
                <Trophy size={12} className="text-teal" /> Up to +{maxPoints(c, "team")} pts
              </div>
            </button>
            <button
              onClick={() => setJoining(c)}
              className="mt-3 h-8 rounded-full border border-teal text-[13px] font-semibold text-teal"
            >
              Join
            </button>
          </div>
        ))}
      </div>

      {joining && (
        <JoinSheet
          challenge={joining}
          onClose={() => setJoining(null)}
          onJoin={(t) => {
            join(t);
            setJoining(null);
            router.push(`/team/${t.challengeId}`);
          }}
        />
      )}
    </div>
  );
}
