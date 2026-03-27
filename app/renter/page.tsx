"use client";

import { useEffect, useState } from "react";
import RenterSidebar, { Tab } from "@/components/renter/RenterSidebar";
import DashboardOverview from "@/components/renter/DashboardOverview";
import RenterProfile from "@/components/renter/RenterProfile";
import RenterListings from "@/components/renter/RenterListings";
import SavedListings from "@/components/renter/SavedListings";
import RoommateFinder from "@/components/renter/RoommateFinder";
import Messages from "@/components/renter/Messages";
import VerificationStatus from "@/components/renter/VerificationStatus";
import Settings from "@/components/renter/Settings";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthIdentity, getOrCreateRenterProfile, saveRenterProfile } from "@/lib/profileService";
import { supabase } from "@/lib/supabaseClient";
import { fetchUnreadCountsByConversation } from "@/lib/chatService";
import { fetchPublishedRoommateProfiles } from "@/lib/roommateService";
import { fetchRecentActivities } from "@/lib/activityService";
import { fetchRecommendedListings, type RecommendedListingMatch } from "@/lib/recommendationService";
import type { UserActivityRecord } from "@/types/activity";
import type { RenterProfileRecord } from "@/types/profiles";

type SavedListingsPayload = {
  ok: boolean;
  error?: string;
  listings?: Array<{ id: string }>;
};

const tabTitles: Record<Tab, string> = {
  dashboard: "Dashboard",
  profile: "My Profile",
  listings: "Find Listings",
  saved: "Saved Listings",
  roommate: "Find Roommate",
  messages: "Messages",
  verification: "Verification Status",
  settings: "Settings",
};

const allowedWhenUnverified: Tab[] = ["profile", "settings", "verification"];

