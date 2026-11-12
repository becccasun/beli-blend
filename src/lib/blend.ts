// Pure blend math. No React, no storage: everything takes plain rating maps so it is easy to test.
import { restaurants, type Restaurant } from "./data";

/** personId -> (restaurantId -> score) */
export type RatingMap = Record<string, Record<string, number>>;

export type Person = { id: string; name: string };

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const LOVE = 8.0;

/** Average score per cuisine for one person. */
export function cuisineAverages(ratings: Record<string, number>, pool: Restaurant[] = restaurants) {
  const acc: Record<string, number[]> = {};
  for (const r of pool) {
    const s = ratings[r.id];
    if (s === undefined) continue;
    for (const c of r.cuisines) (acc[c] ??= []).push(s);
  }
  const out: Record<string, number> = {};
  for (const c in acc) out[c] = mean(acc[c]);
  return out;
}

/** Cosine similarity of two people's cuisine taste, centered on their own mean. 0..1 */
function cuisineSimilarity(a: Record<string, number>, b: Record<string, number>) {
  const ca = cuisineAverages(a);
  const cb = cuisineAverages(b);
  const keys = Object.keys(ca).filter((k) => k in cb);
  if (!keys.length) return 0.5;
  const ma = mean(Object.values(a));
  const mb = mean(Object.values(b));
  let dot = 0, na = 0, nb = 0;
  for (const k of keys) {
    const x = ca[k] - ma;
    const y = cb[k] - mb;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (!na || !nb) return 0.6;
  return (dot / Math.sqrt(na * nb) + 1) / 2;
}

/**
 * Pairwise taste match, 0..100.
 * Over restaurants both have rated: 100 - 20 * mean absolute difference
 * (a 1 point average gap = 80%, 2.5 points = 50%).
 * Tiny overlap is shrunk toward a cuisine-similarity prior: weight n / (n + 3).
 */
export function pairMatch(a: Record<string, number>, b: Record<string, number>) {
  const shared = Object.keys(a).filter((k) => k in b);
  const n = shared.length;
  const prior = 45 + 45 * cuisineSimilarity(a, b); // 45..90
  if (n === 0) return { match: Math.round(prior), overlap: 0 };
  const mad = mean(shared.map((k) => Math.abs(a[k] - b[k])));
  const raw = clamp(100 - 20 * mad, 20, 99);
  const w = n / (n + 3);
  return { match: Math.round(clamp(w * raw + (1 - w) * prior, 20, 99)), overlap: n };
}

/** Group match = mean of every pair in the group. */
export function groupMatch(people: Person[], ratings: RatingMap) {
  const pairs: { a: string; b: string; match: number; overlap: number }[] = [];
  for (let i = 0; i < people.length; i++)
    for (let j = i + 1; j < people.length; j++) {
      const m = pairMatch(ratings[people[i].id] ?? {}, ratings[people[j].id] ?? {});
      pairs.push({ a: people[i].id, b: people[j].id, ...m });
    }
  return { match: Math.round(mean(pairs.map((p) => p.match))), pairs };
}

export function matchCopy(match: number, group: boolean) {
  const w = group ? "all" : "both";
  if (match >= 88) return `Basically the same stomach. You ${w} can pick blind.`;
  if (match >= 78) return `Seriously aligned. Dinner plans should be easy.`;
  if (match >= 65) return `Similar vibes with a few spicy debates.`;
  if (match >= 50) return `Different tastes, which means great new spots to swap.`;
  return `Opposites at the table. Let the blend referee.`;
}

export type BlendRow = {
  restaurant: Restaurant;
  scores: Record<string, number | undefined>; // personId -> score (undefined = not been)
  blended: number;
  reason?: string;
  gap?: number;
  by?: string; // personId of the recommender
};

export type BlendResult = {
  people: Person[];
  match: number;
  pairs: { a: string; b: string; match: number; overlap: number }[];
  overlapCount: number;
  shared: BlendRow[]; // everyone rated, all above LOVE, by blended
  disagree: BlendRow[];
  tryTogether: BlendRow[];
  myPicks: BlendRow[]; // I love, no friend has been
  theirPicks: BlendRow[]; // a friend loves, I have not been
  cuisines: { cuisine: string; avg: number; per: Record<string, number> }[];
};

/** Group cuisine affinity: for each cuisine, the average of each person's cuisine average. */
function groupCuisineTaste(people: Person[], ratings: RatingMap) {
  const per = people.map((p) => cuisineAverages(ratings[p.id] ?? {}));
  const all = new Set(per.flatMap((x) => Object.keys(x)));
  const out: Record<string, { avg: number; raters: number; per: Record<string, number> }> = {};
  for (const c of all) {
    const vals: Record<string, number> = {};
    people.forEach((p, i) => {
      if (c in per[i]) vals[p.id] = per[i][c];
    });
    out[c] = { avg: mean(Object.values(vals)), raters: Object.keys(vals).length, per: vals };
  }
  return out;
}

/**
 * Predicted blended score for a place nobody in the group has tried:
 * recScore + cuisine bonus. Bonus per cuisine = (groupAvg - 8) * 0.4 * coverage,
 * where coverage = share of the group that has rated that cuisine. Total bonus clamped to [-0.8, 0.8].
 */
export function predictTogether(r: Restaurant, people: Person[], taste: ReturnType<typeof groupCuisineTaste>) {
  let bonus = 0;
  let best: { c: string; avg: number; raters: number } | null = null;
  for (const c of r.cuisines) {
    const t = taste[c];
    if (!t) continue;
    bonus += (t.avg - 8) * 0.4 * (t.raters / people.length);
    if (!best || t.raters > best.raters || (t.raters === best.raters && t.avg > best.avg))
      best = { c, avg: t.avg, raters: t.raters };
  }
  const blended = clamp(r.recScore + clamp(bonus, -0.8, 0.8), 0, 10);
  const group = people.length > 2;
  let reason = group ? "A top rec for your whole crew" : "A top rec for you two";
  if (best && best.avg >= 7.8) {
    if (best.raters === people.length) reason = `You ${group ? "all" : "both"} rank ${best.c} high`;
    else {
      const fan = people.find((p) => (taste[best!.c].per[p.id] ?? 0) >= 7.8);
      if (fan) reason = fan.id === "me" ? `You love ${best.c}, worth converting them` : `${fan.name} loves ${best.c}`;
    }
  } else if (r.recScore >= 9) reason = "Beli thinks you'll both be obsessed";
  return { blended, reason };
}

export function computeBlend(people: Person[], ratings: RatingMap, pool: Restaurant[] = restaurants): BlendResult {
  const { match, pairs } = groupMatch(people, ratings);
  const scoresFor = (rid: string) => {
    const s: Record<string, number | undefined> = {};
    for (const p of people) s[p.id] = ratings[p.id]?.[rid];
    return s;
  };
  const taste = groupCuisineTaste(people, ratings);
  const friendsOnly = people.filter((p) => p.id !== "me");

  const shared: BlendRow[] = [];
  const disagree: BlendRow[] = [];
  const tryTogether: BlendRow[] = [];
  const myPicks: BlendRow[] = [];
  const theirPicks: BlendRow[] = [];
  let overlapCount = 0;

  for (const r of pool) {
    const scores = scoresFor(r.id);
    const vals = Object.values(scores).filter((x): x is number => x !== undefined);
    if (vals.length === people.length) {
      overlapCount++;
      const blended = mean(vals);
      const gap = Math.max(...vals) - Math.min(...vals);
      const loved = Math.min(...vals) >= LOVE - 0.5 && blended >= LOVE;
      if (loved) shared.push({ restaurant: r, scores, blended });
      if (gap >= (loved ? 1.5 : 1)) disagree.push({ restaurant: r, scores, blended, gap });
    } else if (vals.length === 0) {
      const { blended, reason } = predictTogether(r, people, taste);
      tryTogether.push({ restaurant: r, scores, blended, reason });
    }
    const mine = scores.me;
    if (mine !== undefined && mine >= LOVE && friendsOnly.every((f) => scores[f.id] === undefined))
      myPicks.push({ restaurant: r, scores, blended: mine, by: "me" });
    if (mine === undefined) {
      const fans = friendsOnly.filter((f) => (scores[f.id] ?? 0) >= LOVE);
      if (fans.length) {
        const top = fans.reduce((a, b) => ((scores[a.id] ?? 0) >= (scores[b.id] ?? 0) ? a : b));
        theirPicks.push({ restaurant: r, scores, blended: mean(fans.map((f) => scores[f.id]!)), by: top.id });
      }
    }
  }

  const byBlend = (a: BlendRow, b: BlendRow) => b.blended - a.blended;
  shared.sort(byBlend);
  tryTogether.sort(byBlend);
  myPicks.sort(byBlend);
  theirPicks.sort(byBlend);
  disagree.sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));

  const minRaters = 2;
  const cuisines = Object.entries(taste)
    .filter(([, t]) => t.raters >= minRaters)
    .map(([cuisine, t]) => ({ cuisine, avg: t.avg, per: t.per, full: t.raters === people.length }))
    .sort((a, b) => Number(b.full) - Number(a.full) || b.avg - a.avg)
    .slice(0, 5)
    .map(({ cuisine, avg, per }) => ({ cuisine, avg, per }));

  return {
    people,
    match,
    pairs,
    overlapCount,
    shared,
    disagree: disagree.slice(0, 3),
    tryTogether: tryTogether.slice(0, 5),
    myPicks: myPicks.slice(0, 4),
    theirPicks: theirPicks.slice(0, 4),
    cuisines,
  };
}

/** Friend ids from a blend id ("maya" or "maya-judy"). Friend ids never contain "-". */
export function parseBlendId(id: string, validIds: string[]) {
  const ids = Array.from(new Set(decodeURIComponent(id).split("-"))).filter((x) => validIds.includes(x));
  return ids.slice(0, 2);
}

export const blendIdFor = (friendIds: string[]) => [...friendIds].sort().join("-");

export function disagreeQuip(row: BlendRow, people: Person[]) {
  const sorted = people
    .filter((p) => row.scores[p.id] !== undefined)
    .sort((a, b) => (row.scores[b.id] ?? 0) - (row.scores[a.id] ?? 0));
  const hi = sorted[0];
  const lo = sorted[sorted.length - 1];
  const name = (p: Person) => (p.id === "me" ? "You" : p.name);
  const is = (p: Person, lower = false) => (p.id === "me" ? (lower ? "you're" : "You're") : `${p.name} is`);
  const gap = row.gap ?? 0;
  if (gap >= 2.5) return `${name(hi)} would fight for this one. ${name(lo)}? Not so much.`;
  if (gap >= 1.5) return `${is(hi)} a fan, ${is(lo, true)} on the fence.`;
  return `A friendly ${gap.toFixed(1)} point debate.`;
}
