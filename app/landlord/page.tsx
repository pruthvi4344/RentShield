"use client";

import { useEffect, useState } from "react";
import LandlordSidebar, { LandlordTab } from "@/components/landlord/LandlordSidebar";
import LandlordDashboard from "@/components/landlord/LandlordDashboard";
import VerificationCenter from "@/components/landlord/VerificationCenter";
import AddPropertyDynamic from "@/components/landlord/AddPropertyDynamic";
import MyListingsDynamic from "@/components/landlord/MyListingsDynamic";
import TenantRequests from "@/components/landlord/TenantRequests";
import Messages from "@/components/landlord/Messages";
import Analytics from "@/components/landlord/Analytics";
import LandlordProfile from "@/components/landlord/LandlordProfile";
import LandlordSettings from "@/components/landlord/Settings";
import { useRouter } from "next/navigation";
import { getAuthIdentity, getOrCreateLandlordProfile, saveLandlordProfile } from "@/lib/profileService";
import { supabase } from "@/lib/supabaseClient";
import { fetchUnreadCountsByConversation } from "@/lib/chatService";
import { fetchLandlordDashboardData } from "@/lib/landlordDashboardService";
import { computeLandlordTrustScore } from "@/lib/landlordTrustService";
import type { LandlordProfileRecord } from "@/types/profiles";
import type { LandlordTrustScore } from "@/lib/landlordTrustService";
import type { LandlordDashboardData } from "@/lib/landlordDashboardService";

const tabTitles: Record<LandlordTab, string> = {
  dashboard: "Dashboard",
  verification: "Verification Center",
  "add-property": "Add Property",
  listings: "My Listings",
  requests: "Tenant Requests",
  messages: "Messages",
  analytics: "Analytics",
  profile: "My Profile",
  settings: "Settings",
};

const allowedWhenUnverified: LandlordTab[] = ["profile", "settings", "verification"];

export default function LandlordDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LandlordTab>("dashboard");
  const [profile, setProfile] = useState<LandlordProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [trustScore, setTrustScore] = useState<LandlordTrustScore | null>(null);
  const [dashboardData, setDashboardData] = useState<LandlordDashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const auth = await getAuthIdentity();
      if (!auth) {
        router.replace("/login");
        return;
      }

      if (auth.role !== "landlord") {
        router.replace("/renter");
        return;
      }

      try {
        const landlordProfile = await getOrCreateLandlordProfile(auth);
        setProfile(landlordProfile);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  useEffect(() => {
    if (!profile?.id) {
      setUnreadMessages(0);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const unreadMap = await fetchUnreadCountsByConversation();
        if (cancelled) return;
        const total = Object.values(unreadMap).reduce((sum, count) => sum + count, 0);
        setUnreadMessages(total);
      } catch {
        if (!cancelled) setUnreadMessages(0);
      }
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) {
      setTrustScore(null);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const nextTrustScore = await computeLandlordTrustScore(profile);
        if (!cancelled) {
          setTrustScore(nextTrustScore);
        }
      } catch {
        if (!cancelled) {
          setTrustScore(null);
        }
      }
    };

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) {
      setDashboardData(null);
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const data = await fetchLandlordDashboardData(profile.id, unreadMessages);
        if (!cancelled) {
          setDashboardData(data);
        }
      } catch {
        if (!cancelled) {
          setDashboardData(null);
        }
      }
    };

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, unreadMessages]);

  async function handleSave(updates: Partial<Omit<LandlordProfileRecord, "id" | "created_at" | "updated_at">>) {
    if (!profile) {
      return;
    }

    setSaving(true);
    try {
      const updated = await saveLandlordProfile(profile.id, updates);
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

  function handleTabChange(tab: LandlordTab) {
    if (verificationLocked && !allowedWhenUnverified.includes(tab)) {
      setAccessMessage("Please complete verification first to use RentShield services.");
      return;
    }
    setAccessMessage("");
    setActiveTab(tab);
  }

  const landlordInitials = (profile?.username ?? "RS")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "RS";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  function renderContent() {
    switch (activeTab) {
      case "dashboard":    return <LandlordDashboard onNavigate={handleTabChange} userName={profile?.username ?? "Landlord"} unreadMessages={unreadMessages} trustScore={trustScore ?? undefined} stats={dashboardData?.stats} activities={dashboardData?.activities} topListings={dashboardData?.topListings} pricingInsight={dashboardData?.pricingInsight} />;
      case "verification": return <VerificationCenter profile={profile} onSave={handleSave} saving={saving} />;
      case "add-property": return <AddPropertyDynamic />;
      case "listings":     return <MyListingsDynamic />;
      case "requests":     return <TenantRequests />;
      case "messages":     return <Messages />;
      case "analytics":    return <Analytics />;
      case "profile":      return <LandlordProfile key={profile?.updated_at ?? "landlord-profile"} profile={profile} onSave={handleSave} saving={saving} />;
      case "settings":     return <LandlordSettings key={profile?.updated_at ?? "landlord-settings"} profile={profile} onSave={handleSave} saving={saving} />;
      default:             return null;
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Loading landlord dashboard...</main>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <LandlordSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadMessages={unreadMessages}
        pendingRequests={2}
        trustScore={trustScore ?? undefined}
        userName={profile?.username}
        userEmail={profile?.email}
        verificationLocked={verificationLocked}
        onLockedNavigation={() => setAccessMessage("Please complete verification first to use RentShield services.")}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm lg:mt-0 mt-[57px]">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">{tabTitles[activeTab]}</h1>
            <p className="text-xs text-slate-400 mt-0.5">RentShield Landlord Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 border border-white" />
            </button>
            <button
              onClick={() => void handleLogout()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Logout
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-sm cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 transition-all">
              {landlordInitials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {accessMessage && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              {accessMessage}
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

