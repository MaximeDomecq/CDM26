import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}

function initVapid() {
  const email = process.env.VAPID_EMAIL;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!email || !pub || !priv) return false;
  webpush.setVapidDetails(`mailto:${email}`, pub, priv);
  return true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

async function sendAndClean(
  subs: { endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload
) {
  const service = getService();
  const body = JSON.stringify(payload);
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch {
        // Remove stale / expired subscriptions
        await service.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    })
  );
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!initVapid() || userIds.length === 0) return;
  const service = getService();
  const { data: subs } = await service
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", userIds);
  if (!subs || subs.length === 0) return;
  await sendAndClean(subs, payload);
}

export async function sendPushToAll(payload: PushPayload) {
  if (!initVapid()) return;
  const service = getService();
  const { data: subs } = await service
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (!subs || subs.length === 0) return;
  await sendAndClean(subs, payload);
}
