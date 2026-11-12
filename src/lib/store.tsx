"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialRanked, type RankedEntry } from "./data";
import { sortRanked } from "./scoring";

type Store = {
  ranked: RankedEntry[]; // always sorted best to worst
  setRanked: (next: RankedEntry[]) => void;
  getEntry: (restaurantId: string) => RankedEntry | undefined;
  rankOf: (restaurantId: string) => number; // 1-based, 0 if unranked
  toast: string | null;
  showToast: (msg: string) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);
const KEY = "beli-proposal-ranked-v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ranked, setRankedState] = useState<RankedEntry[]>(sortRanked(initialRanked));
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRankedState(sortRanked(JSON.parse(raw)));
    } catch {}
  }, []);

  const setRanked = useCallback((next: RankedEntry[]) => {
    const sorted = sortRanked(next);
    setRankedState(sorted);
    try {
      localStorage.setItem(KEY, JSON.stringify(sorted));
    } catch {}
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const reset = useCallback(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("beli-proposal"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    setRankedState(sortRanked(initialRanked));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ranked,
      setRanked,
      getEntry: (id) => ranked.find((e) => e.restaurantId === id),
      rankOf: (id) => ranked.findIndex((e) => e.restaurantId === id) + 1,
      toast,
      showToast,
      reset,
    }),
    [ranked, setRanked, toast, showToast, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
