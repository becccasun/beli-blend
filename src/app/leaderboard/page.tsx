"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Trophy } from "lucide-react";
import { BASE, friends, me } from "@/lib/data";
import { useStore } from "@/lib/store";
import {
  BASE_PLACES,
  POINTS,
  challengeById,
  challengePoints,
  friendChallengePoints,
  myChallengePoints,
  useTeams,
} from "@/lib/team";
import { Avatar } from "@/components/ui";

type Row = {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  places: number;
  bonus: number;
  rank?: number; // fixed rank for the wider boards
};

const tabs = ["Friends", "Ann Arbor", "All members"] as const;
type Tab = (typeof tabs)[number];

// Mock strangers for the wider boards.
const cityTop: Row[] = [
  { id: "c1", name: "Dana W.", handle: "@danaeatsa2", places: 402, bonus: 61 },
  { id: "judy", name: "Judy", handle: "@judy", avatar: `${BASE}/avatars/a9.jpg`, places: 312, bonus: 24 },
  { id: "c2", name: "Marcus L.", handle: "@marcusl", places: 296, bonus: 38 },
  { id: "c3", name: "Hana K.", handle: "@hanak", places: 271, bonus: 12 },
  { id: "priya", name: "Priya", handle: "@priyak", avatar: `${BASE}/avatars/a16.jpg`, places: 201, bonus: 11 },
  { id: "c4", name: "Theo R.", handle: "@theor", places: 188, bonus: 20 },
];
const globalTop: Row[] = [
  { id: "g1", name: "Ines M.", handle: "@inesm", places: 4102, bonus: 310 },
  { id: "g2", name: "Rafael T.", handle: "@raf", places: 3877, bonus: 284 },
  { id: "g3", name: "Sora N.", handle: "@soraeats", places: 3540, bonus: 122 },
  { id: "g4", name: "Bea C.", handle: "@beac", places: 3312, bonus: 265 },
  { id: "g5", name: "Jonah P.", handle: "@jonahp", places: 3105, bonus: 97 },
  { id: "g6", name: "Lila S.", handle: "@lilas", places: 2988, bonus: 140 },
];

const total = (r: Row) => r.places + r.bonus;

