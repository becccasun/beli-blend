"use client";

import { useSyncExternalStore } from "react";
import { blendIdFor } from "@/lib/blend";
import type { Friend } from "@/lib/data";

/**
 * A blend starts as a request. It only becomes a shared list once the other person accepts,
 * and it only shows restaurants once the two of you have picked a city.
 */
export type SavedBlend = {
  id: string; // friend ids joined with "-"
  createdAt: string;
  status: "pending" | "active";
  city?: string;
  note?: string;
  /** Prototype only: when the other side "accepts" a request you sent. */
  acceptAt?: number;
};

export type IncomingRequest = { from: string; note?: string; when: string };

/** follows: only the people whose follow state you changed in this prototype. */
type State = { blends: SavedBlend[]; incoming: IncomingRequest[]; follows: Record<string, boolean> };

const KEY = "beli-proposal-blend-v3";
const ACCEPT_DELAY_MS = 5000;

const SEED: State = {
  blends: [{ id: "maya", createdAt: "2026-11-02", status: "active" }],
  incoming: [{ from: "kate", note: "Back in Ann Arbor next month. Where are we eating?", when: "2 days ago" }],
  follows: {},
};

let state: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (Array.isArray(parsed?.blends) && Array.isArray(parsed?.incoming)) return { ...parsed, follows: parsed.follows ?? {} };
    }
  } catch {}
  return SEED;
}

const get = () => (state ??= read());

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const today = () => new Date().toISOString().slice(0, 10);

export const blendActions = {
  /** Ask one or two people to blend. Returns the blend id. */
  request(friendIds: string[], note?: string) {
    const id = blendIdFor(friendIds);
    const s = get();
    set({
      ...s,
      blends: [
        { id, createdAt: today(), status: "pending", note: note || undefined, acceptAt: Date.now() + ACCEPT_DELAY_MS },
        ...s.blends.filter((b) => b.id !== id),
      ],
    });
    return id;
  },
  /** Withdraw a request, or leave a blend. */
  remove(id: string) {
    const s = get();
    set({ ...s, blends: s.blends.filter((b) => b.id !== id) });
  },
  accept(from: string) {
    const s = get();
    set({
      ...s,
      incoming: s.incoming.filter((r) => r.from !== from),
      blends: [{ id: from, createdAt: today(), status: "active" }, ...s.blends.filter((b) => b.id !== from)],
    });
  },
  decline(from: string) {
    const s = get();
    set({ ...s, incoming: s.incoming.filter((r) => r.from !== from) });
  },
  setFollow(id: string, on: boolean) {
    const s = get();
    set({ ...s, follows: { ...s.follows, [id]: on } });
  },
  setCity(id: string, city: string) {
    const s = get();
    set({ ...s, blends: s.blends.map((b) => (b.id === id ? { ...b, city } : b)) });
  },
  /** Flip any sent requests whose simulated wait is over. Returns the ids that were just accepted. */
  tick() {
    const s = get();
    const now = Date.now();
    const due = s.blends.filter((b) => b.status === "pending" && (b.acceptAt ?? 0) <= now);
    if (!due.length) return [];
    set({
      ...s,
      blends: s.blends.map((b) => (due.includes(b) ? { id: b.id, createdAt: b.createdAt, status: "active", note: b.note } : b)),
    });
    return due.map((b) => b.id);
  },
};

/** Saved blends and requests. The server render and first client render both see the seed. */
export function useBlends() {
  const s = useSyncExternalStore(subscribe, get, () => SEED);
  /** Blending is only for people who follow each other. */
  const isFollowing = (f: Friend) => s.follows[f.id] ?? f.following;
  const isMutual = (f: Friend) => isFollowing(f) && f.followsYou;
  return { ...s, ...blendActions, isFollowing, isMutual };
}
