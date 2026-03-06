"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getAuthIdentity, getOrCreateRenterProfile, saveRenterProfile } from "@/lib/profileService";
import type { RenterProfileRecord } from "@/types/profiles";

type RoommateCard = RenterProfileRecord;

const genderOptions = ["Any", "Male", "Female"];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function gradientForId(id: string): string {
  const colors = [
    "from-violet-400 to-purple-500",
    "from-teal-400 to-cyan-500",
    "from-amber-400 to-orange-400",
    "from-emerald-400 to-teal-500",
    "from-rose-400 to-pink-500",
    "from-cyan-400 to-blue-500",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
}

function formatMoveInDate(value: string | null): string {
  if (!value) return "Flexible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Flexible";
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function calculateMatchScore(me: RenterProfileRecord | null, other: RenterProfileRecord): number {
  if (!me) return 82;

  let score = 72;
  if (me.city && other.city && me.city === other.city) score += 10;
  if (me.university && other.university && me.university === other.university) score += 8;
  if (me.room_preference && other.room_preference && me.room_preference === other.room_preference) score += 5;
  if (me.roommate_preferred_gender && me.roommate_preferred_gender !== "Any" && me.roommate_preferred_gender === other.gender) score += 5;

  if (me.budget_min !== null && me.budget_max !== null && other.budget_min !== null && other.budget_max !== null) {
    const overlapMin = Math.max(me.budget_min, other.budget_min);
    const overlapMax = Math.min(me.budget_max, other.budget_max);
    if (overlapMax >= overlapMin) score += 8;
  }

  const myTags = new Set((me.lifestyle ?? []).map((tag) => tag.toLowerCase().trim()));
  const sharedLifestyle = (other.lifestyle ?? []).filter((tag) => myTags.has(tag.toLowerCase().trim())).length;
  score += Math.min(8, sharedLifestyle * 2);

  return Math.max(70, Math.min(97, score));
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : score >= 80 ? "bg-teal-100 text-teal-700 border-teal-200" : "bg-amber-100 text-amber-700 border-amber-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${color}`}>
      ⭐ {score}% match
    </span>
  );
}

export default function RoommateFinder() {
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [genderFilter, setGenderFilter] = useState("Any");
  const [maxBudget, setMaxBudget] = useState(1500);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [myProfile, setMyProfile] = useState<RenterProfileRecord | null>(null);
  const [profiles, setProfiles] = useState<RoommateCard[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    country: "",
    university: "",
    city: "",
    gender: "",
    roommatePreferredGender: "Any",
    budgetMin: "",
    budgetMax: "",
    moveInDate: "",
    roomPreference: "",
    lifestyle: "",
    bio: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const auth = await getAuthIdentity();
      if (!auth) {
        setError("Please login to use roommate finder.");
        return;
      }

      const mine = await getOrCreateRenterProfile(auth);
      setMyProfile(mine);
      setForm({
        country: mine.country ?? "",
        university: mine.university ?? "",
        city: mine.city ?? "",
        gender: mine.gender ?? "",
        roommatePreferredGender: mine.roommate_preferred_gender ?? "Any",
        budgetMin: mine.budget_min?.toString() ?? "",
        budgetMax: mine.budget_max?.toString() ?? "",
        moveInDate: mine.move_in_date ?? "",
        roomPreference: mine.room_preference ?? "",
        lifestyle: (mine.lifestyle ?? []).join(", "),
        bio: mine.bio ?? "",
      });

      const { data, error: fetchError } = await supabase
        .from("renter_profiles")
        .select("*")
        .eq("is_roommate_profile_public", true)
        .neq("id", auth.id)
        .order("updated_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setProfiles((data ?? []) as RenterProfileRecord[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load roommate profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handlePublishProfile() {
    if (!myProfile) return;

    setSaving(true);
    setError("");
    try {
      await saveRenterProfile(myProfile.id, {
        country: form.country || null,
        university: form.university || null,
        city: form.city || null,
        gender: form.gender || null,
        roommate_preferred_gender: form.roommatePreferredGender || null,
        budget_min: form.budgetMin ? Number(form.budgetMin) : null,
        budget_max: form.budgetMax ? Number(form.budgetMax) : null,
        move_in_date: form.moveInDate || null,
        room_preference: form.roomPreference || null,
        lifestyle: form.lifestyle
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        bio: form.bio || null,
        is_roommate_profile_public: true,
      });
      setShowCreateModal(false);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save roommate profile.");
    } finally {
      setSaving(false);
    }
  }

  const cities = useMemo(() => {
    const unique = Array.from(new Set(profiles.map((p) => p.city).filter((v): v is string => Boolean(v))));
    return ["All Cities", ...unique];
  }, [profiles]);

  const filtered = useMemo(
    () =>
      profiles.filter((profile) => {
        if (cityFilter !== "All Cities" && profile.city !== cityFilter) return false;
        if (genderFilter !== "Any" && profile.gender !== genderFilter) return false;
        if ((profile.budget_max ?? 0) > maxBudget) return false;
        return true;
      }),
    [profiles, cityFilter, genderFilter, maxBudget],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Find Roommate</h2>
          <p className="text-sm text-slate-500 mt-0.5">Connect with verified roommate seekers across Canada.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold shadow-sm"
        >
          {myProfile?.is_roommate_profile_public ? "Edit My Roommate Profile" : "Create My Roommate Profile"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Gender Preference</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {genderOptions.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Max Budget: ${maxBudget.toLocaleString()}/mo
            </label>
            <input
              type="range"
              min={400}
              max={1500}
              step={50}
              value={maxBudget}
              onChange={(e) => setMaxBudget(+e.target.value)}
              className="w-full accent-teal-500 mt-1.5"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">{filtered.length} profile{filtered.length !== 1 ? "s" : ""} found</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="text-sm text-slate-500">Loading roommate profiles...</div>}

      {/* Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((r) => {
            const score = calculateMatchScore(myProfile, r);
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientForId(r.id)} flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0 shadow-md`}>
                    {initialsFromName(r.username)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900">{r.username}</h3>
                          {r.is_verified && (
                            <span className="inline-flex items-center gap-0.5 text-teal-500 text-xs font-semibold">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">from {r.country ?? "Unknown"} · {r.gender ?? "Not set"}</p>
                      </div>
                      <ScoreBadge score={score} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-slate-600">
                      <span>🎓 {r.university ?? "Not set"}</span>
                      <span>📍 {r.city ?? "Not set"}</span>
                      <span>💰 ${r.budget_min ?? 0}–${r.budget_max ?? 0}/mo</span>
                      <span>📅 {formatMoveInDate(r.move_in_date)}</span>
                      <span>🏠 {r.room_preference ?? "Not set"}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {(r.lifestyle ?? []).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{tag}</span>
                      ))}
                    </div>

                    {expanded === r.id && (
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                        {r.bio ?? "No bio added yet."}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          window.location.href = `mailto:${r.email}?subject=RentShield Roommate: ${encodeURIComponent(r.username)}`;
                        }}
                        className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                      >
                        Send Message
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                      >
                        {expanded === r.id ? "Hide Profile" : "View Profile"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-semibold text-slate-600">No profiles match your filters</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create My Roommate Profile</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-slate-700 text-sm font-semibold">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.country} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} placeholder="Country" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              <input value={form.university} onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))} placeholder="University" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              <input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} placeholder="City (e.g. Toronto, ON)" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              <select value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select value={form.roommatePreferredGender} onChange={(e) => setForm((prev) => ({ ...prev, roommatePreferredGender: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                <option value="Any">Preferred roommate gender: Any</option>
                <option value="Male">Preferred roommate gender: Male</option>
                <option value="Female">Preferred roommate gender: Female</option>
              </select>
              <input value={form.roomPreference} onChange={(e) => setForm((prev) => ({ ...prev, roomPreference: e.target.value }))} placeholder="Room preference (Private Room / Shared Room)" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              <input type="number" value={form.budgetMin} onChange={(e) => setForm((prev) => ({ ...prev, budgetMin: e.target.value }))} placeholder="Budget min" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              <input type="number" value={form.budgetMax} onChange={(e) => setForm((prev) => ({ ...prev, budgetMax: e.target.value }))} placeholder="Budget max" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              <input type="date" value={form.moveInDate} onChange={(e) => setForm((prev) => ({ ...prev, moveInDate: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              <input value={form.lifestyle} onChange={(e) => setForm((prev) => ({ ...prev, lifestyle: e.target.value }))} placeholder="Lifestyle tags (comma separated)" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:col-span-2" />
              <textarea value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} rows={4} placeholder="Short bio for potential roommates" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:col-span-2 resize-none" />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={() => void handlePublishProfile()}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