export default function LeaderboardPage() {
  const { ranked, getEntry } = useStore();
  const { teams } = useTeams();
  const [tab, setTab] = useState<Tab>("Friends");
  const [rulesOpen, setRulesOpen] = useState(true);

  const mine = myChallengePoints(teams, getEntry);
  const meRow: Row = {
    id: "me",
    name: "You",
    handle: "@becca",
    avatar: me.avatar,
    places: BASE_PLACES + ranked.length,
    bonus: mine.earned,
  };

  // Friends board is fully live; the wider boards show a top slice plus your pinned row.
  const friendRows: Row[] = [
    ...friends.map((f) => ({
      id: f.id,
      name: f.name,
      handle: f.handle,
      avatar: f.avatar,
      places: f.been,
      bonus: friendChallengePoints[f.id] ?? 0,
    })),
    meRow,
  ].sort((a, b) => total(b) - total(a));

  const rows: Row[] =
    tab === "Friends"
      ? friendRows.map((r, i) => ({ ...r, rank: i + 1 }))
      : (tab === "Ann Arbor" ? cityTop : globalTop).map((r, i) => ({ ...r, rank: i + 1 }));
  const pinned: Row | null =
    tab === "Friends" ? null : { ...meRow, rank: tab === "Ann Arbor" ? 214 : 832 };

  // What is still on the table from an unfinished challenge, and who it would pass.
  const openTeam = Object.values(teams).find((t) => {
    const ch = challengeById(t.challengeId);
    return ch && !challengePoints(t, ch, getEntry).finished;
  });
  const openCh = openTeam && challengeById(openTeam.challengeId);
  const openPts = openTeam && openCh ? challengePoints(openTeam, openCh, getEntry) : null;
  const left = openPts ? openPts.possible - openPts.earned : 0;
  const myIdx = friendRows.findIndex((r) => r.id === "me");
  const passed = friendRows
    .slice(0, myIdx)
    .filter((r) => total(meRow) + left > total(r))
    .map((r) => r.name);

  return (
    <div className="pb-8">
      <div className="flex h-10 items-center justify-center text-[12px] font-bold uppercase tracking-[0.1em]">
        Leaderboard
      </div>
      <div role="tablist" className="mx-4 flex rounded-lg bg-fill p-0.5 text-center text-[13.5px] font-semibold">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 transition ${
              tab === t ? "bg-white text-ink shadow-sm" : "text-ink-2"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* how points work */}
      <div className="mx-4 mt-3 rounded-xl border border-line">
        <button
          onClick={() => setRulesOpen((o) => !o)}
          aria-expanded={rulesOpen}
          className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left"
        >
          <Trophy size={16} className="text-teal" />
          <span className="flex-1 text-[14px] font-semibold">How points work</span>
          <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            New
          </span>
          <ChevronDown size={16} className={`text-ink-3 transition ${rulesOpen ? "rotate-180" : ""}`} />
        </button>
        {rulesOpen && (
          <div className="space-y-1.5 border-t border-line px-3.5 py-2.5 text-[13px]">
            {[
              ["Rank a place", `+${POINTS.place}`],
              ["A spot your whole team rates", `+${POINTS.fullyRated}`],
              ["Finish a challenge solo", `+${POINTS.finishSolo}`],
              ["Finish a challenge as a team", `+${POINTS.finishTeam} each`],
            ].map(([l, p]) => (
              <div key={l} className="flex justify-between">
                <span className="text-ink-2">{l}</span>
                <span className="font-semibold tabular-nums text-teal">{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* your next move */}
      {openCh && left > 0 && (
        <Link
          href={`/team/${openCh.id}`}
          className="mx-4 mt-2.5 block rounded-xl bg-teal-tint px-3.5 py-2.5 text-[13px] leading-snug text-teal"
        >
          <b>+{left} pts</b> still up for grabs in <b>{openCh.title}</b>
          {tab === "Friends" && passed.length > 0 && (
            <>
              . Enough to pass <b>{passed.slice(-2).join(" and ")}</b>
            </>
          )}
          .
        </Link>
      )}

      <div className="flex justify-between px-4 pb-1 pt-4 text-[12px] text-ink-3">
        <span>
          {tab === "Friends" ? "People you follow" : tab === "Ann Arbor" ? "Top in Ann Arbor" : "Top on Beli"}
        </span>
        <span>Points</span>
      </div>
      {rows.map((r) => (
        <BoardRow key={r.id} r={r} />
      ))}
      {pinned && (
        <>
          <div className="py-1 text-center text-[16px] leading-none tracking-[0.3em] text-ink-3">···</div>
          <BoardRow r={pinned} />
        </>
      )}
    </div>
  );
}

function BoardRow({ r }: { r: Row }) {
  const isMe = r.id === "me";
  return (
    <div className={`flex items-center gap-3 border-b border-line px-4 py-2.5 ${isMe ? "bg-teal-tint" : ""}`}>
      <span className="w-7 text-[14px] font-bold tabular-nums">{r.rank}</span>
      {r.avatar ? (
        <Avatar src={r.avatar} size={40} />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-[14px] font-semibold text-ink-2">
          {r.name[0]}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">
          {r.name} <span className="font-normal text-ink-3">{r.handle}</span>
        </div>
        <div className="text-[12px] tabular-nums text-ink-3">
          {r.places.toLocaleString()} places
          {r.bonus > 0 && <span className="font-semibold text-teal"> · +{r.bonus} challenges</span>}
        </div>
      </div>
      <span className="text-[16px] font-bold tabular-nums text-teal">{total(r).toLocaleString()}</span>
    </div>
  );
}
