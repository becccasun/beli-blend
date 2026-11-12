"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Share } from "lucide-react";
import { fmtScore, friendById, friendRatings, friends, me } from "@/lib/data";
import { useStore } from "@/lib/store";
import { computeBlend, disagreeQuip, matchCopy, parseBlendId, type Person, type RatingMap } from "@/lib/blend";
import { AvatarStack, BackHeader, OutlineChip, PrimaryButton, SectionLabel } from "@/components/ui";
import { BlendListRow, BlendShareCard, PersonScores, groupTitle, personAvatar } from "@/components/blend/parts";

type Filter = "all" | "shared" | "new";
const friendIds = friends.map((f) => f.id);

export default function BlendResultPage() {
  const params = useParams<{ id: string }>();
  const ids = parseBlendId(String(params?.id ?? ""), friendIds);
  const groupFriends = (ids.length ? ids : ["maya"]).map((id) => friendById(id));
  const { ranked, showToast } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [sharing, setSharing] = useState(false);

  const people: Person[] = useMemo(
    () => [{ id: "me", name: "You" }, ...groupFriends.map((f) => ({ id: f.id, name: f.name }))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupFriends.map((f) => f.id).join("-")]
  );

  const result = useMemo(() => {
    const mine: Record<string, number> = {};
    for (const e of ranked) mine[e.restaurantId] = e.score;
    const ratings: RatingMap = { me: mine };
    for (const f of people) if (f.id !== "me") ratings[f.id] = friendRatings[f.id] ?? {};
    return computeBlend(people, ratings);
  }, [ranked, people]);

  const group = people.length > 2;
  const both = group ? "all" : "both";
  const them = group ? "them" : groupFriends[0].name;
  const title = groupTitle(groupFriends);
  const maxCuisine = Math.max(10, ...result.cuisines.map((c) => c.avg));
  const nameOf = (id: string) => (id === "me" ? "You" : friendById(id).name);

  return (
    <div className="pb-10">
      <BackHeader
        title="Blend"
        right={
          <button aria-label="Share blend" onClick={() => setSharing(true)} className="p-1">
            <Share size={21} />
          </button>
        }
      />

      {/* Header */}
      <div className="flex flex-col items-center px-4 pb-4 pt-3 text-center">
        <AvatarStack srcs={[me.avatar, ...groupFriends.map((f) => f.avatar)]} size={64} />
        <div className="mt-3 text-[14px] font-semibold text-ink-2">{title}</div>
        <div className="mt-1 font-serif text-[52px] font-bold leading-none text-teal">{result.match}%</div>
        <div className="mt-1 text-[12px] font-bold uppercase tracking-[0.1em] text-ink">Taste match</div>
        <p className="mt-2 max-w-[290px] text-[14px] leading-snug text-ink-2">{matchCopy(result.match, group)}</p>
        <p className="mt-1 text-[12px] text-ink-3">
          Based on {result.overlapCount} {result.overlapCount === 1 ? "place" : "places"} you {both} ranked
          {result.overlapCount < 3 ? ", plus cuisine taste" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-11 z-10 flex gap-2 border-b border-line bg-white px-4 py-2">
        <OutlineChip active={filter === "all"} onClick={() => setFilter("all")}>All</OutlineChip>
        <OutlineChip active={filter === "shared"} onClick={() => setFilter("shared")}>Shared favourites</OutlineChip>
        <OutlineChip active={filter === "new"} onClick={() => setFilter("new")}>New for {both}</OutlineChip>
      </div>

      {filter !== "new" && (
        <section>
          <SectionLabel>You {both} love</SectionLabel>
          {result.shared.length ? (
            <div className="border-t border-line">
              {result.shared.map((row, i) => (
                <BlendListRow key={row.restaurant.id} row={row} index={i + 1} people={people} />
              ))}
            </div>
          ) : (
            <p className="px-4 text-[14px] text-ink-2">No shared faves yet. Time to go make some.</p>
          )}
        </section>
      )}

      {filter !== "shared" && (
        <section>
          <SectionLabel>Try together</SectionLabel>
          <p className="-mt-1 px-4 pb-2 text-[13px] text-ink-2">Nobody here has been. Ranked by a blended prediction.</p>
          <div className="border-t border-line">
            {result.tryTogether.map((row, i) => (
              <BlendListRow
                key={row.restaurant.id}
                row={row}
                index={i + 1}
                people={people}
                sub={row.reason}
                showScores={false}
                predicted
              />
            ))}
          </div>
        </section>
      )}

      {filter !== "new" && result.disagree.length > 0 && (
        <section>
          <SectionLabel>You disagree on</SectionLabel>
          <div className="mx-4 flex flex-col gap-2">
            {result.disagree.map((row) => (
              <Link
                key={row.restaurant.id}
                href={`/restaurant/${row.restaurant.id}`}
                className="rounded-[14px] border border-line px-3.5 py-3 active:bg-fill"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[15px] font-bold text-ink">{row.restaurant.name}</div>
                  <span className="shrink-0 rounded-full bg-teal-tint px-2 py-0.5 text-[12px] font-bold text-teal">
                    {fmtScore(row.gap ?? 0)} pt gap
                  </span>
                </div>
                <div className="mt-0.5 text-[13px] text-ink-2">{disagreeQuip(row, people)}</div>
                <PersonScores row={row} people={people} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {filter !== "shared" && result.myPicks.length > 0 && (
        <section>
          <SectionLabel>Your picks for {them}</SectionLabel>
          <div className="border-t border-line">
            {result.myPicks.map((row) => (
              <BlendListRow
                key={row.restaurant.id}
                row={{ ...row, blended: row.scores.me ?? row.blended }}
                people={people}
                sub={`You gave it a ${fmtScore(row.scores.me ?? 0)}`}
                showScores={false}
              />
            ))}
          </div>
        </section>
      )}

      {filter !== "shared" && result.theirPicks.length > 0 && (
        <section>
          <SectionLabel>{group ? "Their" : `${groupFriends[0].name}'s`} picks for you</SectionLabel>
          <div className="border-t border-line">
            {result.theirPicks.map((row) => (
              <BlendListRow
                key={row.restaurant.id}
                row={row}
                people={people}
                sub={`${nameOf(row.by ?? "")} gave it a ${fmtScore(row.scores[row.by ?? ""] ?? 0)}`}
                showScores={group}
              />
            ))}
          </div>
        </section>
      )}

      {filter === "all" && result.cuisines.length > 0 && (
        <section>
          <SectionLabel>Cuisine overlap</SectionLabel>
          <div className="mx-4 flex flex-col gap-3 rounded-[14px] bg-fill p-3.5">
            {result.cuisines.map((c) => (
              <div key={c.cuisine}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-ink">{c.cuisine}</span>
                  <span className="flex items-center gap-2 tabular-nums text-ink-2">
                    {people
                      .filter((p) => c.per[p.id] !== undefined)
                      .map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={personAvatar(p.id)} alt="" className="h-4 w-4 rounded-full object-cover" />
                          {fmtScore(c.per[p.id])}
                        </span>
                      ))}
                  </span>
                </div>
                <div className="mt-1 h-[8px] w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${(c.avg / maxCuisine) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="px-4 pt-6">
        <PrimaryButton onClick={() => setSharing(true)}>Share your blend</PrimaryButton>
      </div>

      {sharing && (
        <BlendShareCard
          result={result}
          title={title}
          onClose={() => setSharing(false)}
          onShare={() => {
            setSharing(false);
            showToast("Blend card copied. Go send it!");
          }}
        />
      )}
    </div>
  );
}
