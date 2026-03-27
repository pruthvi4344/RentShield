"use client";

import type { UserActivityRecord, UserActivityType } from "@/types/activity";
import type { RecommendedListingMatch } from "@/lib/recommendationService";
import { Tab } from "./RenterSidebar";

interface Props {
  onNavigate: (tab: Tab) => void;
  userName?: string;
  unreadCount?: number;
  roommateMatchCount?: number;
  savedListingsCount?: number;
  recentActivities?: UserActivityRecord[];
  recommendedListings?: RecommendedListingMatch[];
}

function getWelcomeMessage(unreadCount: number, matchCount: number): string {
  if (unreadCount > 0 && matchCount > 0) {
    return `You have ${unreadCount} unread messages and ${matchCount} new roommate matches waiting for you.`;
  }

  if (unreadCount > 0) {
    return `You have ${unreadCount} unread messages waiting for you.`;
  }

  if (matchCount > 0) {
    return `You have ${matchCount} new roommate matches waiting for you.`;
  }

  return "";
}

function renderHighlightedWelcomeMessage(message: string) {
  if (!message) {
    return null;
  }

  const segments = message.split(/(\d+)/g);
  return segments.map((segment, index) => {
    if (/^\d+$/.test(segment)) {
      return (
        <span key={`${segment}-${index}`} className="font-semibold text-teal-300">
          {segment}
        </span>
      );
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function getActivityIcon(type: UserActivityType): string {
  switch (type) {
    case "listing_saved":
      return "\uD83C\uDFE0";
    case "message_received":
      return "\uD83D\uDCAC";
    case "verification_approved":
      return "\u2705";
    case "roommate_request_received":
      return "\uD83D\uDC65";
    case "roommate_request_accepted":
      return "\uD83C\uDF89";
    case "roommate_request_rejected":
      return "\u26A0\uFE0F";
    case "roommate_request_expired":
      return "\u23F3";
    default:
      return "\u2022";
  }
}

function formatRelativeTime(value: string): string {
  const createdAt = new Date(value).getTime();
  const diffMs = Date.now() - createdAt;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "Just now";
  }

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes}m ago`;
  }

  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `${hours}h ago`;
  }

  if (diffMs < day * 2) {
    return "Yesterday";
  }

  const days = Math.floor(diffMs / day);
  return `${days}d ago`;
}

export default function DashboardOverview({
  onNavigate,
  userName,
  unreadCount = 0,
  roommateMatchCount = 0,
  savedListingsCount = 0,
  recentActivities = [],
  recommendedListings = [],
}: Props) {
  const firstName = (userName || "Renter").split(" ")[0];
  const welcomeMessage = getWelcomeMessage(unreadCount, roommateMatchCount);

  const statCards = [
    {
      label: "Saved Listings",
      value: String(savedListingsCount),
      change: savedListingsCount > 0 ? "Properties saved" : "No saved listings yet",
      positive: savedListingsCount > 0,
      tab: "saved" as Tab,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      ),
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      label: "Roommate Matches",
      value: String(roommateMatchCount),
      change: roommateMatchCount > 0 ? "New matches available" : "No new matches yet",
      positive: roommateMatchCount > 0,
      tab: "roommate" as Tab,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
    },
    {
      label: "Unread Messages",
      value: String(unreadCount),
      change: unreadCount > 0 ? "Messages waiting for you" : "All caught up",
      positive: unreadCount === 0,
      tab: "messages" as Tab,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-teal-500/15 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
            Verified Renter
          </div>
          <h1 className="mb-1 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Welcome back, {firstName}! {"\uD83D\uDC4B"}
          </h1>
          {welcomeMessage ? <p className="max-w-lg text-sm text-slate-300">{renderHighlightedWelcomeMessage(welcomeMessage)}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("listings")}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-400"
            >
              Browse Listings
            </button>
            <button
              onClick={() => onNavigate("messages")}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              View Messages
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.tab)}
            className={`group rounded-2xl border bg-white p-4 text-left transition-all duration-200 hover:shadow-md ${card.border}`}
          >
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.color} transition-transform group-hover:scale-110`}>
              {card.icon}
            </div>
            <p className="text-xl font-extrabold text-slate-900">{card.value}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{card.label}</p>
            <p className={`mt-1 text-xs font-medium ${card.positive ? "text-teal-600" : "text-amber-600"}`}>{card.change}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <svg className="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Recent Activity
          </h2>
          {recentActivities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-600">No recent activity</p>
              <p className="mt-1 text-xs text-slate-400">Your saves, messages, and verification updates will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 border-b border-slate-50 py-2 last:border-0">
                  <span className="flex-shrink-0 text-lg">{getActivityIcon(activity.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-slate-700">{activity.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatRelativeTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <svg className="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Recommended for You
            </h2>
            <button onClick={() => onNavigate("listings")} className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              View all {"\u2192"}
            </button>
          </div>
          {recommendedListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-600">No strong matches yet</p>
              <p className="mt-1 text-xs text-slate-400">Add your move-to city, budget, move-in date, and room type to improve recommendations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedListings.map((listing) => (
                <div
                  key={listing.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
                  onClick={() => onNavigate("listings")}
                >
                  <img
                    src={listing.image ?? "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&q=70"}
                    alt={listing.city}
                    className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">${listing.price}/mo</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{listing.type}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {listing.neighbourhood} {"\u00B7"} {listing.city}
                    </p>
                    <p className="mt-1 text-xs font-medium text-teal-700">{listing.explanation}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      <span className="text-xs font-bold text-teal-700">{listing.matchPercentage}% match</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100 text-lg">{"\uD83D\uDEE1\uFE0F"}</div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-slate-900">Rental Safety Reminders</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                "Only continue with landlords who have completed RentShield verification and keep all communication in the platform.",
                "Review listing photos, pricing, move-in details, and deposit terms carefully before you commit to a place.",
                "Use documented payment and agreement steps so your rental process stays traceable and secure.",
              ].map((tip, index) => (
                <div key={index} className="rounded-xl border border-rose-100 bg-white/70 px-4 py-3 shadow-sm">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 text-sm font-bold text-rose-500">{index + 1}.</span>
                    <p className="text-xs leading-relaxed text-slate-600">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
