// Pure blend math. No React, no storage: everything takes plain rating maps so it is easy to test.
import { cities, restaurants, type Restaurant } from "./data";

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

/**
 * What kind of place someone goes for, beyond cuisine. Each trait gathers a few of the tags
 * (and cuisine labels) restaurants carry, so "Cocktails" also hears wine bars and breweries.
 */
export const TRAITS = [
  { id: "date", label: "Date night", tags: ["Date Night", "Special Occasion", "Tasting Menu", "Fine Dining"] },
  { id: "sharing", label: "Sharing", tags: ["Small Plates", "Tapas", "Groups"] },
  { id: "drinks", label: "Cocktails", tags: ["Cocktails", "Wine", "Wine Bar", "Beer", "Brewery", "Margaritas", "BYOB"] },
  { id: "casual", label: "Casual", tags: ["Casual", "Quick Bite", "Walk In", "Late Night"] },
  { id: "brunch", label: "Brunch", tags: ["Brunch", "Breakfast", "Coffee", "Cafe"] },
  { id: "sweet", label: "Sweets", tags: ["Dessert", "Donuts", "Cookies", "Pie", "Pastries", "Ice Cream", "Bakery"] },
] as const;

/** Average score per trait for one person. Traits they have never rated are left out. */
export function traitAverages(ratings: Record<string, number>, pool: Restaurant[] = restaurants) {
  const out: Record<string, number> = {};
  for (const t of TRAITS) {
    const scores: number[] = [];
    for (const r of pool) {
      const s = ratings[r.id];
      if (s === undefined) continue;
      if ([...r.tags, ...r.cuisines].some((x) => (t.tags as readonly string[]).includes(x))) scores.push(s);
    }
    if (scores.length) out[t.id] = mean(scores);
  }
  return out;
}

/** How closely two sets of averages agree, 0..100, over the keys both have. Null when none are shared. */
function agreement(a: Record<string, number>, b: Record<string, number>) {
  const keys = Object.keys(a).filter((k) => k in b);
  if (!keys.length) return null;
  const mad = mean(keys.map((k) => Math.abs(a[k] - b[k])));
  return Math.round(clamp(100 - 22 * mad, 20, 99));
}

export type MatchParts = {
  places: number | null; // same restaurants, similar scores
  vibe: number | null; // same kinds of place rated high
  cuisine: number | null; // same cuisines rated high
};

/**
 * Pairwise taste match, 0..100, from three signals:
 *  - places:  over restaurants both ranked, 100 - 20 * mean absolute difference
 *  - vibe:    agreement across TRAITS (date night, sharing, cocktails, casual...)
 *  - cuisine: agreement across cuisines
 * Places earn up to half the weight, growing with overlap (n / (n + 2)). The rest is split
 * 60/40 between vibe and cuisine, so two people with nothing in common still get a real number.
 */
export function pairMatch(a: Record<string, number>, b: Record<string, number>) {
  const shared = Object.keys(a).filter((k) => k in b);
  const n = shared.length;
  const places = n ? Math.round(clamp(100 - 20 * mean(shared.map((k) => Math.abs(a[k] - b[k]))), 20, 99)) : null;
  const vibe = agreement(traitAverages(a), traitAverages(b));
  const cuisine = agreement(cuisineAverages(a), cuisineAverages(b));
  const parts: MatchParts = { places, vibe, cuisine };

  const wPlaces = places === null ? 0 : 0.5 * (n / (n + 2));
  const taste =
    vibe !== null && cuisine !== null ? 0.6 * vibe + 0.4 * cuisine : vibe ?? cuisine ?? 60;
  const match = Math.round(clamp(wPlaces * (places ?? 0) + (1 - wPlaces) * taste, 20, 99));
  return { match, overlap: n, parts };
}

/** Group match = mean of every pair. */
export function groupMatch(people: Person[], ratings: RatingMap) {
  const pairs: { a: string; b: string; match: number; overlap: number; parts: MatchParts }[] = [];
  for (let i = 0; i < people.length; i++)
    for (let j = i + 1; j < people.length; j++) {
      const m = pairMatch(ratings[people[i].id] ?? {}, ratings[people[j].id] ?? {});
      pairs.push({ a: people[i].id, b: people[j].id, ...m });
    }
  const part = (k: keyof MatchParts) => {
    const xs = pairs.map((p) => p.parts[k]).filter((x): x is number => x !== null);
    return xs.length ? Math.round(mean(xs)) : null;
  };
  const parts: MatchParts = { places: part("places"), vibe: part("vibe"), cuisine: part("cuisine") };
  return { match: Math.round(mean(pairs.map((p) => p.match))), pairs, parts };
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
  parts: MatchParts;
  pairs: { a: string; b: string; match: number; overlap: number }[];
  overlapCount: number;
  traits: { id: string; label: string; per: Record<string, number> }[]; // traits at least two people have rated
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
  const { match, pairs, parts } = groupMatch(people, ratings);
  const perTrait = people.map((p) => traitAverages(ratings[p.id] ?? {}));
  const traits = TRAITS.map((t) => {
    const per: Record<string, number> = {};
    people.forEach((p, i) => {
      if (t.id in perTrait[i]) per[p.id] = perTrait[i][t.id];
    });
    return { id: t.id as string, label: t.label as string, per };
  }).filter((t) => Object.keys(t.per).length >= 2);
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
    .slice(0, 4)
    .map(({ cuisine, avg, per }) => ({ cuisine, avg, per }));

  return {
    people,
    match,
    parts,
    pairs,
    overlapCount,
    traits,
    shared,
    disagree: disagree.slice(0, 3),
    tryTogether: tryTogether.slice(0, 5),
    myPicks: myPicks.slice(0, 4),
    theirPicks: theirPicks.slice(0, 4),
    cuisines,
  };
}

/**
 * What a group has in common in one city. Blend never picks the city (it cannot know where
 * people will be) and says nothing about who lives where; it only counts shared places.
 */
export type CityOption = {
  city: string;
  common: number; // places everyone has ranked
  counts: Record<string, number>; // personId -> places ranked in this city
};

export function cityOptions(people: Person[], ratings: RatingMap, pool: Restaurant[] = restaurants): CityOption[] {
  const total = (o: CityOption) => Object.values(o.counts).reduce((x, y) => x + y, 0);
  return cities
    .map((city) => {
      const here = pool.filter((r) => r.city === city);
      const counts: Record<string, number> = {};
      for (const p of people) counts[p.id] = here.filter((r) => ratings[p.id]?.[r.id] !== undefined).length;
      const common = here.filter((r) => people.every((p) => ratings[p.id]?.[r.id] !== undefined)).length;
      return { city, common, counts };
    })
    .sort((a, b) => b.common - a.common || total(b) - total(a));
}

export const commonLabel = (n: number) => (n ? `${n} ${n === 1 ? "place" : "places"} in common` : "");

export const cityPool = (city: string, pool: Restaurant[] = restaurants) => pool.filter((r) => r.city === city);

/**
 * The one place to lead with for a chosen city. Somewhere new to everyone first, then a
 * favourite one side has not tried, then a place you already agree on.
 */
export function startHere(result: BlendResult) {
  if (result.tryTogether[0]) return { row: result.tryTogether[0], predicted: true };
  const row = result.theirPicks[0] ?? result.myPicks[0] ?? result.shared[0];
  return row ? { row, predicted: false } : null;
}

/** Lightweight preview for a profile, before any blend exists. */
export const teaser = (a: Record<string, number>, b: Record<string, number>) => pairMatch(a, b);

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
