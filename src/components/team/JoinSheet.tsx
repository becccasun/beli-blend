"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, User, Users, X } from "lucide-react";
import { friends, me } from "@/lib/data";
import type { Challenge, Team } from "@/lib/team";
import { Avatar, PrimaryButton } from "@/components/ui";

const suggestName = (ch: Challenge, ids: string[]) => {
  const first = friends.find((f) => f.id === ids[0])?.name;
  if (ids.length === 1 && first) return `You + ${first}`;
  const word = ch.title.split(" ")[0];
  return `${word} Squad`;
};

export function JoinSheet({
  challenge,
  onClose,
  onJoin,
}: {
  challenge: Challenge;
  onClose: () => void;
  onJoin: (team: Team) => void;
}) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [step, setStep] = useState<"mode" | "friends">("mode");
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");

  useEffect(() => setRoot(document.getElementById("phone-root")), []);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));

  const base = {
    challengeId: challenge.id,
    startedAt: "2026-11-12",
    myRated: [],
    friendRated: {},
    nudged: [],
    order: [],
  };

  const goSolo = () => onJoin({ ...base, mode: "solo", name: "Just you", memberIds: [], status: "active" });
  const sendInvites = () =>
    onJoin({
      ...base,
      mode: "team",
      name: name.trim() || suggestName(challenge, picked),
      memberIds: picked,
      status: "pending",
    });

  if (!root) return null;
  return createPortal(
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Close" onClick={onClose} className="animate-fade-in absolute inset-0 bg-black/40" />
      <div className="animate-sheet-up relative max-h-[88%] overflow-y-auto rounded-t-[20px] bg-white px-4 pb-8 pt-3">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" />
        <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 p-1 text-ink-3">
          <X size={20} />
        </button>

        <div className="text-center text-[12px] font-bold uppercase tracking-[0.08em] text-ink-3">Join challenge</div>
        <h2 className="mt-1 text-center font-serif text-[22px] font-bold">{challenge.title}</h2>

        {step === "mode" ? (
          <div className="mt-5 space-y-3">
            <button onClick={goSolo} className="flex w-full items-center gap-3 rounded-2xl border border-line p-4 text-left">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fill text-ink">
                <User size={20} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold">Go solo</span>
                <span className="block text-[13px] text-ink-2">Classic challenge, just your rankings.</span>
              </span>
            </button>
            <button
              onClick={() => setStep("friends")}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-teal bg-teal-tint p-4 text-left"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal text-white">
                <Users size={20} />
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold text-teal">Team up</span>
                <span className="block text-[13px] text-ink-2">
                  Tag team the list with 1 to 3 friends. Everyone rates, you get a team score.
                </span>
              </span>
              <span className="rounded-full bg-teal px-2 py-0.5 text-[11px] font-bold text-white">NEW</span>
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-semibold">Pick your team</span>
              <span className="text-[13px] text-ink-3">{picked.length} of 3</span>
            </div>
            <div className="mt-2 divide-y divide-line">
              {friends.map((f) => {
                const on = picked.includes(f.id);
                const full = !on && picked.length >= 3;
                return (
                  <button
                    key={f.id}
                    onClick={() => toggle(f.id)}
                    disabled={full}
                    className={`flex w-full items-center gap-3 py-2.5 text-left ${full ? "opacity-40" : ""}`}
                  >
                    <Avatar src={f.avatar} size={40} />
                    <span className="flex-1">
                      <span className="block text-[15px] font-semibold">{f.name}</span>
                      <span className="block text-[12px] text-ink-3">
                        {f.handle} · {f.been} been
                      </span>
                    </span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        on ? "border-teal bg-teal text-white" : "border-line"
                      }`}
                    >
                      {on && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>

            {picked.length > 0 && (
              <div className="animate-fade-in mt-4">
                <label className="text-[13px] font-semibold text-ink-2" htmlFor="team-name">
                  Team name (optional)
                </label>
                <input
                  id="team-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={suggestName(challenge, picked)}
                  className="mt-1 h-11 w-full rounded-xl border border-line px-3 text-[15px] outline-none focus:border-teal"
                />
                <div className="mt-3 flex items-center gap-2 text-[13px] text-ink-2">
                  <Avatar src={me.avatar} size={24} />
                  {picked.map((id) => (
                    <Avatar key={id} src={friends.find((f) => f.id === id)!.avatar} size={24} />
                  ))}
                  <span>{picked.length + 1} diners</span>
                </div>
              </div>
            )}

            <PrimaryButton className="mt-5" disabled={picked.length === 0} onClick={sendInvites}>
              Send invites
            </PrimaryButton>
            <button onClick={() => setStep("mode")} className="mt-2 w-full py-2 text-[14px] font-medium text-ink-2">
              Back
            </button>
          </div>
        )}
      </div>
    </div>,
    root
  );
}
