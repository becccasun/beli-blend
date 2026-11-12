"use client";

import { useCallback, useEffect, useState } from "react";

export type SavedBlend = { id: string; createdAt: string };

const KEY = "beli-proposal-blend-v1";
const SEED: SavedBlend[] = [{ id: "maya", createdAt: "2026-11-02" }];

function read(): SavedBlend[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedBlend[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return SEED;
}

/** Saved blends. First render always returns the seed so it matches the server; storage hydrates after mount. */
export function useBlends() {
  const [blends, setBlends] = useState<SavedBlend[]>(SEED);

  useEffect(() => {
    setBlends(read());
  }, []);

  const save = useCallback((id: string) => {
    const next = [{ id, createdAt: new Date().toISOString().slice(0, 10) }, ...read().filter((b) => b.id !== id)];
    setBlends(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const remove = useCallback((id: string) => {
    const next = read().filter((b) => b.id !== id);
    setBlends(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  return { blends, save, remove };
}
