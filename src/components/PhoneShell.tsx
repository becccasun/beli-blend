"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, Newspaper, Plus, Trophy, Signal, Wifi, BatteryFull } from "lucide-react";
import { StoreProvider, useStore } from "@/lib/store";
import { useEffect } from "react";
import { friendById, me } from "@/lib/data";
import { blendActions } from "./blend/storage";
import { SkeletonStyles } from "./skeleton";
import { Avatar } from "./ui";

const tabs = [
  { href: "/", label: "Feed", icon: Newspaper },
  { href: "/lists", label: "Your Lists", icon: List },
  { href: "/search", label: "Search", icon: Plus, center: true },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: null },
];

function TabBar() {
  const path = usePathname();
  return (
    <nav className="relative z-30 flex h-[78px] shrink-0 items-start justify-around border-t border-line bg-white px-1 pt-2">
      {tabs.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex w-[70px] flex-col items-center gap-0.5 text-[10px] ${
              active ? "font-bold text-ink" : "font-medium text-ink-2"
            }`}
          >
            {t.center ? (
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-teal text-white">
                <Plus size={18} strokeWidth={2} />
              </span>
            ) : Icon ? (
              <Icon size={24} strokeWidth={active ? 2.2 : 1.6} />
            ) : (
              <Avatar
                src={me.avatar}
                size={26}
                className={active ? "border-2 border-ink" : ""}
              />
            )}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="animate-sheet-up pointer-events-none absolute inset-x-2 top-12 z-[70] rounded-xl bg-[#1d2a2e] px-4 py-3 text-[14px] font-medium text-white shadow-lg">
      {toast}
    </div>
  );
}

/** Prototype stand-in for the other person: sent blend requests get accepted after a few seconds. */
function BlendWatcher() {
  const { showToast } = useStore();
  useEffect(() => {
    const t = setInterval(() => {
      for (const id of blendActions.tick()) {
        const names = id.split("-").map((x) => friendById(x).name).join(" and ");
        showToast(`${names} accepted. You're paired.`);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [showToast]);
  return null;
}

export default function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {/* Just the screen: phone sized on desktop, full bleed on a real phone. */}
      <div className="flex h-dvh justify-center bg-white">
        <div
          id="phone-root"
          className="relative flex h-full max-h-[852px] w-full max-w-[393px] flex-col overflow-hidden bg-white"
        >
          <div className="relative z-40 hidden h-[44px] shrink-0 items-center justify-between bg-white px-7 pt-1 text-[15px] font-semibold sm:flex">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <Signal size={15} strokeWidth={2.6} />
              <Wifi size={15} strokeWidth={2.6} />
              <BatteryFull size={22} strokeWidth={2} />
            </span>
          </div>
          <main id="phone-scroll" className="no-scrollbar relative flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <TabBar />
          <Toast />
          <BlendWatcher />
          <SkeletonStyles />
        </div>
      </div>
    </StoreProvider>
  );
}
