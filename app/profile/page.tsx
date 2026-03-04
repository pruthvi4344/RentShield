"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type UserRole = "renter" | "landlord";

type ProfileRow = {
  email: string;
  username: string;
  role: UserRole;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setError("Supabase is not configured.");
          setIsLoading(false);
        }
        return;
      }

      const { data, error: getUserError } = await supabase.auth.getUser();
      if (!mounted) {
        return;
      }

      if (getUserError) {
        setError(getUserError.message);
        setIsLoading(false);
        return;
      }

      const currentUser = data.user;
      setUser(currentUser);

      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email, username, role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (!profileError && profileData) {
        setProfile({
          email: profileData.email,
          username: profileData.username,
          role: profileData.role as UserRole,
        });
      } else {
        const metadataUsername =
          typeof currentUser.user_metadata?.username === "string" ? currentUser.user_metadata.username : "Not set";
        const metadataRole =
          currentUser.user_metadata?.role === "landlord" || currentUser.user_metadata?.role === "renter"
            ? (currentUser.user_metadata.role as UserRole)
            : "renter";

        setProfile({
          email: currentUser.email ?? "Not set",
          username: metadataUsername,
          role: metadataRole,
        });
      }

      setIsLoading(false);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/70 border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900">Your Profile</h1>
        <p className="mt-1 text-sm text-slate-600">This page confirms if user is logged in.</p>

        {isLoading ? (
          <p className="mt-6 text-sm text-slate-600">Loading account...</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : !user ? (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-slate-700">You are not logged in yet.</p>
            <p className="text-sm text-slate-600">Verify your email first, then log in.</p>
            <Link href="/login" className="inline-block text-sm font-semibold text-teal-600 hover:text-teal-700">
              Go to login
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.email ?? user.email ?? "Not set"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Username</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.username ?? "Not set"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{profile?.role ?? "Not set"}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
