"use client";

import { LandlordTab } from "./LandlordSidebar";
import type { UserActivityRecord } from "@/types/activity";
import type { LandlordDashboardStat, LandlordListingPerformanceItem, LandlordPricingInsight } from "@/lib/landlordDashboardService";
import type { LandlordTrustScore } from "@/lib/landlordTrustService";

interface Props {
  onNavigate: (tab: LandlordTab) => void;
  userName?: string;
  unreadMessages?: number;
  trustScore?: LandlordTrustScore;
  stats?: LandlordDashboardStat;
  activities?: UserActivityRecord[];
  topListings?: LandlordListingPerformanceItem[];
  pricingInsight?: LandlordPricingInsight;
}

function formatRelativeTime(dateString: string): string {
  const deltaMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(1, Math.floor(deltaMs / (1000 * 60)));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function activityIcon(type: UserActivityRecord["type"]): string {
  switch (type) {
    case "message_received":
      return "\u{1F4AC}";
    case "verification_approved":
      return "\u2705";
    case "listing_saved":
      return "\u{1F4BE}";
    case "roommate_request_received":
      return "\u{1F465}";
    case "roommate_request_accepted":
      return "\u{1F44D}";
    case "roommate_request_rejected":
      return "\u26A0\uFE0F";
    case "roommate_request_expired":
      return "\u{1F514}";
    default:
      return "\u2022";
  }
}

export default function LandlordDashboard({
  onNavigate,
  userName,
  unreadMessages = 0,
  trustScore,
  stats,
  activities = [],
  topListings = [],
  pricingInsight = null,
}: Props) {
  const firstName = (userName || "Landlord").split(" ")[0];
  const trust = trustScore ?? {
    score: 0,
    label: "New",
    summary: "Based on verification, listing quality, and response time",
    breakdown: {
      verification: 0,
      profile: 0,
      listings: 0,
      responsiveness: 0,
    },
  };

  const dashboardStats = stats ?? {
    totalListings: 0,
    activeListings: 0,
    rentedListings: 0,
    totalViews: 0,
    totalInquiries: 0,
    unreadMessages,
  };

  const statCards = [
    {
      label: "Total Listings",
      value: dashboardStats.totalListings.toLocaleString(),
      sub: `${dashboardStats.activeListings} active \u00B7 ${dashboardStats.rentedListings} rented`,
      tab: "listings" as LandlordTab,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
    },
    {
      label: "Property Views",
      value: dashboardStats.totalViews.toLocaleString(),
      sub: dashboardStats.totalViews > 0 ? "Across all listings" : "No views yet",
      tab: "analytics" as LandlordTab,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      label: "Renter Messages",
      value: dashboardStats.unreadMessages.toLocaleString(),
      sub: dashboardStats.unreadMessages > 0 ? `${dashboardStats.unreadMessages} unread today` : "All caught up",
      tab: "messages" as LandlordTab,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Tenant Requests",
      value: dashboardStats.totalInquiries.toLocaleString(),
      sub: dashboardStats.totalInquiries > 0 ? "Across all listings" : "No renter inquiries yet",
      tab: "requests" as LandlordTab,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      border: "border-cyan-100",
    },
  ];

  return (
    <div className="space-y-6">
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
              Welcome back, {firstName}!
            </h1>
            {unreadMessages > 0 ? (
              <p className="text-slate-300 text-sm">
                You have <span className="text-teal-300 font-semibold">{unreadMessages} unread message{unreadMessages === 1 ? "" : "s"}</span>.
              </p>
            ) : null}
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-6 py-4 flex-shrink-0 sm:min-w-[280px]">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-semibold">Landlord Trust Score</p>
            <div className="flex items-end justify-between gap-3">
              <span className="text-4xl font-extrabold text-emerald-400">{trust.score}%</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-xs font-semibold">{trust.label}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-1.5 rounded-full" style={{ width: `${trust.score}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{trust.summary}</p>
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

      <div className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-rose-800">{"\u26A0\uFE0F"} Suspicious Activity Detected</p>
          <p className="text-xs text-rose-600 mt-0.5">An unverified user contacted you about your listing outside the RentShield platform. We recommend only communicating within RentShield&apos;s secure chat.</p>
        </div>
        <button className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex-shrink-0 mt-0.5">Dismiss</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <button key={s.label} onClick={() => onNavigate(s.tab)} className={`bg-white rounded-2xl p-4 border ${s.border} hover:shadow-md transition-all duration-200 text-left group`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>{s.icon}</div>
            <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</p>
            <p className="text-xs text-teal-600 font-medium mt-1">{s.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Recent Activity
          </h2>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-500">No recent activity yet</p>
              </div>
            ) : activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="text-base flex-shrink-0">{activityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-relaxed">{activity.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Listing Performance
            </h2>
            <button onClick={() => onNavigate("listings")} className="text-xs text-teal-600 font-semibold hover:text-teal-700">View all {"\u2192"}</button>
          </div>
          <div className="space-y-3">
            {topListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-500">No listing performance data yet</p>
              </div>
            ) : topListings.map((listing) => (
              <div key={listing.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                {listing.cover_photo_url ? (
                  <img src={listing.cover_photo_url} alt={listing.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 flex-shrink-0">No photo</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{listing.title}</p>
                  <p className="text-xs text-slate-500">${Number(listing.monthly_rent).toLocaleString()}/mo {"\u00B7"} {listing.views_count} views {"\u00B7"} {listing.inquiries_count} inquiries</p>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${listing.status === "active" ? "bg-emerald-100 text-emerald-700" : listing.status === "rented" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"}`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>
            ))}
          </div>

          {pricingInsight && (
            <div className="mt-4 bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-start gap-3">
              <span className="text-lg">{"\u{1F4CA}"}</span>
              <div>
                <p className="text-xs font-bold text-teal-900">Recommended Pricing {"\u2014"} {pricingInsight.city}</p>
                <p className="text-sm font-semibold text-teal-700 mt-0.5">${pricingInsight.minRent.toLocaleString()} {"\u2013"} ${pricingInsight.maxRent.toLocaleString()} / month</p>
                <p className="text-xs text-teal-600 mt-0.5">Based on {pricingInsight.listingCount} listing{pricingInsight.listingCount === 1 ? "" : "s"} in your portfolio</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
