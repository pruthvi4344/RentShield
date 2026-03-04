"use client";

import { useState } from "react";

type ReqStatus = "pending" | "accepted" | "rejected";

const initialRequests = [
  { id: 1, name: "Priya Kumar", initials: "PK", color: "from-violet-400 to-purple-500", university: "University of Toronto", country: "India", budget: "$900–$1,400/mo", moveIn: "Sept 2026", property: "Downtown Condo, Toronto", message: "Hi James! I'm a Masters student at UofT arriving in September. Your condo looks perfect. I'm verified on RentShield and can provide reference letters.", verified: true, status: "pending" as ReqStatus },
  { id: 2, name: "Omar Mahmoud", initials: "OM", color: "from-teal-400 to-cyan-500", university: "University of Waterloo", country: "Egypt", budget: "$700–$950/mo", moveIn: "Aug 2026", property: "Private Room, Waterloo", message: "Hello! I'm an engineering student looking for a clean, quiet room near UW. I'm tidy and respectful. Would love to discuss further.", verified: true, status: "pending" as ReqStatus },
  { id: 3, name: "Yuna Kim", initials: "YK", color: "from-rose-400 to-pink-500", university: "University of Toronto", country: "South Korea", budget: "$900–$1,200/mo", moveIn: "Sept 2026", property: "Downtown Condo, Toronto", message: "I'm a PhD student in Psychology. Very quiet and organized. I've been living independently for 3 years. Happy to share more details!", verified: true, status: "accepted" as ReqStatus },
];

export default function TenantRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [expanded, setExpanded] = useState<number | null>(null);

  function updateStatus(id: number, status: ReqStatus) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const pending = requests.filter(r => r.status === "pending");
  const reviewed = requests.filter(r => r.status !== "pending");

  const Card = ({ r }: { r: typeof requests[0] }) => (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${r.status === "pending" ? "border-slate-100 hover:shadow-md" : r.status === "accepted" ? "border-emerald-100" : "border-slate-100 opacity-70"}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0 shadow-md`}>
            {r.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900">{r.name}</h3>
                  {r.verified && (
                    <span className="inline-flex items-center gap-0.5 text-teal-500 text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Verified Renter
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">from {r.country} · {r.university}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${r.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" : r.status === "accepted" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-slate-600">
              <div><p className="text-slate-400">Budget</p><p className="font-semibold">{r.budget}</p></div>
              <div><p className="text-slate-400">Move-in</p><p className="font-semibold">{r.moveIn}</p></div>
              <div><p className="text-slate-400">Property</p><p className="font-semibold truncate">{r.property}</p></div>
            </div>

            {/* Message preview */}
            <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">Message:</p>
              <p className={`text-xs text-slate-700 leading-relaxed ${expanded !== r.id ? "line-clamp-2" : ""}`}>{r.message}</p>
              {r.message.length > 120 && (
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-xs text-teal-600 font-semibold mt-1">
                  {expanded === r.id ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            {/* Actions */}
            {r.status === "pending" && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => updateStatus(r.id, "accepted")} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Accept
                </button>
                <button onClick={() => updateStatus(r.id, "rejected")} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Decline
                </button>
                <button className="flex-1 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl border border-teal-200 transition-colors flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Message
                </button>
              </div>
            )}
            {r.status !== "pending" && (
              <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2">
                <button className="px-4 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-100 transition-colors">Message Renter</button>
                {r.status === "accepted" && <button onClick={() => updateStatus(r.id, "rejected")} className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg border border-slate-200 transition-colors">Revoke</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Tenant Requests</h2>
        <p className="text-sm text-slate-500 mt-0.5">{pending.length} pending request{pending.length !== 1 ? "s" : ""}</p>
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Awaiting Response</p>
          <div className="space-y-4">{pending.map(r => <Card key={r.id} r={r} />)}</div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 mt-2">Reviewed</p>
          <div className="space-y-4">{reviewed.map(r => <Card key={r.id} r={r} />)}</div>
        </div>
      )}
    </div>
  );
}