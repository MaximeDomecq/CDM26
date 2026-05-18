"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

const WC_START = new Date("2026-06-11T19:00:00Z");

type NotifState = "unsupported" | "loading" | "subscribed" | "unsubscribed" | "denied";

interface Props {
  displayName: string;
  favoriteTeam: string | null;
  favoriteTeamFlag: string | null;
  predictedWinner: string | null;
  predictedWinnerFlag: string | null;
  topScorerName: string | null;
  topScorerFlag: string | null;
}

export default function ProfileSettings({
  displayName,
  favoriteTeam, favoriteTeamFlag,
  predictedWinner, predictedWinnerFlag,
  topScorerName, topScorerFlag,
}: Props) {
  const locked = new Date() >= WC_START;
  const { theme, toggle: toggleTheme } = useTheme();

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

  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
          <span className="text-brand-600 dark:text-brand-400 font-black text-2xl">{displayName[0]?.toUpperCase()}</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{displayName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Mon profil</p>
        </div>
      </div>

      {locked && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-5 py-4">
          <span className="text-xl">🔒</span>
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-400 text-sm">Pronostics de tournoi verrouillés</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">Le tournoi a débuté — tes choix ne peuvent plus être modifiés.</p>
          </div>
        </div>
      )}

      {/* Tournament picks */}
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">Pronostics de tournoi</p>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
          <PickRow
            href="/dashboard/profile/equipe"
            icon={favoriteTeamFlag ?? "🏳️"}
            label="Équipe favorite"
            value={favoriteTeam}
            locked={locked}
          />
          <PickRow
            href="/dashboard/profile/vainqueur"
            icon={predictedWinnerFlag ?? "🏆"}
            label="Vainqueur de la Coupe"
            value={predictedWinner}
            locked={locked}
          />
          <PickRow
            href="/dashboard/profile/buteur"
            icon={topScorerFlag ?? "⚽"}
            label="Meilleur buteur"
            value={topScorerName}
            locked={locked}
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">Préférences</p>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
          {/* Dark mode */}
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-xl">{theme === "dark" ? "☀️" : "🌙"}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </span>
            </div>
            <Toggle active={theme === "dark"} />
          </button>

          {/* Notifications */}
          {notifState !== "unsupported" && (
            <button
              onClick={toggleNotif}
              disabled={notifState === "loading" || notifState === "denied"}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{notifState === "subscribed" ? "🔔" : "🔕"}</span>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Notifications</div>
                  {notifState === "denied" && (
                    <div className="text-xs text-red-500">Bloquées dans le navigateur</div>
                  )}
                </div>
              </div>
              <Toggle active={notifState === "subscribed"} loading={notifState === "loading"} />
            </button>
          )}
        </div>
      </div>

      {/* Sign out */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
        >
          <span className="text-xl">🚪</span>
          <span className="text-sm font-medium text-red-500 dark:text-red-400">Déconnexion</span>
        </button>
      </form>
    </div>
  );
}

function PickRow({ href, icon, label, value, locked }: {
  href: string; icon: string; label: string; value: string | null; locked: boolean;
}) {
  const inner = (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="text-xl w-7 text-center">{icon}</span>
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">{label}</div>
          <div className={`text-sm font-semibold ${value ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600 italic"}`}>
            {value ?? "Non défini"}
          </div>
        </div>
      </div>
      {locked
        ? <span className="text-gray-300 dark:text-gray-700 text-sm">🔒</span>
        : <span className="text-gray-300 dark:text-gray-600 text-sm">›</span>
      }
    </div>
  );

  if (locked) return <div className="cursor-default">{inner}</div>;
  return <Link href={href} className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">{inner}</Link>;
}

function Toggle({ active, loading }: { active: boolean; loading?: boolean }) {
  return (
    <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 flex-shrink-0 ${active ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"} ${loading ? "opacity-50" : ""}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? "translate-x-5" : "translate-x-0"}`} />
    </div>
  );
}
