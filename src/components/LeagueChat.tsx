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
  reply_to_id: string | null;
  gif_url: string | null;
}

interface ReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
}

// { messageId → { emoji → userId[] } }
type ReactionsMap = Record<string, Record<string, string[]>>;

interface GifResult {
  id: string;
  url: string;
  preview: string;
}

interface Props {
  leagueId: string;
  currentUserId: string;
  currentDisplayName: string;
}

const PRESET_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎯", "🔥", "🏆"];
const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? "dc6zaTOxFJmzC";

function buildReactions(rows: ReactionRow[]): ReactionsMap {
  const map: ReactionsMap = {};
  for (const r of rows) {
    if (!map[r.message_id]) map[r.message_id] = {};
    if (!map[r.message_id][r.emoji]) map[r.message_id][r.emoji] = [];
    if (!map[r.message_id][r.emoji].includes(r.user_id)) {
      map[r.message_id][r.emoji].push(r.user_id);
    }
  }
  return map;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function LeagueChat({ leagueId, currentUserId, currentDisplayName }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<ReactionsMap>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GifResult[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement initial + subscriptions realtime
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const msgRes = await supabase
        .from("league_messages")
        .select("*")
        .eq("league_id", leagueId)
        .order("created_at", { ascending: false })
        .limit(10000);

      if (cancelled) return;
      if (msgRes.error) { setUnavailable(true); return; }

      const msgs = ((msgRes.data ?? []) as Message[]).reverse();
      setMessages(msgs);

      if (msgs.length > 0) {
        const rxRes = await supabase
          .from("league_message_reactions")
          .select("message_id, user_id, emoji")
          .in("message_id", msgs.map(m => m.id));
        if (!cancelled && rxRes.data) {
          setReactions(buildReactions(rxRes.data as ReactionRow[]));
        }
      }
    }

    load();

    // Nouveaux messages
    const msgChannel = supabase
      .channel(`chat:${leagueId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "league_messages",
        filter: `league_id=eq.${leagueId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    // Réactions
    const rxChannel = supabase
      .channel(`reactions:${leagueId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "league_message_reactions",
      }, (payload) => {
        const r = payload.new as ReactionRow;
        setReactions(prev => {
          const msg = prev[r.message_id] ?? {};
          const users = msg[r.emoji] ?? [];
          if (users.includes(r.user_id)) return prev;
          return { ...prev, [r.message_id]: { ...msg, [r.emoji]: [...users, r.user_id] } };
        });
      })
      .on("postgres_changes", {
        event: "DELETE", schema: "public", table: "league_message_reactions",
      }, (payload) => {
        const r = payload.old as ReactionRow;
        setReactions(prev => {
          const msg = prev[r.message_id];
          if (!msg) return prev;
          const filtered = (msg[r.emoji] ?? []).filter(u => u !== r.user_id);
          const newMsg = { ...msg, [r.emoji]: filtered };
          if (filtered.length === 0) delete newMsg[r.emoji];
          return { ...prev, [r.message_id]: newMsg };
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(rxChannel);
    };
  }, [leagueId, supabase]);

  // Scroll vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Recherche GIF
  useEffect(() => {
    if (!gifOpen) return;
    if (gifTimerRef.current) clearTimeout(gifTimerRef.current);
    gifTimerRef.current = setTimeout(async () => {
      setGifLoading(true);
      try {
        const endpoint = gifQuery.trim()
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(gifQuery)}&limit=9&rating=g&lang=fr`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=9&rating=g`;
        const res = await fetch(endpoint);
        const json = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGifResults((json.data ?? []).map((g: any) => ({
          id: g.id,
          url: g.images.original.url,
          preview: g.images.fixed_height_small.url,
        })));
      } catch {
        setGifResults([]);
      }
      setGifLoading(false);
    }, gifQuery ? 400 : 0);
  }, [gifQuery, gifOpen]);

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
      reply_to_id: replyTo?.id ?? null,
    });
    setInput("");
    setReplyTo(null);
    setSending(false);
    notifyLeagueChatMessage(leagueId, currentUserId, currentDisplayName, text).catch(() => {});
  }

  async function sendGif(gif: GifResult) {
    setGifOpen(false);
    setGifQuery("");
    setGifResults([]);
    await supabase.from("league_messages").insert({
      league_id: leagueId,
      user_id: currentUserId,
      display_name: currentDisplayName,
      content: "",
      gif_url: gif.url,
      reply_to_id: replyTo?.id ?? null,
    });
    setReplyTo(null);
    notifyLeagueChatMessage(leagueId, currentUserId, currentDisplayName, "🎬 GIF").catch(() => {});
  }

  async function toggleReaction(messageId: string, emoji: string) {
    setEmojiPickerFor(null);
    const hasReacted = reactions[messageId]?.[emoji]?.includes(currentUserId);
    if (hasReacted) {
      await supabase
        .from("league_message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", currentUserId)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("league_message_reactions")
        .insert({ message_id: messageId, user_id: currentUserId, emoji });
    }
  }

  const msgMap = useMemo(() => new Map(messages.map(m => [m.id, m])), [messages]);

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

      {/* Liste de messages */}
      <div
        className="h-80 overflow-y-auto p-4 flex flex-col gap-2"
        onClick={() => setEmojiPickerFor(null)}
      >
        {messages.length === 0 && (
          <p className="text-gray-400 dark:text-gray-600 text-sm text-center m-auto">
            Aucun message — lancez la discussion !
          </p>
        )}

        {messages.map((msg) => {
          const isMe = msg.user_id === currentUserId;
          const replyMsg = msg.reply_to_id ? msgMap.get(msg.reply_to_id) : null;
          const msgReactions = reactions[msg.id] ?? {};
          const hasReactions = Object.values(msgReactions).some(u => u.length > 0);

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 group ${isMe ? "items-end" : "items-start"}`}
            >
              {/* Nom (autres seulement) */}
              {!isMe && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 font-semibold">
                  {msg.display_name}
                </span>
              )}

              {/* Bulle + tout ce qui est en dessous */}
              <div className="max-w-[80%] flex flex-col gap-0.5">

                {/* Citation de réponse */}
                {replyMsg && (
                  <div className={`text-xs px-2 py-1 rounded-lg border-l-2 mb-0.5 truncate ${
                    isMe
                      ? "bg-brand-700/30 border-brand-400 text-brand-200"
                      : "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-300"
                  }`}>
                    <span className="font-bold">{replyMsg.display_name}</span>
                    <span className="ml-1 opacity-80">{replyMsg.gif_url ? "🎬 GIF" : replyMsg.content}</span>
                  </div>
                )}

                {/* Contenu */}
                {msg.gif_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.gif_url}
                    alt="GIF"
                    className="rounded-2xl max-w-[200px] max-h-[160px] object-cover"
                  />
                ) : (
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
                    isMe
                      ? "bg-brand-600 text-white rounded-tr-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                )}

                {/* Réactions */}
                {hasReactions && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {Object.entries(msgReactions).map(([emoji, users]) => {
                      if (users.length === 0) return null;
                      const isMine = users.includes(currentUserId);
                      return (
                        <button
                          key={emoji}
                          onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }}
                          className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-all active:scale-95 ${
                            isMine
                              ? "bg-brand-100 dark:bg-brand-900/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300"
                              : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-bold">{users.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Heure + boutons d'action sous la bulle */}
                <div className={`flex items-center gap-1.5 mt-0.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-[10px] text-gray-300 dark:text-gray-700">
                    {fmtTime(msg.created_at)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Répondre */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setReplyTo(msg); inputRef.current?.focus(); }}
                      className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-[11px] transition-colors"
                      title="Répondre"
                    >
                      ↩
                    </button>
                    {/* Réagir */}
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id); }}
                        className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-[11px] transition-colors"
                        title="Réagir"
                      >
                        😊
                      </button>
                      {emojiPickerFor === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute bottom-7 z-50 flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-2 ${isMe ? "right-0" : "left-0"}`}
                        >
                          {PRESET_EMOJIS.map(e => (
                            <button
                              key={e}
                              onClick={() => toggleReaction(msg.id, e)}
                              className={`text-lg w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                                reactions[msg.id]?.[e]?.includes(currentUserId) ? "bg-brand-100 dark:bg-brand-900/40" : ""
                              }`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Picker GIF */}
      {gifOpen && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              autoFocus
              type="text"
              value={gifQuery}
              onChange={e => setGifQuery(e.target.value)}
              placeholder="Rechercher un GIF…"
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => { setGifOpen(false); setGifQuery(""); setGifResults([]); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ✕
            </button>
          </div>
          {gifLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="text-xs text-gray-400">Chargement…</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {gifResults.map(gif => (
                <button
                  key={gif.id}
                  onClick={() => sendGif(gif)}
                  className="rounded-xl overflow-hidden hover:opacity-80 transition-opacity active:scale-95"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gif.preview} alt="GIF" className="w-full h-16 object-cover" />
                </button>
              ))}
              {gifResults.length === 0 && (
                <p className="col-span-3 text-xs text-gray-400 dark:text-gray-600 text-center py-4">
                  {gifQuery ? "Aucun GIF trouvé." : "Chargement des GIFs tendance…"}
                </p>
              )}
            </div>
          )}
          <p className="text-[10px] text-gray-300 dark:text-gray-700 text-right mt-1.5">Powered by GIPHY</p>
        </div>
      )}

      {/* Bannière de réponse */}
      {replyTo && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 flex items-center gap-2 bg-brand-50 dark:bg-brand-950/20">
          <span className="text-brand-500 text-sm">↩</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{replyTo.display_name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 truncate inline-block max-w-[200px] align-bottom">
              {replyTo.gif_url ? "🎬 GIF" : replyTo.content}
            </span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-5 h-5 flex items-center justify-center rounded-full text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Zone de saisie */}
      <form onSubmit={send} className="border-t border-gray-100 dark:border-gray-800 p-3 flex gap-2">
        <button
          type="button"
          onClick={() => { setGifOpen(o => !o); setGifQuery(""); }}
          className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
            gifOpen
              ? "bg-brand-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          GIF
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={replyTo ? `Répondre à ${replyTo.display_name}…` : "Votre message…"}
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
