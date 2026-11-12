"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { friendById, friendRatings, friends, me, type Friend } from "@/lib/data";
import { useStore } from "@/lib/store";
import { blendIdFor, groupMatch, parseBlendId, type RatingMap } from "@/lib/blend";
import { Avatar, AvatarStack, BackHeader, PrimaryButton, SectionLabel } from "@/components/ui";
import { useBlends } from "@/components/blend/storage";
import { BlendingMoment, groupTitle } from "@/components/blend/parts";

const friendIds = friends.map((f) => f.id);

export default function BlendLanding() {
  const router = useRouter();
  const { ranked } = useStore();
  const { blends, save } = useBlends();
  const [picked, setPicked] = useState<string[]>([]);
  const [blending, setBlending] = useState<Friend[] | null>(null);

  const ratings: RatingMap = useMemo(() => {
    const mine: Record<string, number> = {};
    for (const e of ranked) mine[e.restaurantId] = e.score;
    return { ...friendRatings, me: mine };
  }, [ranked]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 2 ? [p[1], id] : [...p, id]));

  const start = () => {
    if (!picked.length) return;
    setBlending(picked.map((id) => friendById(id)));
  };

  const finish = useCallback(() => {
    if (!blending) return;
    const id = blendIdFor(blending.map((f) => f.id));
    save(id);
    router.push(`/blend/${id}`);
  }, [blending, router, save]);

  const existing = blends
    .map((b) => ({ ...b, friends: parseBlendId(b.id, friendIds).map((id) => friendById(id)) }))
    .filter((b) => b.friends.length);

  return (
    <div className="pb-10">
      <BackHeader title="Blend" />

      <div className="px-4 pt-2">
        <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">Blend</h1>
        <p className="mt-1 text-[15px] leading-snug text-ink-2">
          Mix your rankings with a friend or two. Get one list of where to eat together.
        </p>
      </div>

      <SectionLabel>Your blends</SectionLabel>
      <div className="border-t border-line">
        {existing.map((b) => {
          const people = [{ id: "me", name: "You" }, ...b.friends.map((f) => ({ id: f.id, name: f.name }))];
          const { match } = groupMatch(people, ratings);
          return (
            <Link
              key={b.id}
              href={`/blend/${b.id}`}
              className="flex items-center gap-3 border-b border-line px-4 py-3 active:bg-fill"
            >
              <AvatarStack srcs={[me.avatar, ...b.friends.map((f) => f.avatar)]} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-bold text-ink">{groupTitle(b.friends)}</div>
                <div className="text-[13px] text-ink-2">{match}% taste match</div>
              </div>
              <ChevronRight size={20} className="text-ink-3" />
            </Link>
          );
        })}
      </div>

      <SectionLabel>Start a new blend</SectionLabel>
      <p className="px-4 pb-2 text-[13px] text-ink-2">Pick one or two friends.</p>
      <div className="border-t border-line">
        {friends.map((f) => {
          const on = picked.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggle(f.id)}
              aria-pressed={on}
              className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left active:bg-fill"
            >
              <Avatar src={f.avatar} size={44} />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-ink">{f.name}</div>
                <div className="text-[13px] text-ink-2">
                  {f.handle} · {f.been} been
                </div>
              </div>
              <span
                className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border ${
                  on ? "border-teal bg-teal text-white" : "border-[#cfcfcf] text-transparent"
                }`}
              >
                <Check size={16} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-5">
        <PrimaryButton onClick={start} disabled={!picked.length}>
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} />
            {picked.length
              ? `Blend with ${picked.map((id) => friendById(id).name).join(" + ")}`
              : "Pick a friend to blend"}
          </span>
        </PrimaryButton>
      </div>

      {blending && <BlendingMoment friends={blending} onDone={finish} />}
    </div>
  );
}
