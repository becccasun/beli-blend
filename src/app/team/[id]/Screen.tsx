"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bell, Check, Clock, MapPin, PartyPopper, Sparkles, Utensils } from "lucide-react";
import { fmtScore, friendById, friendRatings, me, restaurantById } from "@/lib/data";
import { useStore } from "@/lib/store";
import {
  challengeById,
  friendScore,
  memberName,
  spotStatuses,
  teamMembers,
  useTeams,
  type Team,
} from "@/lib/team";
import { Avatar, AvatarStack, PrimaryButton, ProgressBar, ScoreBadge, SectionLabel } from "@/components/ui";
import { ChallengeHero, Medallion } from "@/components/team/parts";
import { JoinSheet } from "@/components/team/JoinSheet";
import { PointsCard } from "@/components/team/PointsCard";
import { challengePoints } from "@/lib/team";

const listNames = (ids: string[]) => {
  const n = ids.map(memberName);
  return n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
};

export default function TeamChallengePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getEntry, showToast } = useStore();
  const { teams, ready, update, join, leave } = useTeams();
  const [joining, setJoining] = useState(false);

  const ch = challengeById(id);
  if (!ch) {
    return (
      <div className="p-6 text-center text-[14px] text-ink-3">
        Challenge not found. <Link href="/team" className="text-teal underline">Back to challenges</Link>
      </div>
    );
  }
  const team: Team | undefined = teams[ch.id];
  const total = ch.restaurantIds.length;

  // ---------- not joined yet: preview ----------
  if (!team) {
    return (
      <div className="pb-10">
        <ChallengeHero title={ch.title} medal={ch.medal} />
        <div className="px-4 pt-14 text-center">
          <p className="text-[14px] text-ink-2">{ch.blurb}</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-ink-3">
            <AvatarStack srcs={ch.joinedFriendIds.map((f) => friendById(f).avatar)} size={22} />
            {listNames(ch.joinedFriendIds)} joined
          </div>
          <PrimaryButton className="mt-4" onClick={() => setJoining(true)} disabled={!ready}>
            Join challenge
          </PrimaryButton>
        </div>
        <SectionLabel>
          {total} restaurants · {ch.daysLeft} days left
        </SectionLabel>
        <div className="divide-y divide-line">
          {ch.restaurantIds.map((rid) => {
            const r = restaurantById(rid);
            return (
              <Link key={rid} href={`/restaurant/${rid}`} className="flex items-center gap-3 px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.photo} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">{r.name}</div>
                  <div className="truncate text-[12px] text-ink-3">
                    {r.price} · {r.cuisines.join(", ")} · {r.hood}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {joining && (
          <JoinSheet
            challenge={ch}
            onClose={() => setJoining(false)}
            onJoin={(t) => {
              join(t);
              setJoining(false);
              window.document.getElementById("phone-scroll")?.scrollTo({ top: 0 });
            }}
          />
        )}
      </div>
    );
  }

  // ---------- joined ----------
  const members = teamMembers(team);
  const spots = spotStatuses(team, ch, getEntry);
  const done = spots.filter((s) => s.counted).length;
  const fully = spots.filter((s) => s.fullyRated).length;
  const finished = done === total;
  const remaining = total - done;
  const isTeam = team.mode === "team";
  const pending = team.status === "pending";

  const contributions = members.map((m) => ({
    id: m,
    count: spots.filter((s) => s.scores.some((x) => x.memberId === m)).length,
  }));
  const maxCount = Math.max(...contributions.map((c) => c.count));

  const rankIt = (rid: string) => {
    const e = getEntry(rid);
    if (!e) {
      router.push(`/restaurant/${rid}`);
      return;
    }
    update(ch.id, (t) => ({
      ...t,
      myRated: [...t.myRated, rid],
      order: [`me:${rid}`, ...t.order.filter((k) => k !== `me:${rid}`)],
    }));
    showToast(`Added your ${fmtScore(e.score)} for ${restaurantById(rid).name} to the team`);
  };

  const nudge = (fid: string) => {
    update(ch.id, (t) => ({ ...t, nudged: [...t.nudged, fid] }));
    showToast(`Nudged ${memberName(fid)}. We'll send a friendly reminder.`);
  };

  const acceptAll = () => {
    update(ch.id, (t) => {
      // each friend arrives with one spot they've already been to
      const friendRated: Record<string, string[]> = {};
      const order: string[] = [...t.order];
      t.memberIds.forEach((fid, i) => {
        const rid = ch.restaurantIds.find((r) => friendRatings[fid]?.[r] !== undefined) ?? ch.restaurantIds[i % total];
        friendRated[fid] = [rid];
        order.unshift(`${fid}:${rid}`);
      });
      return { ...t, status: "active", friendRated, order };
    });
    showToast("Everyone's in. Let's eat!");
  };

  const fastForward = () => {
    // prefer spots nobody has hit yet, and the teammate who is furthest behind
    const order = [...spots].sort((a, b) => Number(a.counted) - Number(b.counted)).map((s) => s.restaurantId);
    const byBehind = [...team.memberIds].sort(
      (a, b) => (team.friendRated[a]?.length ?? 0) - (team.friendRated[b]?.length ?? 0)
    );
    for (const fid of byBehind) {
      const rid = order.find((r) => !team.friendRated[fid]?.includes(r));
      if (rid) {
        update(ch.id, (t) => ({
          ...t,
          friendRated: { ...t.friendRated, [fid]: [...(t.friendRated[fid] ?? []), rid] },
          nudged: t.nudged.filter((x) => x !== fid),
          order: [`${fid}:${rid}`, ...t.order],
        }));
        showToast(`${memberName(fid)} just ranked ${restaurantById(rid).name} ${fmtScore(friendScore(fid, rid))}`);
        return;
      }
    }
    showToast("Your teammates have been everywhere already!");
  };

  // activity feed: logged events first, then anything you ranked through the normal flow
  const scoreOf = (m: string, rid: string) =>
    spots.find((s) => s.restaurantId === rid)?.scores.find((x) => x.memberId === m)?.score;
  const keys = [
    ...spots
      .filter((s) => s.scores.some((x) => x.memberId === "me") && !team.order.includes(`me:${s.restaurantId}`))
      .map((s) => `me:${s.restaurantId}`),
    ...team.order,
  ];
  const activity = keys
    .map((k) => {
      const [m, rid] = k.split(":");
      const score = scoreOf(m, rid);
      return score === undefined ? null : { m, rid, score };
    })
    .filter((x): x is { m: string; rid: string; score: number } => x !== null)
    .slice(0, 6);

  const lastFriend = activity.find((a) => a.m !== "me");
  const top = [...spots]
    .filter((s) => s.counted)
    .sort((a, b) => (b.teamScore ?? b.scores[0].score) - (a.teamScore ?? a.scores[0].score))[0];

  const pushCopy = finished
    ? `${team.name} finished ${ch.title}! Your shared badge is waiting.`
    : remaining === 1
      ? `Your team is 1 spot from finishing ${ch.title}`
      : lastFriend
        ? `${memberName(lastFriend.m)} just ranked ${restaurantById(lastFriend.rid).name}. ${remaining} spots left in ${ch.title}`
        : `${remaining} spots left in ${ch.title}. Who's hungry?`;

  return (
    <div className="pb-10">
      <ChallengeHero title={ch.title} medal={ch.medal} done={finished}>
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <AvatarStack srcs={members.map((m) => friendById(m).avatar)} size={34} />
          <span className="text-[13px] text-white/80">
            {isTeam ? `${team.name} · ${members.length} diners` : "Going solo"}
          </span>
        </div>
      </ChallengeHero>

      <div className="px-4 pt-14">
        {pending && (
          <div className="animate-fade-in mb-3 rounded-2xl border border-dashed border-teal-soft bg-teal-tint p-4">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-teal">
              <Clock size={16} /> Invites sent
            </div>
            <div className="mt-2 space-y-2">
              {team.memberIds.map((fid) => (
                <div key={fid} className="flex items-center gap-2 text-[14px]">
                  <Avatar src={friendById(fid).avatar} size={28} />
                  <span className="flex-1">{memberName(fid)}</span>
                  <span className="text-[12px] text-ink-3">Waiting...</span>
                </div>
              ))}
            </div>
            <button
              onClick={acceptAll}
              className="mt-3 h-9 w-full rounded-full border border-teal text-[13px] font-semibold text-teal"
            >
              Demo: everyone accepted
            </button>
          </div>
        )}

        {finished ? (
          <div className="animate-fade-in rounded-2xl border border-[#ecd9a4] bg-[#fffaf0] p-4 text-center">
            <PartyPopper className="mx-auto text-[#b8902f]" size={26} />
            <div className="mt-1 font-serif text-[20px] font-bold">You crushed it!</div>
            <p className="mt-1 text-[13px] text-ink-2">
              {isTeam ? `${team.name} ate through all ${total} spots.` : `All ${total} spots, done.`}
            </p>
            {top && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-3 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={restaurantById(top.restaurantId).photo} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3">Team favorite</div>
                  <div className="truncate text-[15px] font-semibold">{restaurantById(top.restaurantId).name}</div>
                </div>
                <ScoreBadge score={top.teamScore ?? top.scores[0].score} />
              </div>
            )}
            <div className="mt-3 flex items-center justify-center gap-2 text-[13px] font-semibold text-[#9a7420]">
              <Medallion label={ch.medal} size={36} done /> Shared badge added to everyone&apos;s profile
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line p-4">
            <div className="text-[16px] font-semibold">
              {done} of {total} spots
            </div>
            <ProgressBar value={done / total} className="mt-2.5" />
            <div className="mt-2.5 flex justify-between text-[14px]">
              <span>{ch.daysLeft} days left</span>
              {isTeam && (
                <span className="text-ink-3">
                  {fully} fully rated
                </span>
              )}
            </div>
            {isTeam && (
              <p className="mt-2 text-[12px] text-ink-3">
                A spot counts once anyone on the team ranks it. It&apos;s fully rated when everyone has.
              </p>
            )}
          </div>
        )}

        {!pending && <PointsCard {...challengePoints(team, ch, getEntry)} />}
      </div>

      <SectionLabel>The list</SectionLabel>
      <div className="divide-y divide-line">
        {spots.map((s) => {
          const r = restaurantById(s.restaurantId);
          const iRated = s.scores.some((x) => x.memberId === "me");
          return (
            <div key={s.restaurantId} className="flex gap-3 px-4 py-3">
              <Link href={`/restaurant/${r.id}`} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.photo} alt="" className={`h-12 w-12 rounded-lg object-cover ${s.counted ? "" : "opacity-60 grayscale"}`} />
                {s.counted && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-teal text-white">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/restaurant/${r.id}`} className="block truncate text-[15px] font-semibold">
                  {r.name}
                </Link>
                <div className="flex items-center gap-1 truncate text-[12px] text-ink-3">
                  <Utensils size={11} /> {r.cuisines[0]} · {r.hood}
                </div>

                {s.counted ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    {s.scores.map((x) => (
                      <span key={x.memberId} className="flex items-center gap-1 text-[12px] text-ink-2">
                        <Avatar src={friendById(x.memberId).avatar} size={18} />
                        <span className="font-semibold tabular-nums">{fmtScore(x.score)}</span>
                      </span>
                    ))}
                    {s.fullyRated && isTeam && (
                      <span className="rounded-full bg-teal-tint px-2 py-0.5 text-[11px] font-semibold text-teal">
                        Fully rated
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-ink-3">
                    <MapPin size={12} /> Plan a visit
                  </div>
                )}

                {!iRated && !pending && (
                  <button
                    onClick={() => rankIt(s.restaurantId)}
                    className="mt-2 h-7 rounded-full border border-ink px-3 text-[12px] font-semibold"
                  >
                    {getEntry(s.restaurantId) ? "Rank it" : "Been here? Rank it"}
                  </button>
                )}
              </div>
              {s.teamScore !== null ? (
                <div className="flex flex-col items-center gap-0.5">
                  <ScoreBadge score={s.teamScore} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-3">Team</span>
                </div>
              ) : s.counted ? (
                <div className="flex flex-col items-center gap-0.5">
                  <ScoreBadge score={s.scores[0].score} size={34} className="opacity-70" />
                  {isTeam && <span className="text-[10px] text-ink-3">1 rating</span>}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {isTeam && !pending && (
        <>
          <SectionLabel>Team activity</SectionLabel>

          {/* push preview */}
          <div className="mx-4 rounded-2xl bg-fill p-3">
            <div className="flex items-center gap-2 text-[11px] text-ink-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal font-serif text-[10px] font-bold text-white">
                b
              </span>
              BELI · now
              <Bell size={12} className="ml-auto" />
            </div>
            <div className="mt-1 text-[14px] font-semibold">{team.name}</div>
            <div className="text-[13px] text-ink-2">{pushCopy}</div>
          </div>
          <p className="mx-4 mt-1 text-[11px] text-ink-3">Preview of the push your team gets</p>

          {/* nudges */}
          <div className="mt-2 divide-y divide-line">
            {activity.map((a) => {
              const r = restaurantById(a.rid);
              const iHave = spots.find((s) => s.restaurantId === a.rid)?.scores.some((x) => x.memberId === "me");
              return (
                <div key={`${a.m}:${a.rid}`} className="flex items-center gap-3 px-4 py-3">
                  <Avatar src={friendById(a.m).avatar} size={44} />
                  <div className="min-w-0 flex-1 text-[14px] leading-snug">
                    <span className="font-semibold">{memberName(a.m)}</span> ranked{" "}
                    <span className="font-semibold">{r.name}</span>.
                    {a.m !== "me" && !iHave && <span className="text-teal"> You&apos;re up next!</span>}
                    {a.m === "me" && <span className="text-ink-3"> Team progress +1</span>}
                  </div>
                  <ScoreBadge score={a.score} size={36} />
                </div>
              );
            })}
          </div>

          <SectionLabel>Who&apos;s covered what</SectionLabel>
          <div className="mx-4 space-y-3 rounded-2xl border border-line p-4">
            {contributions.map((c) => {
              const behind = c.id !== "me" && c.count < maxCount && !finished;
              const nudged = team.nudged.includes(c.id);
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar src={c.id === "me" ? me.avatar : friendById(c.id).avatar} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-[13px]">
                      <span className="font-semibold">{memberName(c.id)}</span>
                      <span className="text-ink-3 tabular-nums">
                        {c.count} of {total}
                      </span>
                    </div>
                    <ProgressBar value={c.count / total} className="mt-1" />
                  </div>
                  {behind && (
                    <button
                      onClick={() => !nudged && nudge(c.id)}
                      disabled={nudged}
                      className={`h-7 w-[72px] shrink-0 rounded-full text-[12px] font-semibold ${
                        nudged ? "bg-fill text-ink-3" : "bg-follow text-white"
                      }`}
                    >
                      {nudged ? "Nudged" : "Nudge"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mx-4 mt-4 flex flex-col gap-1 text-center">
            <button onClick={fastForward} className="flex items-center justify-center gap-1 py-2 text-[12px] font-medium text-ink-3">
              <Sparkles size={12} /> Demo: a teammate ranks a spot
            </button>
          </div>
        </>
      )}

      <div className="mt-2 text-center">
        <button
          onClick={() => {
            leave(ch.id);
            router.push("/team");
          }}
          className="py-2 text-[12px] text-ink-3 underline"
        >
          Leave challenge
        </button>
      </div>
    </div>
  );
}
