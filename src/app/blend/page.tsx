"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock, MapPin, Search, Shuffle } from "lucide-react";
import { cityName, friendById, friends, me, mealsTogether, type Friend } from "@/lib/data";
import { useStore } from "@/lib/store";
import { groupMatch, parseBlendId } from "@/lib/blend";
import { Avatar, AvatarStack, BackHeader, SectionLabel } from "@/components/ui";
import { useBlends } from "@/components/blend/storage";
import { BlendCardsSkeleton, RowsSkeleton, markLoaded, useLoaded } from "@/components/skeleton";
import { BlendingMoment, groupTitle, namesOf, toPeople, useRatings } from "@/components/blend/parts";
import { RequestSheet } from "@/components/blend/RequestSheet";

const friendIds = friends.map((f) => f.id);

const meals = (f: Friend) => mealsTogether[f.id] ?? 0;
const mealsLabel = (n: number) => (n ? `${n} ${n === 1 ? "meal" : "meals"} together` : "No meals together yet");

/**
 * Your blends, then every friend you could still blend with, the ones you eat with most first.
 * Search covers both: an existing blend opens, anyone else gets an invite.
 */
export default function BlendLanding() {
  const router = useRouter();
  const { showToast } = useStore();
  const { blends, incoming, request, remove, accept, decline, isMutual } = useBlends();
  const ratings = useRatings();
  const [query, setQuery] = useState("");
  const [accepted, setAccepted] = useState<Friend | null>(null);
  const [inviting, setInviting] = useState<Friend | null>(null);

  const existing = blends
    .map((b) => ({ ...b, friends: parseBlendId(b.id, friendIds).map((id) => friendById(id)) }))
    .filter((b) => b.friends.length);

  const q = query.trim().toLowerCase().replace(/^@/, "");
  const byMeals = (a: Friend, b: Friend) => meals(b) - meals(a) || a.name.localeCompare(b.name);
  const mutuals = friends.filter(isMutual).sort(byMeals);
  const results = q ? mutuals.filter((f) => f.name.toLowerCase().includes(q) || f.handle.toLowerCase().slice(1).includes(q)) : [];
  // One-to-one state with a friend: a blend (sent or live), a request from them, or nothing yet.
  const blendWith = (f: Friend) => blends.find((b) => b.id === f.id);
  const asked = (f: Friend) => incoming.some((r) => r.from === f.id);
  const unblended = mutuals.filter((f) => !blendWith(f) && !asked(f));

  const friendRow = (f: Friend) => {
    const b = blendWith(f);
    const wants = asked(f);
    const sub = b
      ? b.status === "pending"
        ? `Waiting on ${f.name}`
        : b.city
          ? `Paired · ${cityName(b.city)}`
          : "Paired"
      : wants
        ? "Wants to pair up"
        : mealsLabel(meals(f));
    return (
      <div key={f.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <Link href={b || wants ? `/blend/${f.id}` : `/user/${f.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={f.avatar} size={44} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold text-ink">{f.name}</div>
            <div className="truncate text-[13px] text-ink-2">{sub}</div>
          </div>
        </Link>
        {b?.status === "active" ? (
          <Link href={`/blend/${f.id}`} className="shrink-0 text-right">
            <div className="font-serif text-[22px] font-bold leading-none text-teal">
              {groupMatch(toPeople([f]), ratings).match}%
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-3">match</div>
          </Link>
        ) : b || wants ? (
          <Link
            href={`/blend/${f.id}`}
            className="inline-flex h-[32px] shrink-0 items-center rounded-full border border-[#cfcfcf] px-3.5 text-[13px] font-semibold text-ink"
          >
            {wants ? "Respond" : "Requested"}
          </Link>
        ) : (
          <button
            onClick={() => setInviting(f)}
            className="inline-flex h-[32px] shrink-0 items-center gap-1.5 rounded-full bg-teal px-3.5 text-[13px] font-semibold text-white active:scale-[0.98]"
          >
            <Shuffle size={14} />
            Pair up
          </button>
        )}
      </div>
    );
  };
  const loaded = useLoaded("blends");
  const searched = useLoaded(q ? `search:${q}` : null, 400);

  return (
    <div className="pb-10">
      <BackHeader title="Pairings" />

      <div className="px-4 pt-2">
        <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">Pairings</h1>
        <label className="mt-3 flex h-[40px] items-center gap-2 rounded-[12px] bg-fill px-3">
          <Search size={17} className="shrink-0 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends"
            aria-label="Search friends"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
        </label>
      </div>

      {q && !searched ? (
        <div className="mt-3" role="status" aria-label="Searching">
          <RowsSkeleton rows={2} avatar />
        </div>
      ) : q ? (
        <div className="animate-fade-in mt-3 border-t border-line">
          {results.map(friendRow)}
          {!results.length && <p className="px-4 pt-4 text-[14px] text-ink-2">No friends match &ldquo;{query}&rdquo;.</p>}
        </div>
      ) : !loaded ? (
        <BlendCardsSkeleton cards={incoming.length + blends.length} />
      ) : (
        <div className="animate-fade-in">
          {incoming.length > 0 && (
            <>
              <SectionLabel>Requests</SectionLabel>
              <div className="mx-4 flex flex-col gap-2.5">
                {incoming.map((req) => {
                  const f = friendById(req.from);
                  return (
                    <div key={req.from} className="rounded-[16px] border border-teal bg-teal-tint p-3.5">
                      <Link href={`/user/${f.id}`} className="flex items-center gap-3">
                        <Avatar src={f.avatar} size={44} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-bold text-ink">{f.name} wants to pair up</div>
                          <div className="text-[13px] text-ink-2">{req.when}</div>
                        </div>
                      </Link>
                      {req.note && (
                        <p className="mt-2 text-[14px] italic leading-snug text-ink-2">&ldquo;{req.note}&rdquo;</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {
                            accept(f.id);
                            setAccepted(f);
                          }}
                          className="h-[36px] flex-1 rounded-full bg-teal text-[14px] font-semibold text-white"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            decline(f.id);
                            showToast("Request declined.");
                          }}
                          className="h-[36px] flex-1 rounded-full border border-[#cfcfcf] bg-white text-[14px] font-semibold text-ink"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <SectionLabel>Your pairings</SectionLabel>
          {existing.length ? (
            <div className="mx-4 flex flex-col gap-2.5">
              {existing.map((b) => {
                const pending = b.status === "pending";
                const { match } = groupMatch(toPeople(b.friends), ratings);
                return (
                  <div key={b.id} className="rounded-[16px] border border-line p-3.5">
                    <Link href={`/blend/${b.id}`} className="flex items-center gap-3">
                      <AvatarStack srcs={[me.avatar, ...b.friends.map((f) => f.avatar)]} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[16px] font-bold text-ink">{groupTitle(b.friends)}</div>
                        {pending ? (
                          <div className="flex items-center gap-1 text-[13px] text-ink-2">
                            <Clock size={12} /> Waiting on {namesOf(b.friends)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 truncate text-[13px] text-ink-2">
                            <MapPin size={12} />
                            {b.city ? cityName(b.city) : <span className="font-semibold text-teal">Choose a city</span>}
                          </div>
                        )}
                      </div>
                      {pending ? (
                        <ChevronRight size={20} className="text-ink-3" />
                      ) : (
                        <div className="text-right">
                          <div className="font-serif text-[26px] font-bold leading-none text-teal">{match}%</div>
                          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-3">match</div>
                        </div>
                      )}
                    </Link>
                    {pending && (
                      <button
                        onClick={() => {
                          remove(b.id);
                          showToast("Request cancelled.");
                        }}
                        className="mt-3 h-[36px] w-full rounded-full border border-[#cfcfcf] text-[14px] font-semibold text-ink"
                      >
                        Cancel request
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-4 text-[14px] text-ink-2">None yet. Pair up with a friend below.</p>
          )}

          {unblended.length > 0 && (
            <>
              <SectionLabel>Friends</SectionLabel>
              <div className="border-t border-line">{unblended.map(friendRow)}</div>
            </>
          )}
        </div>
      )}

      {inviting && (
        <RequestSheet
          friends={[inviting]}
          onClose={() => setInviting(null)}
          onSend={(note) => {
            request([inviting.id], note);
            showToast(`Request sent to ${inviting.name}.`);
            setInviting(null);
          }}
        />
      )}

      {accepted && (
        <BlendingMoment
          friends={[accepted]}
          onDone={() => {
            markLoaded(`blend:${accepted.id}`);
            router.push(`/blend/${accepted.id}`);
          }}
        />
      )}
    </div>
  );
}
