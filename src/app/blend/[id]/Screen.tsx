"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Clock, MapPin, Share, Shuffle } from "lucide-react";
import { cityName, fmtScore, friendById, friends as allFriends, me } from "@/lib/data";
import { useStore } from "@/lib/store";
import {
  blendIdFor,
  cityOptions,
  cityPool,
  computeBlend,
  disagreeQuip,
  parseBlendId,
  startHere,
} from "@/lib/blend";
import { AvatarStack, BackHeader, OutlineChip, PrimaryButton, SectionLabel } from "@/components/ui";
import {
  BlendingMoment,
  BlendListRow,
  BlendShareCard,
  CitySheet,
  PersonScores,
  StartHereCard,
  groupTitle,
  namesOf,
  personAvatar,
  toPeople,
  useRatings,
} from "@/components/blend/parts";
import { RequestSheet } from "@/components/blend/RequestSheet";
import { useBlends } from "@/components/blend/storage";
import { BlendSkeleton, CuratingSkeleton, useLoaded } from "@/components/skeleton";

type Filter = "all" | "shared" | "new";
const personIds = allFriends.map((f) => f.id);

export default function BlendResultPage() {
  const params = useParams<{ id: string }>();
  const ids = parseBlendId(String(params?.id ?? ""), personIds);
  const key = (ids.length ? ids : ["maya"]).join("-");
  const groupFriends = useMemo(() => key.split("-").map((id) => friendById(id)), [key]);
  const blendId = blendIdFor(groupFriends.map((f) => f.id));

  const { showToast } = useStore();
  const { blends, incoming, request, remove, accept, decline, setCity, isMutual } = useBlends();
  const ratings = useRatings();
  const [filter, setFilter] = useState<Filter>("all");
  const [sharing, setSharing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [pickingCity, setPickingCity] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const saved = blends.find((b) => b.id === blendId);
  const invite = groupFriends.length === 1 ? incoming.find((r) => r.from === groupFriends[0].id) : undefined;
  const status = saved?.status ?? (invite ? "incoming" : "none");
  const city = saved?.status === "active" ? saved.city : undefined;

  // Play the merge moment when a request you were waiting on comes through.
  const prev = useRef(status);
  useEffect(() => {
    if (prev.current === "pending" && status === "active") setCelebrating(true);
    prev.current = status;
  }, [status]);

  const people = useMemo(() => toPeople(groupFriends), [groupFriends]);
  // The match is about the people, so it always uses every city. The lists are about a place.
  const overall = useMemo(() => computeBlend(people, ratings), [people, ratings]);
  const options = useMemo(() => cityOptions(people, ratings), [people, ratings]);
  const result = useMemo(
    () => (city ? computeBlend(people, ratings, cityPool(city)) : overall),
    [city, people, ratings, overall]
  );
  const lead = city ? startHere(result) : null;
  // The top pick sits in its own card, so on "All" the lists leave it out.
  const leadId = lead && filter === "all" ? lead.row.restaurant.id : null;
  const rest = (rows: typeof result.shared) => rows.filter((r) => r.restaurant.id !== leadId);
  const loaded = useLoaded(`blend:${blendId}`, 850);
  // Each city's list is put together the first time you ask for it.
  const curated = useLoaded(city ? `curate:${blendId}:${city}` : null, 1700);
  const allMutual = groupFriends.every(isMutual);

  const group = people.length > 2;
  const both = group ? "all" : "both";
  const them = group ? "them" : groupFriends[0].name;
  const names = namesOf(groupFriends);
  const title = groupTitle(groupFriends);
  const where = city ? cityName(city) : "";
  const maxCuisine = Math.max(10, ...overall.cuisines.map((c) => c.avg));

  const pickCity = (c: string) => {
    setCity(blendId, c);
    setPickingCity(false);
    setFilter("all");
    document.getElementById("phone-scroll")?.scrollTo({ top: 0 });
  };

  const cuisineSection = overall.cuisines.length > 0 && (
    <section>
      <SectionLabel>Cuisines in common</SectionLabel>
      <div className="mx-4 flex flex-col gap-2.5 rounded-[14px] bg-fill px-3.5 py-3">
        {overall.cuisines.map((c) => (
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
  );

  const header = (
    <div className="flex flex-col items-center px-4 pb-4 pt-3 text-center">
      <AvatarStack srcs={[me.avatar, ...groupFriends.map((f) => f.avatar)]} size={56} />
      <div className="mt-2 text-[14px] font-semibold text-ink-2">{title}</div>
      <div className="mt-1 font-serif text-[52px] font-bold leading-none text-teal">{overall.match}%</div>
      <div className="mt-1 text-[12px] font-bold uppercase tracking-[0.1em] text-ink">Taste match</div>
      <div className="mt-1 text-[13px] text-ink-2">
        {overall.overlapCount
          ? `From ${overall.overlapCount} ${overall.overlapCount === 1 ? "place" : "places"} you've ${both} ranked`
          : "From the cuisines you each rank high"}
      </div>
    </div>
  );

  if (!loaded && !celebrating) return <BlendSkeleton />;

  // Not blended yet: the match is a preview, the list waits for a yes.
  if (status !== "active") {
    return (
      <div className="pb-10">
        <BackHeader title="Pairing" />
        {header}
        <div className="mx-4 rounded-[16px] border border-line p-4 text-center">
          {status === "pending" && (
            <>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-tint text-teal">
                <Clock size={20} />
              </div>
              <div className="mt-2 font-serif text-[20px] font-bold text-ink">Waiting on {names}</div>
              {saved?.note && <p className="mt-2 text-[13px] italic text-ink-3">&ldquo;{saved.note}&rdquo;</p>}
              <button
                onClick={() => {
                  remove(blendId);
                  showToast("Request cancelled.");
                }}
                className="mt-3 h-[40px] w-full rounded-full border border-[#cfcfcf] text-[14px] font-semibold text-ink"
              >
                Cancel request
              </button>
            </>
          )}
          {status === "incoming" && (
            <>
              <div className="font-serif text-[20px] font-bold text-ink">{names} wants to pair up</div>
              {invite?.note && <p className="mt-1 text-[14px] italic text-ink-2">&ldquo;{invite.note}&rdquo;</p>}
              <PrimaryButton className="mt-3" onClick={() => { accept(groupFriends[0].id); setCelebrating(true); }}>
                Accept
              </PrimaryButton>
              <button
                onClick={() => {
                  decline(groupFriends[0].id);
                  showToast("Request declined.");
                }}
                className="mt-2 h-[40px] w-full rounded-full text-[14px] font-semibold text-ink-2"
              >
                Decline
              </button>
            </>
          )}
          {status === "none" && (
            <>
              <div className="font-serif text-[20px] font-bold text-ink">See where you&apos;d {both} love to eat</div>
              {allMutual ? (
                <PrimaryButton className="mt-3" onClick={() => setAsking(true)}>
                  <span className="inline-flex items-center gap-2">
                    <Shuffle size={16} />
                    Pair up
                  </span>
                </PrimaryButton>
              ) : (
                <p className="mt-1 text-[14px] leading-snug text-ink-2">Pair up once you follow each other.</p>
              )}
            </>
          )}
        </div>
        {cuisineSection}
        {asking && (
          <RequestSheet
            friends={groupFriends}
            onClose={() => setAsking(false)}
            onSend={(note) => {
              request(groupFriends.map((f) => f.id), note);
              setAsking(false);
              showToast(`Request sent to ${names}.`);
            }}
          />
        )}
        {celebrating && <BlendingMoment friends={groupFriends} onDone={() => setCelebrating(false)} />}
      </div>
    );
  }

  return (
    <div className="pb-10">
      <BackHeader
        title="Pairing"
        right={
          <button aria-label="Share pairing" onClick={() => setSharing(true)} className="p-1">
            <Share size={21} />
          </button>
        }
      />

      {header}

      {!city ? (
        <>
          {/* The one decision Blend will not make for you. */}
          <div className="px-4">
            <PrimaryButton onClick={() => setPickingCity(true)}>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} />
                Choose a city
              </span>
            </PrimaryButton>
            <p className="mt-2 text-center text-[13px] text-ink-2">See places you&apos;d {both} love there.</p>
          </div>
          <section>
            <SectionLabel>You&apos;ve {both} ranked</SectionLabel>
            {overall.common.length > 0 ? (
              <div className="border-t border-line">
                {overall.common.map((row, i) => (
                  <BlendListRow key={row.restaurant.id} row={row} index={i + 1} people={people} />
                ))}
              </div>
            ) : (
              <p className="px-4 text-[14px] leading-snug text-ink-2">
                You and {names} have never dined at the same place, or there are no restaurants that you have {both}{" "}
                logged on Beli. Start eating together. Start logging together.
              </p>
            )}
          </section>
          {cuisineSection}
        </>
      ) : (
        <>
          <div className="no-scrollbar sticky top-11 z-10 flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2">
            <button
              onClick={() => setPickingCity(true)}
              className="inline-flex h-[30px] shrink-0 items-center gap-1 rounded-full bg-teal pl-2.5 pr-2 text-[13px] font-semibold text-white"
            >
              <MapPin size={14} />
              {where}
              <ChevronDown size={15} />
            </button>
            <OutlineChip active={filter === "all"} onClick={() => setFilter("all")}>All</OutlineChip>
            {result.shared.length > 0 && (
              <OutlineChip active={filter === "shared"} onClick={() => setFilter("shared")}>You {both} love</OutlineChip>
            )}
            <OutlineChip active={filter === "new"} onClick={() => setFilter("new")}>Recommended</OutlineChip>
          </div>

          {!curated ? (
            <CuratingSkeleton city={where} />
          ) : (
          <div className="animate-fade-in">
          {filter === "all" && lead && (
            <StartHereCard
              key={`${city}-${lead.row.restaurant.id}`}
              row={lead.row}
              predicted={lead.predicted}
              toName={them}
              onSuggest={() => showToast(`Sent to ${names}: "${lead.row.restaurant.name} sometime?"`)}
            />
          )}

          {filter !== "new" && rest(result.shared).length > 0 && (
            <section>
              <SectionLabel>You {both} love</SectionLabel>
              <div className="border-t border-line">
                {rest(result.shared).map((row, i) => (
                  <BlendListRow
                    key={row.restaurant.id}
                    row={row}
                    index={i + 1}
                    people={people}
                  />
                ))}
              </div>
            </section>
          )}

          {filter !== "shared" && rest(result.together).length > 0 && (
            <section>
              <SectionLabel>Recommended for you {both}</SectionLabel>
              <div className="border-t border-line">
                {rest(result.together).map((row, i) => (
                  <BlendListRow
                    key={row.restaurant.id}
                    row={row}
                    index={i + 1}
                    people={people}
                    // Someone has been: their score pill says it. New to everyone: say why it fits.
                    sub={row.by ? undefined : row.reason}
                    showScores={!!row.by}
                    ratedOnly
                    predicted
                  />
                ))}
              </div>
            </section>
          )}

          {filter === "shared" && result.shared.length === 0 && (
            <p className="px-4 pt-4 text-[14px] text-ink-2">
              No shared favourites in {where} yet.
            </p>
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

          {filter === "all" && cuisineSection}

          <div className="px-4 pt-6">
            <PrimaryButton onClick={() => setSharing(true)}>Share</PrimaryButton>
          </div>
          </div>
          )}
        </>
      )}

      {pickingCity && (
        <CitySheet options={options} current={city} onPick={pickCity} onClose={() => setPickingCity(false)} />
      )}

      {sharing && (
        <BlendShareCard
          result={result}
          title={title}
          city={city}
          onClose={() => setSharing(false)}
          onShare={() => {
            setSharing(false);
            showToast("Card copied.");
          }}
        />
      )}

      {celebrating && <BlendingMoment friends={groupFriends} onDone={() => setCelebrating(false)} />}
    </div>
  );
}
