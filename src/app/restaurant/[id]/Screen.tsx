"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  ChevronLeft,
  CirclePlus,
  Ellipsis,
  Globe,
  Lock,
  MapPin,
  Navigation,
  Phone,
  Share,
} from "lucide-react";
import { BASE, fmtScore, friendRatings, friends, restaurantById, timeAgo } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar, PrimaryButton } from "@/components/ui";
import RankSheet from "@/components/rank/RankSheet";

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const r = restaurantById(id);
  const { getEntry, rankOf } = useStore();
  const entry = getEntry(r.id);
  const [open, setOpen] = useState(false);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => setRoot(document.getElementById("phone-root")), []);

  const raters = friends.filter((f) => friendRatings[f.id]?.[r.id] !== undefined);
  const photos = [r.photo, `${BASE}/food/f6.jpg`, `${BASE}/food/f8.jpg`].filter((p, i, a) => a.indexOf(p) === i);

  return (
    <div className="pb-8">
      {/* map hero */}
      <div
        className="relative h-[230px]"
        style={{
          background:
            "linear-gradient(115deg, transparent 46%, #fff 46.5%, #fff 48%, transparent 48.5%), linear-gradient(20deg, transparent 60%, #fff 60.5%, #fff 62%, transparent 62.5%), linear-gradient(160deg, transparent 30%, #fff 30.5%, #fff 31.5%, transparent 32%), radial-gradient(circle at 78% 30%, #cfe6c9 0 16%, transparent 17%), radial-gradient(circle at 18% 72%, #d6ead0 0 13%, transparent 14%), #ecefe9",
        }}
      >
        <div className="flex items-center justify-between px-3 pt-2">
          <button aria-label="Back" onClick={() => router.back()} className="p-1">
            <ChevronLeft size={28} strokeWidth={2.2} />
          </button>
          <div className="flex items-center gap-4 pr-1">
            <Share size={22} strokeWidth={1.8} />
            <Ellipsis size={24} />
          </div>
        </div>
        <MapPin size={26} className="absolute left-1/2 top-[86px] -translate-x-1/2 fill-ink-3 text-white" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        <h1 className="absolute bottom-3 left-4 right-28 font-serif text-[32px] font-bold leading-[1.05]">
          {r.name}
        </h1>
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {entry ? (
            <>
              <button
                onClick={() => setOpen(true)}
                className="rounded-full bg-[#e3e3de] px-3 py-1.5 text-[13px] font-medium"
              >
                Rank again
              </button>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-good text-good">
                <Check size={16} strokeWidth={3} />
              </span>
            </>
          ) : (
            <>
              <button aria-label="Rank this place" onClick={() => setOpen(true)}>
                <CirclePlus size={30} strokeWidth={1.6} />
              </button>
              <Bookmark size={28} strokeWidth={1.6} />
            </>
          )}
        </div>
      </div>

      <div className="px-4">
        <div className="no-scrollbar mt-2 flex gap-1 overflow-x-auto whitespace-nowrap text-[14px] font-semibold text-teal">
          {r.tags.join(" · ")}
        </div>
        <div className="mt-1 text-[15px]">
          {r.price} | {r.cuisines.join(", ")}
        </div>
        <div className="text-[15px] text-ink-3">
          {r.hood}, {r.city}
        </div>

        <div className="mt-3 flex gap-2">
          {[
            { l: "Website", i: Globe },
            { l: "Call", i: Phone },
            { l: "Directions", i: Navigation },
          ].map(({ l, i: Icon }) => (
            <span
              key={l}
              className="flex h-8 items-center gap-1.5 rounded-full border border-teal px-3 text-[14px] font-medium text-teal"
            >
              <Icon size={15} /> {l}
            </span>
          ))}
        </div>

        <h2 className="mt-4 text-[17px] font-bold">Scores</h2>
        <div className="no-scrollbar -mx-4 mt-2 flex gap-5 overflow-x-auto px-4">
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="relative flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[#cfcfcf] text-[16px] font-semibold text-good">
              {entry ? fmtScore(entry.score) : <Lock size={18} className="text-ink-3" />}
              <span className="absolute -bottom-1 -right-1 rounded-full bg-teal px-1 text-[8px] font-bold text-white">
                You
              </span>
            </span>
            <div className="text-[12.5px] leading-tight">
              <div className="text-[14px] font-bold">Your Beli Rating</div>
              {entry ? (
                <>
                  <b>#{rankOf(r.id)}</b> on your Been list
                  <br />
                  <span className="text-ink-3">
                    {entry.method === "manual" ? "Scored by you" : "From comparisons"} ·{" "}
                    {timeAgo(entry.visitedAt)}
                  </span>
                </>
              ) : (
                <span className="text-ink-3">
                  Rank it to unlock
                  <br />
                  your score
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="relative flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[#cfcfcf] text-[16px] font-semibold text-good">
              {fmtScore(r.friendScore)}
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[9px] font-bold text-white">
                {raters.length}
              </span>
            </span>
            <div className="text-[12.5px] leading-tight">
              <div className="text-[14px] font-bold">Friend Score</div>
              What your
              <br />
              <b>friends</b> think
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[#cfcfcf] text-[16px] font-semibold text-good">
              {fmtScore(r.recScore)}
            </span>
            <div className="text-[12.5px] leading-tight">
              <div className="text-[14px] font-bold">Rec Score</div>
              How much we
              <br />
              think you will like it
            </div>
          </div>
        </div>

        {!entry && (
          <PrimaryButton className="mt-4" onClick={() => setOpen(true)}>
            Rank this place
          </PrimaryButton>
        )}

        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold">Popular dishes</h2>
          <span className="text-[15px] font-semibold text-teal">See all photos</span>
        </div>
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={p} alt="" className="h-[120px] w-[150px] shrink-0 rounded-lg object-cover" />
          ))}
        </div>

        {raters.length > 0 && (
          <>
            <h2 className="mt-5 text-[17px] font-bold">Friends who have been</h2>
            <div className="mt-2 flex flex-col gap-2.5">
              {raters.map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <Avatar src={f.avatar} size={36} />
                  <span className="flex-1 text-[14.5px]">
                    <b>{f.name}</b> <span className="text-ink-3">{f.handle}</span>
                  </span>
                  <span className="text-[15px] font-semibold text-good">
                    {fmtScore(friendRatings[f.id][r.id])}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {root &&
        createPortal(
          <RankSheet restaurantId={r.id} open={open} onClose={() => setOpen(false)} />,
          root
        )}
    </div>
  );
}
