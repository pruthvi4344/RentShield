"use client";

import { useMemo, useState } from "react";
import type { RenterProfileRecord } from "@/types/profiles";

type Props = {
  profile: RenterProfileRecord | null;
  onSave: (updates: Partial<Omit<RenterProfileRecord, "id" | "created_at" | "updated_at">>) => Promise<void>;
  saving?: boolean;
};

type DraftProfile = {
  username: string;
  email: string;
  university: string;
  city: string;
  move_in_date: string;
  budget_min: number | "";
  budget_max: number | "";
  lifestyle: string[];
  bio: string;
  room_preference: string;
  gender: string;
  country: string;
  phone: string;
};

const lifestyleOptions = [
  "Non-smoker",
  "Smoker",
  "Early riser",
  "Night owl",
  "Quiet household",
  "Social household",
  "Pet-friendly",
  "No pets",
  "Vegetarian",
  "Students only",
];

function toDraft(profile: RenterProfileRecord): DraftProfile {
  return {
    username: profile.username,
    email: profile.email,
    university: profile.university ?? "",
    city: profile.city ?? "",
    move_in_date: profile.move_in_date ?? "",
    budget_min: profile.budget_min ?? "",
    budget_max: profile.budget_max ?? "",
    lifestyle: profile.lifestyle ?? [],
    bio: profile.bio ?? "",
    room_preference: profile.room_preference ?? "",
    gender: profile.gender ?? "",
    country: profile.country ?? "",
    phone: profile.phone ?? "",
  };
}

export default function RenterProfile({ profile, onSave, saving = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftProfile | null>(profile ? toDraft(profile) : null);

  const initials = useMemo(() => {
    const name = draft?.username ?? profile?.username ?? "RS";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "RS";
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [draft?.username, profile?.username]);

  if (!profile) {
    return <div className="text-sm text-slate-500">Loading profile...</div>;
  }
  const currentDraft: DraftProfile = draft ?? toDraft(profile);

  function toggleLifestyle(tag: string) {
    const current = currentDraft.lifestyle;
    if (current.includes(tag)) {
      setDraft({ ...currentDraft, lifestyle: current.filter((item) => item !== tag) });
      return;
    }
    setDraft({ ...currentDraft, lifestyle: [...current, tag] });
  }

  async function handleSave() {
    await onSave({
      username: currentDraft.username,
      email: currentDraft.email,
      university: currentDraft.university || null,
      city: currentDraft.city || null,
      move_in_date: currentDraft.move_in_date || null,
      budget_min: currentDraft.budget_min === "" ? null : Number(currentDraft.budget_min),
      budget_max: currentDraft.budget_max === "" ? null : Number(currentDraft.budget_max),
      lifestyle: currentDraft.lifestyle,
      bio: currentDraft.bio || null,
      room_preference: currentDraft.room_preference || null,
      gender: currentDraft.gender || null,
      country: currentDraft.country || null,
      phone: currentDraft.phone || null,
    });
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">My Profile</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your personal information and preferences.</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setDraft(toDraft(profile));
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-70 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
            {initials}
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={currentDraft.username}
                onChange={(e) => setDraft({ ...currentDraft, username: e.target.value })}
                className="text-xl font-extrabold text-slate-900 border-b-2 border-teal-400 bg-transparent outline-none pb-0.5 w-full"
              />
            ) : (
              <h3 className="text-xl font-extrabold text-slate-900">{profile.username}</h3>
            )}
            <p className="text-xs text-slate-500 mt-1">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Personal Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: "Email", key: "email", type: "email" },
            { label: "University / Workplace", key: "university", type: "text" },
            { label: "Current City", key: "city", type: "text" },
            { label: "Country of Origin", key: "country", type: "text" },
            { label: "Phone Number", key: "phone", type: "text" },
            { label: "Target Move-in Date", key: "move_in_date", type: "date" },
            { label: "Room Preference", key: "room_preference", type: "text" },
            { label: "Gender", key: "gender", type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
              {editing ? (
                <input
                  type={type}
                  value={(currentDraft as unknown as Record<string, string>)[key] ?? ""}
                  onChange={(e) => setDraft({ ...currentDraft, [key]: e.target.value } as DraftProfile)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  {(profile as unknown as Record<string, string | null>)[key] || "Not set"}
                </p>
              )}
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Monthly Budget Range</label>
            {editing ? (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={currentDraft.budget_min}
                  onChange={(e) => setDraft({ ...currentDraft, budget_min: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="number"
                  value={currentDraft.budget_max}
                  onChange={(e) => setDraft({ ...currentDraft, budget_max: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-800 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                {profile.budget_min ?? "-"} to {profile.budget_max ?? "-"} / month
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Lifestyle Preferences</h4>
        <div className="flex flex-wrap gap-2">
          {(editing ? lifestyleOptions : currentDraft.lifestyle).map((tag) => {
            const selected = currentDraft.lifestyle.includes(tag);
            return editing ? (
              <button
                key={tag}
                type="button"
                onClick={() => toggleLifestyle(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selected ? "bg-teal-100 text-teal-700 border-teal-300" : "bg-slate-50 text-slate-500 border-slate-200"
                }`}
              >
                {selected ? "✓ " : ""}
                {tag}
              </button>
            ) : (
              <span key={tag} className="px-3 py-1.5 rounded-full text-sm font-medium bg-teal-50 text-teal-700 border border-teal-100">
                {tag}
              </span>
            );
          })}
          {!editing && currentDraft.lifestyle.length === 0 && <span className="text-sm text-slate-500">No preferences added yet.</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">About Me</h4>
        {editing ? (
          <textarea
            value={currentDraft.bio}
            onChange={(e) => setDraft({ ...currentDraft, bio: e.target.value })}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none transition-colors"
          />
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{currentDraft.bio || "No bio added yet."}</p>
        )}
      </div>
    </div>
  );
}
