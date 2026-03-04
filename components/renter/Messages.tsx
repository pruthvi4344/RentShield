"use client";

import { useState } from "react";

const conversations = [
  {
    id: 1,
    name: "James T.",
    role: "Landlord",
    avatar: "JT",
    color: "from-teal-400 to-cyan-500",
    lastMessage: "The unit is available from July 1st. Would you like to schedule a viewing?",
    time: "2h ago",
    unread: 1,
    property: "Downtown Condo, Toronto",
  },
  {
    id: 2,
    name: "Raj P.",
    role: "Landlord",
    avatar: "RP",
    color: "from-amber-400 to-orange-400",
    lastMessage: "Yes, all utilities are included in the price.",
    time: "5h ago",
    unread: 0,
    property: "Private Room, Waterloo",
  },
  {
    id: 3,
    name: "Kim Lee",
    role: "Roommate",
    avatar: "KL",
    color: "from-violet-400 to-purple-500",
    lastMessage: "That sounds great! I'm also looking for a place near UofT 😊",
    time: "1d ago",
    unread: 1,
    property: "Roommate Match",
  },
  {
    id: 4,
    name: "Marie L.",
    role: "Landlord",
    avatar: "ML",
    color: "from-rose-400 to-pink-500",
    lastMessage: "Sure, feel free to come by on Saturday at 2PM.",
    time: "3d ago",
    unread: 0,
    property: "Basement, Montréal",
  },
];

const chatMessages: Record<number, { from: "me" | "them"; text: string; time: string }[]> = {
  1: [
    { from: "them", text: "Hi! I saw you were interested in the condo on Spadina Ave.", time: "Yesterday" },
    { from: "me", text: "Yes! I'm an international student arriving in September. Is the unit still available?", time: "Yesterday" },
    { from: "them", text: "Great to hear! Yes it is. When are you looking to move in?", time: "Yesterday" },
    { from: "me", text: "September 1st would be ideal. Is that possible?", time: "2h ago" },
    { from: "them", text: "The unit is available from July 1st. Would you like to schedule a viewing?", time: "2h ago" },
  ],
  2: [
    { from: "me", text: "Hello Raj, does the private room include utilities?", time: "6h ago" },
    { from: "them", text: "Yes, all utilities are included in the price.", time: "5h ago" },
  ],
  3: [
    { from: "them", text: "Hey! I saw your profile on the roommate finder. We seem like a good match!", time: "Yesterday" },
    { from: "me", text: "Hi Kim! Yes, I'm also looking near UofT for September.", time: "Yesterday" },
    { from: "them", text: "That sounds great! I'm also looking for a place near UofT 😊", time: "1d ago" },
  ],
  4: [
    { from: "me", text: "Hi Marie, is it possible to visit the basement on the weekend?", time: "4d ago" },
    { from: "them", text: "Sure, feel free to come by on Saturday at 2PM.", time: "3d ago" },
  ],
};

export default function Messages() {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [inputText, setInputText] = useState("");
  const [localMessages, setLocalMessages] = useState(chatMessages);

  const selected = conversations.find((c) => c.id === selectedId)!;
  const messages = localMessages[selectedId] || [];

  function sendMessage() {
    if (!inputText.trim()) return;
    setLocalMessages((prev) => ({
      ...prev,
      [selectedId]: [
        ...prev[selectedId],
        { from: "me", text: inputText.trim(), time: "Just now" },
      ],
    }));
    setInputText("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Messages</h2>
        <p className="text-sm text-slate-500 mt-0.5">Secure chats with landlords and potential roommates.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: "600px" }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-50 ${
                    selectedId === conv.id ? "bg-teal-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${conv.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {conv.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold truncate ${selectedId === conv.id ? "text-teal-700" : "text-slate-900"}`}>
                        {conv.name}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{conv.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-0.5">{conv.role} · {conv.property}</p>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${selected.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {selected.avatar}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.role} · {selected.property}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-xs text-slate-400">Secure chat</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md ${msg.from === "me" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.from === "me"
                        ? "bg-teal-500 text-white rounded-br-sm"
                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-xs text-slate-400 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                />
                <button
                  onClick={sendMessage}
                  className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1 justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                End-to-end encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}