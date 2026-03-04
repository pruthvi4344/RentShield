"use client";

import { useState } from "react";

const convos = [
  { id: 1, name: "Priya Kumar", initials: "PK", color: "from-violet-400 to-purple-500", role: "Renter", property: "Downtown Condo, Toronto", lastMsg: "Is the parking spot included with the unit?", time: "1h ago", unread: 2 },
  { id: 2, name: "Omar Mahmoud", initials: "OM", color: "from-teal-400 to-cyan-500", role: "Renter", property: "Private Room, Waterloo", lastMsg: "Yes, all utilities are included.", time: "4h ago", unread: 0 },
  { id: 3, name: "Yuna Kim", initials: "YK", color: "from-rose-400 to-pink-500", role: "Renter", property: "Downtown Condo, Toronto", lastMsg: "Can I schedule a viewing this weekend?", time: "Yesterday", unread: 1 },
  { id: 4, name: "Lucas Silva", initials: "LS", color: "from-emerald-400 to-teal-500", role: "Renter", property: "Downtown Condo, Toronto", lastMsg: "Thank you for the quick response!", time: "3d ago", unread: 0 },
];

const chatHistory: Record<number, { from: "me" | "them"; text: string; time: string }[]> = {
  1: [
    { from: "them", text: "Hi James! I'm really interested in your Downtown Condo listing.", time: "Yesterday" },
    { from: "me", text: "Hi Priya! Thanks for reaching out. What would you like to know?", time: "Yesterday" },
    { from: "them", text: "Is the unit still available for September 1st?", time: "3h ago" },
    { from: "me", text: "Yes, it's available from August 15th onwards.", time: "2h ago" },
    { from: "them", text: "Is the parking spot included with the unit?", time: "1h ago" },
  ],
  2: [
    { from: "them", text: "Hello! Does the private room include all utilities?", time: "5h ago" },
    { from: "me", text: "Yes, all utilities are included.", time: "4h ago" },
  ],
  3: [
    { from: "them", text: "Hello James! I'm a PhD student at UofT and your condo looks perfect.", time: "Yesterday" },
    { from: "me", text: "Thanks Yuna! Happy to schedule a viewing.", time: "Yesterday" },
    { from: "them", text: "Can I schedule a viewing this weekend?", time: "Yesterday" },
  ],
  4: [
    { from: "them", text: "Hi, I saw your listing and wanted to ask a few questions.", time: "4d ago" },
    { from: "me", text: "Sure! Ask away.", time: "4d ago" },
    { from: "them", text: "Thank you for the quick response!", time: "3d ago" },
  ],
};

export default function Messages() {
  const [selectedId, setSelectedId] = useState(1);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState(chatHistory);

  const selected = convos.find(c => c.id === selectedId)!;
  const messages = msgs[selectedId] || [];

  function send() {
    if (!input.trim()) return;
    setMsgs(prev => ({ ...prev, [selectedId]: [...prev[selectedId], { from: "me", text: input.trim(), time: "Just now" }] }));
    setInput("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Messages</h2>
        <p className="text-sm text-slate-500 mt-0.5">Secure chat with your renters.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" style={{ height: "600px" }}>
        <div className="flex h-full">
          {/* Convo list */}
          <div className="w-72 flex-shrink-0 border-r border-slate-100 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100">
              <input type="text" placeholder="Search messages..." className="w-full pl-3 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {convos.map(c => (
                <button key={c.id} onClick={() => setSelectedId(c.id)} className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors border-b border-slate-50 ${selectedId === c.id ? "bg-teal-50" : "hover:bg-slate-50"}`}>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{c.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold truncate ${selectedId === c.id ? "text-teal-700" : "text-slate-900"}`}>{c.name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{c.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-0.5">{c.role} · {c.property}</p>
                    <p className="text-xs text-slate-500 truncate">{c.lastMsg}</p>
                  </div>
                  {c.unread > 0 && <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">{c.unread}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${selected.color} flex items-center justify-center text-white text-xs font-bold`}>{selected.initials}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.role} · {selected.property}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-xs text-slate-400">Secure chat</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${m.from === "me" ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.from === "me" ? "bg-teal-500 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-sm"}`}>{m.text}</div>
                    <span className="text-xs text-slate-400 px-1">{m.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
                <button onClick={send} className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1 justify-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                End-to-end encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}