"use client";

import { useState } from "react";
import Link from "next/link";
import { BASE, friends, me } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui";
import { ScreenSkeleton, useLoaded } from "@/components/skeleton";

type Row = {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  places: number;
  rank?: number; // fixed rank for the wider boards
};

const tabs = ["Friends", "Ann Arbor", "All members"] as const;
type Tab = (typeof tabs)[number];

// Mock strangers for the wider boards.
const cityTop: Row[] = [
  { id: "c1", name: "Dana W.", handle: "@danaeatsa2", places: 402 },
  { id: "judy", name: "Judy", handle: "@judy", avatar: `${BASE}/avatars/a9.jpg`, places: 312 },
  { id: "c2", name: "Marcus L.", handle: "@marcusl", places: 296 },
  { id: "c3", name: "Hana K.", handle: "@hanak", places: 271 },
  { id: "priya", name: "Priya", handle: "@priyak", avatar: `${BASE}/avatars/a16.jpg`, places: 201 },
  { id: "c4", name: "Theo R.", handle: "@theor", places: 188 },
];
const globalTop: Row[] = [
  { id: "g1", name: "Ines M.", handle: "@inesm", places: 4102 },
  { id: "g2", name: "Rafael T.", handle: "@raf", places: 3877 },
  { id: "g3", name: "Sora N.", handle: "@soraeats", places: 3540 },
  { id: "g4", name: "Bea C.", handle: "@beac", places: 3312 },
  { id: "g5", name: "Jonah P.", handle: "@jonahp", places: 3105 },
  { id: "g6", name: "Lila S.", handle: "@lilas", places: 2988 },
];

// Places ranked earlier, before the demo list.
const BASE_PLACES = 23;

export default function LeaderboardPage() {
  const loaded = useLoaded("leaderboard");
  const { ranked } = useStore();
  const [tab, setTab] = useState<Tab>("Friends");

  const meRow: Row = {
    id: "me",
    name: "You",
    handle: "@becca",
    avatar: me.avatar,
    places: BASE_PLACES + ranked.length,
  };

  // Friends board is fully live; the wider boards show a top slice plus your pinned row.
  const friendRows: Row[] = [
    ...friends.map((f) => ({
      id: f.id,
      name: f.name,
      handle: f.handle,
      avatar: f.avatar,
      places: f.been,
    })),
    meRow,
  ].sort((a, b) => b.places - a.places);

  const rows: Row[] =
    tab === "Friends"
      ? friendRows.map((r, i) => ({ ...r, rank: i + 1 }))
      : (tab === "Ann Arbor" ? cityTop : globalTop).map((r, i) => ({ ...r, rank: i + 1 }));
  const pinned: Row | null =
    tab === "Friends" ? null : { ...meRow, rank: tab === "Ann Arbor" ? 214 : 832 };

  if (!loaded) return <ScreenSkeleton kind="board" />;

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

      <div className="flex justify-between px-4 pb-1 pt-4 text-[12px] text-ink-3">
        <span>
          {tab === "Friends" ? "People you follow" : tab === "Ann Arbor" ? "Top in Ann Arbor" : "Top on Beli"}
        </span>
        <span>Places been</span>
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
  const cls = `flex items-center gap-3 border-b border-line px-4 py-2.5 ${isMe ? "bg-teal-tint" : ""}`;
  // Rows for people in the prototype open their profile, which is where a blend starts.
  const Row = ({ children }: { children: React.ReactNode }) =>
    friends.some((p) => p.id === r.id) ? (
      <Link href={`/user/${r.id}`} className={`${cls} active:bg-fill`}>
        {children}
      </Link>
    ) : (
      <div className={cls}>{children}</div>
    );
  return (
    <Row>
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
          {r.name}
        </div>
        <div className="truncate text-[12px] text-ink-3">{r.handle}</div>
      </div>
      <span className="text-[16px] font-bold tabular-nums text-teal">{r.places.toLocaleString()}</span>
    </Row>
  );
}