export default function RenterDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [profile, setProfile] = useState<RenterProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [roommateMatchCount, setRoommateMatchCount] = useState(0);
  const [savedListingsCount, setSavedListingsCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<UserActivityRecord[]>([]);
  const [recommendedListings, setRecommendedListings] = useState<RecommendedListingMatch[]>([]);

  useEffect(() => {
    async function load() {
      const auth = await getAuthIdentity();
      if (!auth) {
        router.replace("/login");
        return;
      }

      if (auth.role !== "renter") {
        router.replace("/landlord");
        return;
      }

      try {
        const renterProfile = await getOrCreateRenterProfile(auth);
        setProfile(renterProfile);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (!requestedTab) {
      return;
    }

    const allowedTabs: Tab[] = ["dashboard", "profile", "listings", "saved", "roommate", "messages", "verification", "settings"];
    if (allowedTabs.includes(requestedTab as Tab)) {
      setActiveTab(requestedTab as Tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!profile?.id) {
      setUnreadMessages(0);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const unreadMap = await fetchUnreadCountsByConversation();
        if (cancelled) {
          return;
        }
        const total = Object.values(unreadMap).reduce((sum, count) => sum + count, 0);
        setUnreadMessages(total);
      } catch {
        if (!cancelled) {
          setUnreadMessages(0);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) {
      setRoommateMatchCount(0);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const matches = await fetchPublishedRoommateProfiles(profile.id);
        if (!cancelled) {
          setRoommateMatchCount(matches.length);
        }
      } catch {
        if (!cancelled) {
          setRoommateMatchCount(0);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) {
      setSavedListingsCount(0);
      return;
    }

    let cancelled = false;

    const getToken = async (): Promise<string | null> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };

    const refresh = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setSavedListingsCount(0);
          }
          return;
        }

        const response = await fetch("/api/verification/notify-upload?purpose=saved-listings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await response.json()) as SavedListingsPayload;

        if (!response.ok || !payload.ok) {
          if (!cancelled) {
            setSavedListingsCount(0);
          }
          return;
        }

        if (!cancelled) {
          setSavedListingsCount(payload.listings?.length ?? 0);
        }
      } catch {
        if (!cancelled) {
          setSavedListingsCount(0);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) {
      setRecentActivities([]);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const activities = await fetchRecentActivities(profile.id, 5);
        if (!cancelled) {
          setRecentActivities(activities);
        }
      } catch {
        if (!cancelled) {
          setRecentActivities([]);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) {
      setRecommendedListings([]);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const recommendations = await fetchRecommendedListings(profile, 5);
        if (!cancelled) {
          setRecommendedListings(recommendations);
        }
      } catch {
        if (!cancelled) {
          setRecommendedListings([]);
        }
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [profile]);

  async function handleSave(updates: Partial<Omit<RenterProfileRecord, "id" | "created_at" | "updated_at">>) {
    if (!profile) {
      return;
    }

    setSaving(true);
    try {
      const updated = await saveRenterProfile(profile.id, updates);
      setProfile(updated);
    } finally {
      setSaving(false);
    }
  }

  const verificationLocked = Boolean(profile && !profile.is_verified);

  useEffect(() => {
    if (verificationLocked && !allowedWhenUnverified.includes(activeTab)) {
      setActiveTab("verification");
      setAccessMessage("Please complete verification first to use RentShield services.");
    }
  }, [verificationLocked, activeTab]);

  function handleTabChange(tab: Tab) {
    if (verificationLocked && !allowedWhenUnverified.includes(tab)) {
      setAccessMessage("Please complete verification first to use RentShield services.");
      return;
    }
    setAccessMessage("");
    setActiveTab(tab);
    if (tab !== "messages") {
      setSelectedConversationId(null);
    }
  }

  function openConversation(conversationId: string) {
    setActiveTab("messages");
    setSelectedConversationId(conversationId);
    setAccessMessage("");
  }

  const renterInitials = (profile?.username ?? "RS")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RS";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const isListingsDetailView = activeTab === "listings" && Boolean(listingId);

  function renderContent() {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            onNavigate={handleTabChange}
            userName={profile?.username ?? "Renter"}
            unreadCount={unreadMessages}
            roommateMatchCount={roommateMatchCount}
            savedListingsCount={savedListingsCount}
            recentActivities={recentActivities}
            recommendedListings={recommendedListings}
          />
        );
      case "profile":
        return <RenterProfile key={profile?.updated_at ?? "renter-profile"} profile={profile} onSave={handleSave} saving={saving} />;
      case "listings":
        return <RenterListings onOpenConversation={openConversation} />;
      case "saved":
        return <SavedListings onOpenConversation={openConversation} />;
      case "roommate":
        return <RoommateFinder onOpenConversation={openConversation} />;
      case "messages":
        return <Messages initialConversationId={selectedConversationId} />;
      case "verification":
        return <VerificationStatus profile={profile} onSave={handleSave} saving={saving} />;
      case "settings":
        return <Settings key={profile?.updated_at ?? "renter-settings"} profile={profile} onSave={handleSave} saving={saving} />;
      default:
        return null;
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">Loading renter dashboard...</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <RenterSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadMessages={unreadMessages}
        userName={profile?.username}
        userEmail={profile?.email}
        verificationLocked={verificationLocked}
        onLockedNavigation={() => setAccessMessage("Please complete verification first to use RentShield services.")}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 mt-[57px] flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 shadow-sm lg:mt-0 lg:top-0">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">{tabTitles[activeTab]}</h1>
            <p className="mt-0.5 text-xs text-slate-400">RentShield Renter Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-teal-500" />
            </button>

            <button
              onClick={() => void handleLogout()}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Logout
            </button>

            <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-sm font-bold text-white shadow-sm transition-all hover:ring-2 hover:ring-teal-400 hover:ring-offset-1">
              {renterInitials}
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-auto overscroll-contain ${isListingsDetailView ? "px-4 pb-4 pt-0 sm:px-6 sm:pb-6" : "p-4 sm:p-6"}`}>
          {accessMessage ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {accessMessage}
            </div>
          ) : null}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
