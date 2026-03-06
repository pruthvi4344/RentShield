"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchConversationMessages,
  fetchMyConversations,
  fetchUnreadCountsByConversation,
  markConversationAsRead,
  sendConversationMessage,
} from "@/lib/chatService";
import type { ChatConversation, ChatMessage } from "@/types/chat";

type MessagesProps = {
  initialConversationId?: string | null;
};

export default function Messages({ initialConversationId = null }: MessagesProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [inputText, setInputText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const desktopBottomRef = useRef<HTMLDivElement | null>(null);
  const mobileBottomRef = useRef<HTMLDivElement | null>(null);
  const desktopMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileMessagesContainerRef = useRef<HTMLDivElement | null>(null);

  async function refreshConversations(currentUserId: string): Promise<ChatConversation[]> {
    const [conversationData, unreadMap] = await Promise.all([
      fetchMyConversations(currentUserId),
      fetchUnreadCountsByConversation(),
    ]);
    setConversations(conversationData);
    setUnreadByConversation(unreadMap);
    const data = conversationData;
    return data;
  }

  async function refreshMessages(conversationId: string): Promise<ChatMessage[]> {
    const data = await fetchConversationMessages(conversationId);
    setMessages(data);
    return data;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      try {
        setLoadingConversations(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setError("Please login to view messages.");
          return;
        }

        if (cancelled) return;
        setUserId(user.id);

        const data = await refreshConversations(user.id);
        if (cancelled) return;

        setConversations(data);

        const nextId =
          (initialConversationId && data.some((conversation) => conversation.id === initialConversationId) && initialConversationId) ||
          data[0]?.id ||
          null;
        setSelectedConversationId(nextId);
        setMobileView(nextId ? "chat" : "list");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load conversations.");
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations(false);
        }
      }
    }

    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, [initialConversationId]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setError("");
        const data = await fetchConversationMessages(selectedConversationId);
        if (!cancelled) {
          setMessages(data);
        }

        const marked = await markConversationAsRead(selectedConversationId);
        if (marked > 0 && !cancelled && userId) {
          await Promise.all([refreshConversations(userId), refreshMessages(selectedConversationId)]);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load messages.");
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, userId]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      void refreshConversations(userId).catch(() => undefined);
      if (selectedConversationId) {
        void refreshMessages(selectedConversationId).catch(() => undefined);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [userId, selectedConversationId]);

  useEffect(() => {
    const scrollToBottom = (container: HTMLDivElement | null, anchor: HTMLDivElement | null) => {
      if (!container) return;
      container.scrollTop = container.scrollHeight;
      if (anchor) {
        const behavior: ScrollBehavior = loadingMessages ? "auto" : "smooth";
        anchor.scrollIntoView({ behavior, block: "end" });
      }
    };

    scrollToBottom(desktopMessagesContainerRef.current, desktopBottomRef.current);
    if (mobileView === "chat") {
      requestAnimationFrame(() => {
        scrollToBottom(mobileMessagesContainerRef.current, mobileBottomRef.current);
      });
    }
  }, [messages.length, selectedConversationId, loadingMessages, mobileView]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  async function sendMessage() {
    if (!userId || !selectedConversationId || !inputText.trim()) {
      return;
    }

    try {
      setSending(true);
      setError("");

      await sendConversationMessage(selectedConversationId, userId, inputText);
      setInputText("");

      await Promise.all([refreshMessages(selectedConversationId), refreshConversations(userId)]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function openConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setMobileView("chat");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Messages</h2>
        <p className="text-sm text-slate-500 mt-0.5">Secure chat with landlords and renters.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden md:h-[600px] h-[70vh] min-h-[480px]">
        <div className="hidden md:flex h-full">
          <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <input
                type="text"
                placeholder="Conversations"
                readOnly
                className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <p className="px-4 py-3 text-sm text-slate-500">Loading conversations...</p>
              ) : conversations.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">No conversations yet. Click Contact from a listing.</p>
              ) : (
                conversations.map((conversation) => {
                  const isRenter = conversation.renter_id === userId;
                  const peerName = isRenter ? conversation.landlord_username : conversation.renter_username;
                  const isActive = selectedConversationId === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => openConversation(conversation.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-50 ${
                        isActive ? "bg-teal-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {peerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold truncate ${isActive ? "text-teal-700" : "text-slate-900"}`}>
                            {peerName}
                          </span>
                          <span className="text-xs text-slate-400 flex-shrink-0 ml-1">
                            {new Date(conversation.last_message_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">Secure chat</p>
                      </div>
                      {(unreadByConversation[conversation.id] ?? 0) > 0 && (
                        <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center px-1.5">
                          {unreadByConversation[conversation.id]}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col h-full min-w-0">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
              {selectedConversation ? (
                <>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(selectedConversation.renter_id === userId
                      ? selectedConversation.landlord_username
                      : selectedConversation.renter_username
                    )
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedConversation.renter_id === userId
                        ? selectedConversation.landlord_username
                        : selectedConversation.renter_username}
                    </p>
                    <p className="text-xs text-slate-500">Secure chat</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Select a conversation</p>
              )}
            </div>

            <div ref={desktopMessagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50">
              {loadingMessages ? (
                <p className="text-sm text-slate-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages yet.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${msg.sender_id === userId ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender_id === userId
                            ? "bg-teal-500 text-white rounded-br-sm"
                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {msg.body}
                      </div>
                      <span className="text-xs text-slate-400 px-1 flex items-center gap-1">
                        {new Date(msg.created_at).toLocaleString()}
                        {msg.sender_id === userId && (
                          <span className={`font-semibold ${msg.read_at ? "text-teal-500" : "text-slate-400"}`}>
                            {msg.read_at ? "✓✓" : "✓"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={desktopBottomRef} />
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  disabled={!selectedConversation}
                  placeholder={selectedConversation ? "Type a message..." : "Select a conversation first"}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors disabled:opacity-60"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={!selectedConversation || sending || !inputText.trim()}
                  className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden h-full">
          {mobileView === "list" ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <p className="px-4 py-3 text-sm text-slate-500">Loading conversations...</p>
                ) : conversations.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">No conversations yet. Click Contact from a listing.</p>
                ) : (
                  conversations.map((conversation) => {
                    const isRenter = conversation.renter_id === userId;
                    const peerName = isRenter ? conversation.landlord_username : conversation.renter_username;
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => openConversation(conversation.id)}
                        className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-50 hover:bg-slate-50"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {peerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate text-slate-900">{peerName}</span>
                            <span className="text-xs text-slate-400 ml-1">
                              {new Date(conversation.last_message_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">Secure chat</p>
                        </div>
                        {(unreadByConversation[conversation.id] ?? 0) > 0 && (
                          <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center px-1.5">
                            {unreadByConversation[conversation.id]}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setMobileView("list")}
                  className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700"
                >
                  Back
                </button>
                {selectedConversation ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                      {(selectedConversation.renter_id === userId
                        ? selectedConversation.landlord_username
                        : selectedConversation.renter_username
                      )
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedConversation.renter_id === userId
                        ? selectedConversation.landlord_username
                        : selectedConversation.renter_username}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a conversation</p>
                )}
              </div>

              <div ref={mobileMessagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/50">
                {loadingMessages ? (
                  <p className="text-sm text-slate-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] flex flex-col gap-1 ${msg.sender_id === userId ? "items-end" : "items-start"}`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            msg.sender_id === userId
                              ? "bg-teal-500 text-white rounded-br-sm"
                              : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm"
                          }`}
                        >
                          {msg.body}
                        </div>
                        <span className="text-[11px] text-slate-400 px-1 flex items-center gap-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {msg.sender_id === userId && (
                            <span className={`font-semibold ${msg.read_at ? "text-teal-500" : "text-slate-400"}`}>
                              {msg.read_at ? "✓✓" : "✓"}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={mobileBottomRef} />
              </div>

              <div className="px-3 py-3 border-t border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    disabled={!selectedConversation}
                    placeholder={selectedConversation ? "Type a message..." : "Select a conversation first"}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors disabled:opacity-60"
                  />
                  <button
                    onClick={() => void sendMessage()}
                    disabled={!selectedConversation || sending || !inputText.trim()}
                    className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
