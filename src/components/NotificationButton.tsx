"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

type State = "unsupported" | "loading" | "subscribed" | "unsubscribed" | "denied";

export default function NotificationButton() {
  const [state, setState] = useState<State>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) { setSubscription(sub); setState("subscribed"); }
        else setState("unsubscribed");
      });
    });
  }, []);

  async function subscribe() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("denied"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      setSubscription(sub);
      setState("subscribed");
    } catch {
      setState("unsubscribed");
    }
  }

  async function unsubscribe() {
    if (!subscription) return;
    setState("loading");
    try {
      await fetch("/api/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      setSubscription(null);
      setState("unsubscribed");
    } catch {
      setState("subscribed");
    }
  }

  if (state === "unsupported" || state === "denied") return null;

  return (
    <button
      onClick={state === "subscribed" ? unsubscribe : subscribe}
      disabled={state === "loading"}
      title={state === "subscribed" ? "Désactiver les notifications" : "Activer les notifications"}
      className="px-2 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all text-base disabled:opacity-40 flex-shrink-0"
    >
      {state === "loading" ? (
        <span className="text-xs animate-pulse">…</span>
      ) : state === "subscribed" ? (
        "🔔"
      ) : (
        "🔕"
      )}
    </button>
  );
}
