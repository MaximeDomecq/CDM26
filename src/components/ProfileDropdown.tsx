"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";

type NotifState = "unsupported" | "loading" | "subscribed" | "unsubscribed" | "denied";

interface Props {
  displayName: string;
  favoriteTeamFlag: string | null;
  favoriteTeam: string | null;
  predictedWinnerFlag: string | null;
  predictedWinner: string | null;
  topScorerName: string | null;
  topScorerFlag: string | null;
}

export default function ProfileDropdown({
  displayName,
  favoriteTeamFlag,
  favoriteTeam,
  predictedWinnerFlag,
  predictedWinner,
  topScorerName,
  topScorerFlag,
}: Props) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Notifications
  const [notifState, setNotifState] = useState<NotifState>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotifState("unsupported"); return;
    }
    if (Notification.permission === "denied") { setNotifState("denied"); return; }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) { setSubscription(sub); setNotifState("subscribed"); }
        else setNotifState("unsubscribed");
      });
    });
  }, []);

  async function toggleNotif() {
    if (notifState === "subscribed" && subscription) {
      setNotifState("loading");
      try {
        await fetch("/api/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
        setSubscription(null); setNotifState("unsubscribed");
      } catch { setNotifState("subscribed"); }
    } else if (notifState === "unsubscribed") {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      setNotifState("loading");
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setNotifState("denied"); return; }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey });
        await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub }) });
        setSubscription(sub); setNotifState("subscribed");
      } catch { setNotifState("unsubscribed"); }
    }
  }

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
        title="Mon profil"
      >
        {favoriteTeamFlag ? (
          <span className="text-base">{favoriteTeamFlag}</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
        <span className="hidden md:block text-xs text-gold-300 font-semibold max-w-[80px] truncate">{displayName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl z-50 overflow-hidden">

          {/* Header */}
          <Link href="/dashboard/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-600 dark:text-brand-400 font-black text-sm">{displayName[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{displayName}</div>
              <div className="text-xs text-brand-500 dark:text-brand-400">Modifier le profil →</div>
            </div>
          </Link>

          {/* Tournament picks */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 space-y-2.5">
            <PickRow
              icon={favoriteTeamFlag ?? "🏳️"}
              label="Équipe favorite"
              value={favoriteTeam}
              href="/dashboard/profile"
              onClose={() => setOpen(false)}
            />
            <PickRow
              icon={predictedWinnerFlag ?? "🏆"}
              label="Vainqueur prédit"
              value={predictedWinner}
              href="/dashboard/profile"
              onClose={() => setOpen(false)}
            />
            <PickRow
              icon={topScorerFlag ?? "⚽"}
              label="Meilleur buteur"
              value={topScorerName}
              href="/dashboard/profile"
              onClose={() => setOpen(false)}
            />
          </div>

          {/* Settings */}
          <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-800">
            {/* Dark mode */}
            <button
              onClick={toggle}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{theme === "dark" ? "☀️" : "🌙"}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </span>
              </div>
              <div className={`w-9 h-5 rounded-full transition-colors ${theme === "dark" ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform shadow-sm ${theme === "dark" ? "translate-x-4.5 ml-0.5" : "ml-0.5"}`} />
              </div>
            </button>

            {/* Notifications */}
            {notifState !== "unsupported" && notifState !== "denied" && (
              <button
                onClick={toggleNotif}
                disabled={notifState === "loading"}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{notifState === "subscribed" ? "🔔" : "🔕"}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Notifications</span>
                </div>
                <div className={`w-9 h-5 rounded-full transition-colors ${notifState === "subscribed" ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform shadow-sm ${notifState === "subscribed" ? "translate-x-4.5 ml-0.5" : "ml-0.5"}`} />
                </div>
              </button>
            )}
          </div>

          {/* Sign out */}
          <div className="px-2 py-2">
            <form ref={formRef} action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
              >
                <span className="text-base">🚪</span>
                <span className="text-sm text-red-500 dark:text-red-400 font-medium">Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PickRow({ icon, label, value, href, onClose }: {
  icon: string; label: string; value: string | null; href: string; onClose: () => void;
}) {
  return (
    <Link href={href} onClick={onClose} className="flex items-center gap-2.5 group">
      <span className="text-lg w-6 text-center flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600 leading-none">{label}</div>
        <div className={`text-xs font-semibold truncate mt-0.5 ${value ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-600 italic"}`}>
          {value ?? "Non défini"}
        </div>
      </div>
    </Link>
  );
}
