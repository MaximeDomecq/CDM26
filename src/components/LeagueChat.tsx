"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { notifyLeagueChatMessage } from "@/app/actions/push";

interface Message {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

interface Props {
  leagueId: string;
  currentUserId: string;
  currentDisplayName: string;
}

export default function LeagueChat({ leagueId, currentUserId, currentDisplayName }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("league_messages")
      .select("*")
      .eq("league_id", leagueId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (error) { setUnavailable(true); return; }
        if (data) setMessages(data as Message[]);
      });

    const channel = supabase
      .channel(`chat:${leagueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "league_messages",
          filter: `league_id=eq.${leagueId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [leagueId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    await supabase.from("league_messages").insert({
      league_id: leagueId,
      user_id: currentUserId,
      display_name: currentDisplayName,
      content: text,
    });
    setInput("");
    setSending(false);
    // Notify other members (fire-and-forget)
    notifyLeagueChatMessage(leagueId, currentUserId, currentDisplayName, text).catch(() => {});
  }

  if (unavailable) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card p-6 text-center text-gray-400 dark:text-gray-600 text-sm">
        💬 Chat non disponible — migration SQL requise.
      </div>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden">
      <div className="bg-wc-header px-5 py-3">
        <h3 className="text-white font-black text-sm">💬 Discussion</h3>
      </div>

      <div className="h-64 overflow-y-auto p-4 flex flex-col gap-2.5">
        {messages.length === 0 && (
          <p className="text-gray-400 dark:text-gray-600 text-sm text-center m-auto">
            Aucun message — lancez la discussion !
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 font-medium">
                    {msg.display_name}
                  </span>
                )}
                <div className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                  isMe
                    ? "bg-brand-600 text-white rounded-tr-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="border-t border-gray-100 dark:border-gray-800 p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Votre message…"
          maxLength={300}
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-black hover:bg-brand-700 transition-all disabled:opacity-40 active:scale-95"
        >
          →
        </button>
      </form>
    </section>
  );
}
