"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { LandlordProfileRecord } from "@/types/profiles";

type Props = {
  profile: LandlordProfileRecord | null;
  onSave: (updates: Partial<Omit<LandlordProfileRecord, "id" | "created_at" | "updated_at">>) => Promise<void>;
  saving?: boolean;
};

export default function LandlordSettings({ profile, onSave, saving = false }: Props) {
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [name, setName] = useState(profile?.username ?? "");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await onSave({ email, phone: phone || null, username: name });

    if (newPwd.trim()) {
      await supabase.auth.updateUser({ password: newPwd });
      setCurrentPwd("");
      setNewPwd("");
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and notification preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Account Details</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Username</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Change Password</h3>
        <input
          type="password"
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
          placeholder="Current Password"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        />
        <input
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          placeholder="New Password"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-70 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Settings saved.</span>}
      </div>
    </div>
  );
}
