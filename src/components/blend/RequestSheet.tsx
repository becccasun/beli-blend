"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Shuffle } from "lucide-react";
import { me, type Friend } from "@/lib/data";
import { AvatarStack, PrimaryButton } from "@/components/ui";
import { namesOf, usePortalTarget } from "./parts";

const STARTERS = ["We should grab food", "Curious how our tastes compare", "Help me pick a spot"];

/**
 * The ask. Deliberately light: no city, no date. Those are decided together once the other
 * person says yes.
 */
export function RequestSheet({
  friends,
  onClose,
  onSend,
}: {
  friends: Friend[];
  onClose: () => void;
  onSend: (note: string) => void;
}) {
  const target = usePortalTarget();
  const [note, setNote] = useState("");
  if (!target) return null;
  const names = namesOf(friends);
  return createPortal(
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="animate-fade-in absolute inset-0 bg-black/40" />
      <div className="animate-sheet-up relative max-h-[88%] overflow-y-auto rounded-t-[20px] bg-white px-4 pb-8 pt-3">
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-line" />
        <div className="flex flex-col items-center text-center">
          <AvatarStack srcs={[me.avatar, ...friends.map((f) => f.avatar)]} size={60} />
          <div className="mt-3 font-serif text-[24px] font-bold leading-tight text-ink">Pair up with {names}?</div>
          <p className="mt-1 text-[14px] leading-snug text-ink-2">
            Once {friends.length > 1 ? "they accept" : `${names} accepts`}, you both get places you&apos;d both love.
          </p>
        </div>

        <div className="mt-5 text-[12px] font-bold uppercase tracking-[0.08em] text-ink">Add a note (optional)</div>
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
          {STARTERS.map((t) => (
            <button
              key={t}
              onClick={() => setNote(t)}
              className={`h-[30px] shrink-0 rounded-full border px-3 text-[13px] font-medium ${
                note === t ? "border-teal bg-teal-tint text-teal" : "border-[#cfcfcf] text-ink-2"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
          placeholder="Say hi"
          aria-label="Note"
          className="mt-2 h-[44px] w-full rounded-[12px] bg-fill px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-3"
        />

        <PrimaryButton className="mt-4" onClick={() => onSend(note.trim())}>
          <span className="inline-flex items-center gap-2">
            <Shuffle size={16} />
            Send request
          </span>
        </PrimaryButton>
      </div>
    </div>,
    target
  );
}
