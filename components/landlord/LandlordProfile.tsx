"use client";

import { useMemo, useState } from "react";
import type { LandlordProfileRecord } from "@/types/profiles";

type Props = {
  profile: LandlordProfileRecord | null;
  onSave: (updates: Partial<Omit<LandlordProfileRecord, "id" | "created_at" | "updated_at">>) => Promise<void>;
  saving?: boolean;
};

export default function LandlordProfile({ profile, onSave, saving = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LandlordProfileRecord | null>(profile);

  const initials = useMemo(() => {
    const name = draft?.username || "Landlord";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "RS";
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [draft?.username]);

  if (!profile) {
    return <div className="text-sm text-slate-500">Loading profile...</div>;
  }
  const currentDraft: LandlordProfileRecord = draft ?? profile;

  async function save() {
    await onSave({
      username: currentDraft.username,
      email: currentDraft.email,
      phone: currentDraft.phone || null,
      city: currentDraft.city || null,
      bio: currentDraft.bio || null,
      business_name: currentDraft.business_name || null,
    });
    setEditing(false);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">My Profile</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your public landlord profile on RentShield.</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setDraft(profile);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-70 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
            {initials}
          </div>
          <div className="flex-1">
            {editing ? (
              <input value={currentDraft.username} onChange={(e) => setDraft({ ...currentDraft, username: e.target.value })} className="text-xl font-extrabold text-slate-900 border-b-2 border-teal-400 bg-transparent outline-none pb-0.5 w-full" />
            ) : (
              <h3 className="text-xl font-extrabold text-slate-900">{profile.username}</h3>
            )}
            <p className="text-sm text-slate-500 mt-1">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Contact Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "city", label: "City", type: "text" },
            { key: "business_name", label: "Business Name", type: "text" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{field.label}</label>
              {editing ? (
                <input
                  type={field.type}
                  value={(currentDraft as unknown as Record<string, string | null>)[field.key] ?? ""}
                  onChange={(e) => setDraft({ ...currentDraft, [field.key]: e.target.value } as LandlordProfileRecord)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  {(profile as unknown as Record<string, string | null>)[field.key] || "Not set"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">About</h4>
        {editing ? (
          <textarea
            value={currentDraft.bio ?? ""}
            onChange={(e) => setDraft({ ...currentDraft, bio: e.target.value })}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{profile.bio || "No bio added yet."}</p>
        )}
      </div>
    </div>
  );
}
