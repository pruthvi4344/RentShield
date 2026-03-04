"use client";

import { Tab } from "./RenterSidebar";

interface Props {
  onNavigate: (tab: Tab) => void;
  userName?: string;
}

const statCards = [
  {
    label: "Saved Listings",
    value: "4",
    change: "+1 this week",
    positive: true,
    tab: "saved" as Tab,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    label: "Roommate Matches",
    value: "3",
    change: "New matches available",
    positive: true,
    tab: "roommate" as Tab,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    label: "Unread Messages",
    value: "2",
    change: "1 from landlord",
    positive: false,
    tab: "messages" as Tab,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    label: "Verification",
    value: "Verified",
    change: "Identity confirmed",
    positive: true,
    tab: "verification" as Tab,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
];

const recentActivity = [
  { icon: "🏠", text: "You saved a listing in Toronto, ON", time: "2h ago", type: "save" },
  { icon: "💬", text: "James T. replied to your message", time: "5h ago", type: "message" },
  { icon: "✅", text: "Your identity verification was approved", time: "1d ago", type: "verify" },
  { icon: "👥", text: "3 new roommate matches found near UofT", time: "2d ago", type: "roommate" },
  { icon: "🏠", text: "New listing added in Waterloo matching your filters", time: "3d ago", type: "listing" },
];

const recommendedListings = [
  {
    city: "Toronto, ON",
    type: "Private Room",
    price: 950,
    match: 96,
    near: "Near UofT",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&q=70",
  },
  {
    city: "Waterloo, ON",
    type: "Shared Apartment",
    price: 750,
    match: 91,
    near: "Near UW",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&q=70",
  },
  {
    city: "Toronto, ON",
    type: "Basement",
    price: 1100,
    match: 87,
    near: "Spadina Area",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=300&q=70",
  },
];

export default function DashboardOverview({ onNavigate, userName }: Props) {
  const firstName = (userName || "Renter").split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 rounded-2xl p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Verified Renter
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1 tracking-tight">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-slate-300 text-sm max-w-lg">
            You have <span className="text-teal-300 font-semibold">2 unread messages</span> and <span className="text-teal-300 font-semibold">3 new roommate matches</span> waiting for you.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={() => onNavigate("listings")}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-md"
            >
              Browse Listings
            </button>
            <button
              onClick={() => onNavigate("messages")}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/20 transition-colors"
            >
              View Messages
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.tab)}
            className={`bg-white rounded-2xl p-4 border ${card.border} hover:shadow-md transition-all duration-200 text-left group`}
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <p className="text-xl font-extrabold text-slate-900">{card.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{card.label}</p>
            <p className={`text-xs mt-1 font-medium ${card.positive ? "text-teal-600" : "text-amber-600"}`}>
              {card.change}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="text-lg flex-shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-relaxed">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended listings */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Recommended for You
            </h2>
            <button onClick={() => onNavigate("listings")} className="text-xs text-teal-600 font-semibold hover:text-teal-700">
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {recommendedListings.map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <img src={l.image} alt={l.city} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">${l.price}/mo</p>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{l.type}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{l.near} · {l.city}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span className="text-xs font-bold text-teal-700">{l.match}% match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety tips */}
      <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-lg">
            🛡️
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Rental Safety Reminders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                "Never wire money before viewing a property in person or on video call.",
                "Always confirm landlord identity through RentShield's verification badge.",
                "If a deal seems too good to be true, report it using the flag button.",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
