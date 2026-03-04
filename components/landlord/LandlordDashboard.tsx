"use client";

import { LandlordTab } from "./LandlordSidebar";

interface Props {
  onNavigate: (tab: LandlordTab) => void;
  userName?: string;
}

const stats = [
  { label: "Total Listings", value: "3", sub: "2 active · 1 rented", tab: "listings" as LandlordTab, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  { label: "Property Views", value: "347", sub: "+23 today", tab: "analytics" as LandlordTab, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
  { label: "Renter Messages", value: "5", sub: "2 unread today", tab: "messages" as LandlordTab, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  { label: "Tenant Requests", value: "2", sub: "Awaiting review", tab: "requests" as LandlordTab, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" },
];

const activity = [
  { icon: "💬", text: "Priya K. sent a message about your Toronto condo", time: "1h ago", type: "message" },
  { icon: "✅", text: "Your Waterloo listing was approved by RentShield", time: "3h ago", type: "approved" },
  { icon: "👁️", text: "Your downtown condo was viewed 12 times today", time: "5h ago", type: "view" },
  { icon: "📋", text: "New tenant request from Omar M. for the private room", time: "Yesterday", type: "request" },
  { icon: "🔔", text: "Your identity verification was confirmed", time: "2d ago", type: "verify" },
];

const listingPerformance = [
  { title: "Downtown Condo, Toronto", price: 2200, views: 143, inquiries: 7, status: "active", img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&q=70" },
  { title: "Private Room, Waterloo", price: 850, views: 98, inquiries: 4, status: "active", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&q=70" },
  { title: "Basement Suite, Montréal", price: 1100, views: 106, inquiries: 5, status: "rented", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&q=70" },
];

export default function LandlordDashboard({ onNavigate, userName }: Props) {
  const firstName = (userName || "Landlord").split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 rounded-2xl p-6 sm:p-8">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Verified Landlord
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-1 tracking-tight">
              Welcome back, {firstName}! 🏠
            </h1>
            <p className="text-slate-300 text-sm">
              You have <span className="text-teal-300 font-semibold">2 tenant requests</span> and <span className="text-teal-300 font-semibold">5 unread messages</span>.
            </p>
          </div>
          {/* Trust Score */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-6 py-4 flex-shrink-0">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-semibold">Landlord Trust Score</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-emerald-400">92%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-1.5 rounded-full" style={{ width: "92%" }} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Based on verification, reviews & response time</p>
          </div>
        </div>
        <div className="relative flex flex-wrap gap-3 mt-5">
          <button onClick={() => onNavigate("add-property")} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-md">
            + Add Property
          </button>
          <button onClick={() => onNavigate("requests")} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/20 transition-colors">
            View Requests
          </button>
        </div>
      </div>

      {/* Fraud alert */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-rose-800">⚠️ Suspicious Activity Detected</p>
          <p className="text-xs text-rose-600 mt-0.5">An unverified user contacted you about your Waterloo listing outside the RentShield platform. We recommend only communicating within RentShield&apos;s secure chat.</p>
        </div>
        <button className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex-shrink-0 mt-0.5">Dismiss</button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => onNavigate(s.tab)} className={`bg-white rounded-2xl p-4 border ${s.border} hover:shadow-md transition-all duration-200 text-left group`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>{s.icon}</div>
            <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
            <p className="text-xs text-teal-600 font-medium mt-1">{s.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="text-base flex-shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-relaxed">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Listing performance */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Listing Performance
            </h2>
            <button onClick={() => onNavigate("listings")} className="text-xs text-teal-600 font-semibold hover:text-teal-700">View all →</button>
          </div>
          <div className="space-y-3">
            {listingPerformance.map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                <img src={l.img} alt={l.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{l.title}</p>
                  <p className="text-xs text-slate-500">${l.price.toLocaleString()}/mo · {l.views} views · {l.inquiries} inquiries</p>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${l.status === "active" ? "bg-emerald-100 text-emerald-700" : l.status === "rented" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}>
                  {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing suggestion */}
          <div className="mt-4 bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
            <span className="text-lg">📊</span>
            <div>
              <p className="text-xs font-bold text-teal-900">Recommended Pricing — Toronto</p>
              <p className="text-sm font-semibold text-teal-700 mt-0.5">$1,950 – $2,400 / month</p>
              <p className="text-xs text-teal-600 mt-0.5">Based on 47 similar listings in your area this week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
