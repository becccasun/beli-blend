import type { RankedEntry, Sentiment } from "./data";

// Beli buckets every place by sentiment, then spreads scores across that bucket's band
// by rank position. These bands mirror the real app's behaviour closely enough for a demo.
export const BANDS: Record<Sentiment, { min: number; max: number }> = {
  liked: { min: 6.7, max: 10 },
  fine: { min: 3.4, max: 6.6 },
  disliked: { min: 0.5, max: 3.3 },
};

const ORDER: Sentiment[] = ["liked", "fine", "disliked"];

/** Sort best to worst: by sentiment bucket, then by score. */
export function sortRanked(list: RankedEntry[]): RankedEntry[] {
  return [...list].sort(
    (a, b) =>
      ORDER.indexOf(a.sentiment) - ORDER.indexOf(b.sentiment) || b.score - a.score
  );
}

/**
 * Classic Beli behaviour: scores are derived purely from position. Entries rated with
 * method "manual" keep their score as an anchor and compare-ranked entries are
 * interpolated between the anchors (or the band edges) around them.
 */
export function rescore(sorted: RankedEntry[]): RankedEntry[] {
  const out: RankedEntry[] = [];
  for (const s of ORDER) {
    const bucket = sorted.filter((e) => e.sentiment === s);
    const { min, max } = BANDS[s];
    let i = 0;
    while (i < bucket.length) {
      if (bucket[i].method === "manual") {
        out.push({ ...bucket[i], score: clampToBand(bucket[i].score, s) });
        i++;
        continue;
      }
      // run of compare-ranked entries [i, j)
      let j = i;
      while (j < bucket.length && bucket[j].method !== "manual") j++;
      const hi = i === 0 ? max : bucket[i - 1].score;
      const lo = j === bucket.length ? min : bucket[j].score;
      const n = j - i;
      for (let k = 0; k < n; k++) {
        // top of the whole bucket gets the band max, otherwise space evenly inside (hi, lo)
        const t = i === 0 ? k / Math.max(n - (j === bucket.length ? 1 : 0), 1) : (k + 1) / (n + 1);
        let score = Math.round((hi - (hi - lo) * t) * 10) / 10;
        // guards: stay inside the band and never climb above the entry before it
        score = Math.min(max, Math.max(min, score));
        const prev = out.length ? out[out.length - 1] : undefined;
        if (prev && prev.sentiment === s && score > prev.score) score = prev.score;
        out.push({ ...bucket[i + k], score });
      }
      i = j;
    }
  }
  return out;
}

/** Insert an entry at a position inside its sentiment bucket (0 = best) and rescore. */
export function insertAt(
  list: RankedEntry[],
  entry: RankedEntry,
  indexInBucket: number
): RankedEntry[] {
  const sorted = sortRanked(list.filter((e) => e.restaurantId !== entry.restaurantId));
  const before = sorted.filter(
    (e) => ORDER.indexOf(e.sentiment) < ORDER.indexOf(entry.sentiment)
  );
  const bucket = sorted.filter((e) => e.sentiment === entry.sentiment);
  const after = sorted.filter(
    (e) => ORDER.indexOf(e.sentiment) > ORDER.indexOf(entry.sentiment)
  );
  bucket.splice(Math.max(0, Math.min(indexInBucket, bucket.length)), 0, entry);
  return rescore([...before, ...bucket, ...after]);
}

/** Clamp a score into its sentiment band, rounded to one decimal. */
export function clampToBand(score: number, s: Sentiment): number {
  const { min, max } = BANDS[s];
  return Math.round(Math.min(max, Math.max(min, score)) * 10) / 10;
}

/**
 * Insert an entry with a user-chosen score. It lands wherever that score falls and
 * nothing else moves: the rest of the list keeps its scores, so the relative order the
 * user built up stays intact. The score is clamped into the sentiment band.
 */
export function insertManual(list: RankedEntry[], entry: RankedEntry): RankedEntry[] {
  const rest = list.filter((e) => e.restaurantId !== entry.restaurantId);
  return sortRanked([
    ...rest,
    { ...entry, method: "manual", score: clampToBand(entry.score, entry.sentiment) },
  ]);
}

/** Where a manual score would land: 1-based rank plus the neighbours above and below. */
export function manualPreview(list: RankedEntry[], entry: RankedEntry) {
  const next = insertManual(list, entry);
  const i = next.findIndex((e) => e.restaurantId === entry.restaurantId);
  return {
    rank: i + 1,
    total: next.length,
    above: i > 0 ? next[i - 1] : undefined,
    below: i < next.length - 1 ? next[i + 1] : undefined,
    list: next,
  };
}
