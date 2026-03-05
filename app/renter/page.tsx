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
import { useRouter } from "next/navigation";
import { getAuthIdentity, getOrCreateRenterProfile, saveRenterProfile } from "@/lib/profileService";
import { supabase } from "@/lib/supabaseClient";
import type { RenterProfileRecord } from "@/types/profiles";

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
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [profile, setProfile] = useState<RenterProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");

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

    load();
  }, [router]);

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

  async function handleVerify() {
    if (!profile) {
      return;
    }
    await handleSave({ is_verified: true });
    setAccessMessage("");
  }

  function handleTabChange(tab: Tab) {
    if (verificationLocked && !allowedWhenUnverified.includes(tab)) {
      setAccessMessage("Please complete verification first to use RentShield services.");
      return;
    }
    setAccessMessage("");
    setActiveTab(tab);
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

  function renderContent() {
    switch (activeTab) {
      case "dashboard":    return <DashboardOverview onNavigate={handleTabChange} userName={profile?.username ?? "Renter"} />;
      case "profile":      return <RenterProfile key={profile?.updated_at ?? "renter-profile"} profile={profile} onSave={handleSave} saving={saving} />;
      case "listings":     return <RenterListings />;
      case "saved":        return <SavedListings />;
      case "roommate":     return <RoommateFinder />;
      case "messages":     return <Messages />;
      case "verification": return <VerificationStatus isVerified={Boolean(profile?.is_verified)} onVerify={handleVerify} verifying={saving} />;
      case "settings":     return <Settings key={profile?.updated_at ?? "renter-settings"} profile={profile} onSave={handleSave} saving={saving} />;
      default:             return null;
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Loading renter dashboard...</main>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <RenterSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        unreadMessages={2}
        userName={profile?.username}
        userEmail={profile?.email}
        verificationLocked={verificationLocked}
        onLockedNavigation={() => setAccessMessage("Please complete verification first to use RentShield services.")}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 lg:top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm lg:mt-0 mt-[57px]">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">{tabTitles[activeTab]}</h1>
            <p className="text-xs text-slate-400 mt-0.5">RentShield Renter Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 border border-white" />
            </button>

            <button
              onClick={() => void handleLogout()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              Logout
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm cursor-pointer hover:ring-2 hover:ring-teal-400 hover:ring-offset-1 transition-all">
              {renterInitials}
            </div>
          </div>
        </header>

        {/* Page content */}
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
