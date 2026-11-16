"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, ChevronRight, Clock, Flame, Lock, Share, Shuffle, Trophy } from "lucide-react";
import { cityName, friendById, friendRatings, friends, me, restaurantById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { teaser } from "@/lib/blend";
import { Avatar, AvatarStack, BackHeader, ScoreBadge, SectionLabel } from "@/components/ui";
import { BlendingMoment, useRatings } from "@/components/blend/parts";
import { RequestSheet } from "@/components/blend/RequestSheet";
import { MatchMeters } from "@/components/blend/taste";
import { useBlends } from "@/components/blend/storage";
import { ProfileSkeleton, markLoaded, useLoaded } from "@/components/skeleton";

export default function UserProfile() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const person = friends.find((p) => p.id === id) ?? friendById("maya");
  const { showToast } = useStore();
  const { blends, incoming, request, remove, accept, decline, setFollow, isFollowing, isMutual } = useBlends();
  const ratings = useRatings();
  const following = isFollowing(person);
  const mutual = isMutual(person);
  const [asking, setAsking] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const theirs = friendRatings[person.id] ?? {};
  const t = teaser(ratings.me, theirs);
  const saved = blends.find((b) => b.id === person.id);
  const invite = incoming.find((r) => r.from === person.id);
  const status = saved?.status ?? (invite ? "incoming" : "none");

  const top = Object.entries(theirs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([rid, score]) => ({ r: restaurantById(rid), score }));

  const blendButton = {
    none: { label: "Blend", icon: Shuffle, cls: "bg-teal text-white border-teal", onClick: () => setAsking(true) },
    pending: {
      label: "Requested",
      icon: Clock,
      cls: "border-teal text-teal bg-teal-tint",
      onClick: () => {
        remove(person.id);
        showToast("Blend request cancelled.");
      },
    },
    incoming: {
      label: "Accept blend",
      icon: Check,
      cls: "bg-teal text-white border-teal",
      onClick: () => {
        accept(person.id);
        setCelebrating(true);
      },
    },
    active: {
      label: "View blend",
      icon: Shuffle,
      cls: "border-teal text-teal bg-white",
      onClick: () => router.push(`/blend/${person.id}`),
    },
  }[status];
  const BlendIcon = blendButton.icon;
  const loaded = useLoaded(`user:${person.id}`);
  if (!loaded) return <ProfileSkeleton />;

  return (
    <div className="pb-10">
      <BackHeader title={person.name} right={<Share size={20} strokeWidth={1.8} />} />

      <div className="flex flex-col items-center pt-2">
        <Avatar src={person.avatar} size={88} />
        <div className="mt-2 text-[16px] font-bold">{person.handle}</div>
        <div className="text-[13px] text-ink-3">{person.followsYou ? "Follows you" : "Doesn't follow you yet"}</div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setFollow(person.id, !following)}
            aria-pressed={following}
            className={`h-[36px] rounded-lg border px-5 text-[14px] font-semibold ${
              following ? "border-[#cfcfcf] text-ink" : "border-ink bg-ink text-white"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
          {/* Blending shares your taste, so it is only offered between people who follow each other. */}
          {(mutual || status !== "none") && (
            <button
              onClick={blendButton.onClick}
              className={`inline-flex h-[36px] items-center gap-1.5 rounded-lg border px-5 text-[14px] font-semibold ${blendButton.cls}`}
            >
              <BlendIcon size={15} strokeWidth={2.4} />
              {blendButton.label}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 text-center">
        {[
          [String(person.been), "Been"],
          [String(Math.round(person.been * 0.6) + 12), "Followers"],
          [`#${Math.max(40, 2400 - person.been * 7)}`, "Rank on Beli"],
        ].map(([n, l]) => (
          <div key={l}>
            <div className="text-[16px] font-bold">{n}</div>
            <div className="text-[12.5px] text-ink-3">{l}</div>
          </div>
        ))}
      </div>

      {mutual || status !== "none" ? (
      <div className="mx-4 mt-5 rounded-[16px] border border-teal bg-teal-tint p-4">
        <div className="flex items-center gap-3">
          <AvatarStack srcs={[me.avatar, person.avatar]} size={40} />
          <div className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
            Your taste with {person.name}
          </div>
          <div className="font-serif text-[34px] font-bold leading-none text-teal">{t.match}%</div>
        </div>
        <MatchMeters parts={t.parts} overlap={t.overlap} className="mt-3" />

        {status === "incoming" && (
          <div className="mt-3 rounded-[12px] bg-white p-3">
            <div className="text-[14px] font-bold text-ink">{person.name} wants to blend with you</div>
            {invite?.note && <p className="mt-0.5 text-[13px] italic text-ink-2">&ldquo;{invite.note}&rdquo;</p>}
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => {
                  accept(person.id);
                  setCelebrating(true);
                }}
                className="h-[36px] flex-1 rounded-full bg-teal text-[14px] font-semibold text-white"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  decline(person.id);
                  showToast("Request declined.");
                }}
                className="h-[36px] flex-1 rounded-full border border-[#cfcfcf] text-[14px] font-semibold text-ink"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {status === "active" && (
          <Link
            href={`/blend/${person.id}`}
            className="mt-3 flex items-center justify-between rounded-[12px] bg-white px-3 py-2.5 text-[14px] font-semibold text-ink"
          >
            <span>{saved?.city ? `Your blend for ${cityName(saved.city)}` : "Choose a city for your blend"}</span>
            <ChevronRight size={18} className="text-ink-3" />
          </Link>
        )}
        {status === "pending" && (
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-2">
            <Clock size={14} className="shrink-0" /> Request sent
          </p>
        )}
      </div>
      ) : (
        <div className="mx-4 mt-5 flex items-center gap-2 rounded-[16px] border border-line p-4 text-[14px] text-ink-2">
          <Lock size={16} className="shrink-0" />
          Blends are for friends who follow each other.
        </div>
      )}

      <div className="mx-4 mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Trophy size={15} /> Top cuisine
          </div>
          <div className="mt-0.5 truncate text-[16px] font-bold">{top[0]?.r.cuisines[0] ?? "Still exploring"}</div>
        </div>
        <div className="rounded-xl border border-line p-3">
          <div className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Flame size={15} /> Current Streak
          </div>
          <div className="mt-0.5 text-[16px] font-bold">{person.streak} {person.streak === 1 ? "week" : "weeks"}</div>
        </div>
      </div>

      <SectionLabel>{person.name}&apos;s top places</SectionLabel>
      <div className="border-t border-line">
        {top.map(({ r, score }, i) => (
          <Link
            key={r.id}
            href={`/restaurant/${r.id}`}
            className="flex items-center gap-3 border-b border-line px-4 py-3 active:bg-fill"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[16px] font-bold text-ink">
                {i + 1}. {r.name}
              </div>
              <div className="truncate text-[13px] text-ink-2">
                {r.price} | {r.cuisines.join(", ")} · {cityName(r.city)}
              </div>
            </div>
            <ScoreBadge score={score} size={40} />
          </Link>
        ))}
      </div>

      {asking && (
        <RequestSheet
          friends={[person]}
          onClose={() => setAsking(false)}
          onSend={(note) => {
            request([person.id], note);
            setAsking(false);
            showToast(`Blend request sent to ${person.name}.`);
          }}
        />
      )}
      {celebrating && (
        <BlendingMoment
          friends={[person]}
          onDone={() => {
            markLoaded(`blend:${person.id}`);
            router.push(`/blend/${person.id}`);
          }}
        />
      )}
    </div>
  );
}
