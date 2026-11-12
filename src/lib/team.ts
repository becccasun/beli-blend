"use client";

// Team challenges: mock challenges + per-device team state (localStorage).
import { useCallback, useEffect, useState } from "react";
import { friendById, friendRatings, type RankedEntry } from "./data";

import { challenges, type Challenge } from "./team-data";
export { challenges, type Challenge };

export const challengeById = (id: string) => challenges.find((c) => c.id === id);

export type Team = {
  challengeId: string;
  mode: "solo" | "team";
  name: string;
  memberIds: string[]; // friend ids, not including "me"
  status: "pending" | "active";
  startedAt: string; // ISO date; your store rankings on or after this count automatically
  myRated: string[]; // restaurant ids you added to the challenge with "Rank it"
  friendRated: Record<string, string[]>; // friendId -> restaurant ids
  nudged: string[];
  order: string[]; // activity keys "member:restaurant", newest first
};

type TeamState = { teams: Record<string, Team> };

const KEY = "beli-proposal-team-v1";

const seed: TeamState = {
  teams: {
    "kerrytown-crawl": {
      challengeId: "kerrytown-crawl",
      mode: "team",
      name: "The Market Rats",
      memberIds: ["maya", "priya"],
      status: "active",
      startedAt: "2026-10-01",
      myRated: [],
      friendRated: { maya: ["blank-slate", "miss-kim", "spencer"], priya: ["lunch-room", "spencer"] },
      nudged: [],
      order: ["maya:miss-kim", "priya:lunch-room", "maya:blank-slate", "me:spencer", "priya:spencer", "maya:spencer"],
    },
  },
};

// Tiny shared store so the hub and detail pages stay in sync.
let state: TeamState = seed;
let hydrated = false;
const listeners = new Set<() => void>();

function write(next: TeamState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

export function useTeams() {
  const [snap, setSnap] = useState<TeamState>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      hydrated = true;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) state = JSON.parse(raw) as TeamState;
      } catch {}
    }
    setSnap(state);
    setReady(true);
    const l = () => setSnap(state);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const update = useCallback((id: string, fn: (t: Team) => Team) => {
    const t = state.teams[id];
    if (!t) return;
    write({ teams: { ...state.teams, [id]: fn(t) } });
  }, []);

  const join = useCallback((team: Team) => {
    write({ teams: { ...state.teams, [team.challengeId]: team } });
  }, []);

  const leave = useCallback((id: string) => {
    const next = { ...state.teams };
    delete next[id];
    write({ teams: next });
  }, []);

  const resetDemo = useCallback(() => write(seed), []);

  return { teams: snap.teams, ready, update, join, leave, resetDemo };
}

// ---------- derived views ----------

export type SpotStatus = {
  restaurantId: string;
  scores: { memberId: string; score: number }[];
  teamScore: number | null; // average once two or more have rated
  counted: boolean; // any member has ranked it
  fullyRated: boolean; // every member has ranked it
};

/** A friend's score for a spot. Falls back to a stable fake score if data.ts has none. */
export const friendScore = (fid: string, rid: string) => {
  const s = friendRatings[fid]?.[rid];
  if (s !== undefined) return s;
  const h = [...(fid + rid)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return 7 + (h % 25) / 10;
};

export function myScoreFor(team: Team, rid: string, getEntry: (id: string) => RankedEntry | undefined) {
  const e = getEntry(rid);
  if (!e) return null;
  if (team.myRated.includes(rid) || e.visitedAt >= team.startedAt) return e.score;
  return null;
}

export function teamMembers(team: Team) {
  return ["me", ...team.memberIds];
}

export function spotStatuses(team: Team, ch: Challenge, getEntry: (id: string) => RankedEntry | undefined): SpotStatus[] {
  const members = teamMembers(team);
  return ch.restaurantIds.map((rid) => {
    const scores: { memberId: string; score: number }[] = [];
    const mine = myScoreFor(team, rid, getEntry);
    if (mine !== null) scores.push({ memberId: "me", score: mine });
    if (team.status === "active") {
      for (const fid of team.memberIds) {
        if (team.friendRated[fid]?.includes(rid)) scores.push({ memberId: fid, score: friendScore(fid, rid) });
      }
    }
    const teamScore = scores.length >= 2 ? scores.reduce((a, s) => a + s.score, 0) / scores.length : null;
    return {
      restaurantId: rid,
      scores,
      teamScore,
      counted: scores.length > 0,
      fullyRated: scores.length === members.length,
    };
  });
}

export const memberName = (id: string) => friendById(id).name;

// ---------- leaderboard points ----------
// Proposal: challenges feed the leaderboard. Ranking a place is still worth 1 point,
// and teams earn extra for rating spots together and for finishing.
export const POINTS = { place: 1, fullyRated: 1, finishSolo: 5, finishTeam: 10 };

/** Places ranked this year before the demo list starts (matches the yearly challenge). */
export const BASE_PLACES = 23;

export type PointLine = { label: string; detail: string; earned: number; possible: number };

export function challengePoints(team: Team, ch: Challenge, getEntry: (id: string) => RankedEntry | undefined) {
  const spots = spotStatuses(team, ch, getEntry);
  const total = ch.restaurantIds.length;
  const finished = spots.every((s) => s.counted);
  const lines: PointLine[] = [];
  if (team.mode === "team") {
    const fully = spots.filter((s) => s.fullyRated).length;
    lines.push({
      label: "Spots the whole team rated",
      detail: `${fully} of ${total} · +${POINTS.fullyRated} each`,
      earned: fully * POINTS.fullyRated,
      possible: total * POINTS.fullyRated,
    });
    lines.push({
      label: "Finish as a team",
      detail: finished ? "Done" : "Everyone gets it",
      earned: finished ? POINTS.finishTeam : 0,
      possible: POINTS.finishTeam,
    });
  } else {
    lines.push({
      label: "Finish the challenge",
      detail: finished ? "Done" : `Team up for +${POINTS.finishTeam} instead`,
      earned: finished ? POINTS.finishSolo : 0,
      possible: POINTS.finishSolo,
    });
  }
  const earned = lines.reduce((a, l) => a + l.earned, 0);
  const possible = lines.reduce((a, l) => a + l.possible, 0);
  return { lines, earned, possible, finished };
}

/** Most a challenge can add to the leaderboard, for the hub cards. */
export const maxPoints = (ch: Challenge, mode: "solo" | "team") =>
  mode === "team" ? ch.restaurantIds.length * POINTS.fullyRated + POINTS.finishTeam : POINTS.finishSolo;

/** Challenge points the signed-in user has banked across every challenge they are in. */
export function myChallengePoints(teams: Record<string, Team>, getEntry: (id: string) => RankedEntry | undefined) {
  let earned = 0;
  let possible = 0;
  for (const t of Object.values(teams)) {
    const ch = challengeById(t.challengeId);
    if (!ch) continue;
    const p = challengePoints(t, ch, getEntry);
    earned += p.earned;
    possible += p.possible;
  }
  return { earned, possible };
}

/** Mock challenge points for friends, shown on the leaderboard. */
export const friendChallengePoints: Record<string, number> = {
  judy: 24, maya: 12, priya: 11, kate: 15, eliot: 6, andrew: 6, sam: 5,
};
