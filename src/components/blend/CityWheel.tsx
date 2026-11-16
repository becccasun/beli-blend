"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A drum of cities: drag, flick or scroll and it settles on one, the rest shrinking and fading
 * as they turn away. Adapted from Bencho's Picker wheel (bencho.dev) to take its own rows and
 * report the choice. It loops, so it never runs out.
 */
export type WheelItem = { value: string; label: string; note?: string };

const H = 216;
const PITCH = 44;
const PILL_H = 40;
const PILL_PAD = 16;
const R = 118; // drum radius: lower bends harder

const mod = (a: number, b: number) => ((a % b) + b) % b;

const rowStyle = (d: number) => {
  const a = d / R;
  if (Math.abs(a) >= Math.PI / 2) return { transform: "translate(-50%, -50%) scale(0)", opacity: "0" };
  const c = Math.cos(a);
  const near = Math.max(0, 1 - Math.abs(d) / PITCH);
  const ink = near + (1 - near) * 0.5 * Math.pow(c, 1.4);
  return {
    transform:
      `translate(-50%, -50%) translateY(${R * Math.sin(a)}px) ` +
      `perspective(300px) rotateX(${-a}rad) scale(${0.8 + 0.2 * c})`,
    opacity: ink.toFixed(3),
  };
};

export function CityWheel({
  items,
  value,
  onChange,
}: {
  items: WheelItem[];
  value?: string;
  onChange: (value: string) => void;
}) {
  const N = items.length;
  const start = Math.max(0, items.findIndex((i) => i.value === value)) * PITCH;
  const root = useRef<HTMLDivElement>(null);
  const s = useRef({ pos: start, to: start });
  const held = useRef<{ y: number; t: number; v: number; moved: number } | null>(null);
  const idle = useRef(0);
  const rows = useRef(new Map<number, HTMLDivElement>());
  const last = useRef(Math.round(start / PITCH));
  const [pick, setPick] = useState(last.current);
  const [pillW, setPillW] = useState(0);
  const [base, setBase] = useState(last.current);
  const changed = useRef(onChange);
  useEffect(() => {
    changed.current = onChange;
  });

  const snap = (from = s.current.to) => {
    s.current.to = Math.round(from / PITCH) * PITCH;
  };

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(3, (now - prev) / 16.67);
      prev = now;
      const st = s.current;
      if (!held.current) st.pos += (st.to - st.pos) * (1 - Math.pow(1 - 0.16, dt));
      if (!held.current && now - idle.current > 140 && st.to % PITCH !== 0) snap();

      rows.current.forEach((el, i) => {
        const r = rowStyle(i * PITCH - st.pos);
        el.style.transform = r.transform;
        el.style.opacity = r.opacity;
      });

      const idx = Math.round(st.pos / PITCH);
      if (idx !== last.current) {
        last.current = idx;
        setPick(mod(idx, N));
        setBase(idx);
        changed.current(items[mod(idx, N)].value);
      }
      const w = rows.current.get(idx)?.offsetWidth;
      if (w) setPillW((p) => (p === w + PILL_PAD * 2 ? p : w + PILL_PAD * 2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  // Native and not passive, so the sheet behind does not scroll too.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      s.current.to += e.deltaY * 0.5;
      idle.current = performance.now();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    held.current = { y: e.clientY, t: performance.now(), v: 0, moved: 0 };
    s.current.to = s.current.pos;
  };
  const move = (e: React.PointerEvent) => {
    const h = held.current;
    if (!h) return;
    const now = performance.now();
    const dy = e.clientY - h.y;
    const dt = Math.max(1, now - h.t) / 16.67;
    s.current.pos -= dy;
    s.current.to = s.current.pos;
    held.current = { y: e.clientY, t: now, v: h.v * 0.5 + (-dy / dt) * 0.5, moved: h.moved + Math.abs(dy) };
  };
  const up = (e: React.PointerEvent) => {
    const h = held.current;
    if (!h) return;
    held.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    // A press that never moved is a pick: roll to the row under it.
    if (h.moved < 4) {
      const r = e.currentTarget.getBoundingClientRect();
      const fromMid = e.clientY - r.top - H / 2;
      const arc = Math.asin(Math.max(-0.99, Math.min(0.99, fromMid / R))) * R;
      snap(s.current.pos + arc);
      return;
    }
    const v = performance.now() - h.t > 90 ? 0 : h.v;
    snap(s.current.pos + v * 10);
  };

  const step = (n: number) => {
    s.current.to = Math.round(s.current.to / PITCH + n) * PITCH;
  };

  return (
    <div
      ref={root}
      className="city-wheel"
      tabIndex={0}
      role="listbox"
      aria-label="City"
      aria-activedescendant={`city-opt-${pick}`}
      style={{ height: H }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          step(1);
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          step(-1);
        }
      }}
    >
      <style>{`
        .city-wheel { position: relative; width: 100%; user-select: none; touch-action: none; cursor: grab; outline: none; overflow: hidden;
          mask-image: linear-gradient(transparent, #000 18%, #000 82%, transparent); }
        .city-wheel:active { cursor: grabbing; }
        .city-wheel-pill { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 999px;
          background: var(--teal-tint); transition: width 220ms cubic-bezier(0.22, 1, 0.36, 1); }
        .city-wheel:focus-visible .city-wheel-pill { box-shadow: 0 0 0 2px var(--teal); }
        .city-wheel-row { position: absolute; left: 50%; top: 50%; display: flex; align-items: baseline; gap: 8px; white-space: nowrap;
          will-change: transform, opacity; pointer-events: none; }
        .city-wheel-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); margin: 0; padding: 0; }
      `}</style>
      <div className="city-wheel-pill" style={{ width: pillW, height: PILL_H, opacity: pillW ? 1 : 0 }} aria-hidden="true" />
      <div aria-hidden="true">
        {[-3, -2, -1, 0, 1, 2, 3].map((o) => {
          const i = base + o;
          const it = items[mod(i, N)];
          const r = rowStyle(i * PITCH - s.current.pos);
          return (
            <div
              key={i}
              className="city-wheel-row"
              ref={(el) => {
                if (el) rows.current.set(i, el);
                else rows.current.delete(i);
              }}
              style={{ lineHeight: `${PILL_H}px`, transform: r.transform, opacity: r.opacity }}
            >
              <span className="text-[18px] font-bold text-ink">{it.label}</span>
              {it.note && <span className="text-[13px] font-semibold text-teal">{it.note}</span>}
            </div>
          );
        })}
      </div>
      <ul className="city-wheel-sr">
        {items.map((it, i) => (
          <li key={it.value} id={`city-opt-${i}`} role="option" aria-selected={i === pick}>
            {it.label}
            {it.note ? `, ${it.note}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
