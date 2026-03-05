"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

type AdminVerificationItem = {
  id: string;
  landlord_id: string;
  request_type: "identity" | "property";
  document_name: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  document_storage_path?: string | null;
  document_content_type?: string | null;
  document_url?: string | null;
  landlord_profiles?: { username: string | null; email: string | null } | null;
};

export default function AdminVerificationsPage() {
  const initialStoredKey = typeof window !== "undefined" ? (localStorage.getItem("admin_panel_key") ?? "") : "";
  const [adminKey, setAdminKey] = useState(initialStoredKey);
  const [savedKey, setSavedKey] = useState(initialStoredKey);
  const [loading, setLoading] = useState(Boolean(initialStoredKey));
  const [error, setError] = useState("");
  const [items, setItems] = useState<AdminVerificationItem[]>([]);
  const [reviewNotesById, setReviewNotesById] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const loadRequests = useCallback(async (withKey?: string) => {
    const key = withKey ?? savedKey;
    if (!key) {
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/verification/requests", {
      method: "GET",
      headers: { "x-admin-key": key },
    });

    const payload = (await response.json()) as { ok: boolean; error?: string; requests?: AdminVerificationItem[] };
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Failed to load verification requests.");
      setLoading(false);
      return;
    }

    setItems(payload.requests ?? []);
    setLoading(false);
  }, [savedKey]);

  useEffect(() => {
    if (savedKey) {
      const timeoutId = setTimeout(() => {
        void loadRequests(savedKey);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [savedKey, loadRequests]);

  async function handleAdminLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const key = adminKey.trim();
    if (!key) {
      setError("Enter admin key.");
      return;
    }

    localStorage.setItem("admin_panel_key", key);
    setSavedKey(key);
    await loadRequests(key);
  }

  function logoutAdmin() {
    localStorage.removeItem("admin_panel_key");
    setSavedKey("");
    setAdminKey("");
    setItems([]);
    setError("");
    setLoading(false);
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    if (!savedKey) {
      setError("Admin key missing. Please login again.");
      return;
    }

    setActingId(id);
    setError("");

    const response = await fetch("/api/admin/verification/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": savedKey,
      },
      body: JSON.stringify({
        requestId: id,
        action,
        reviewNotes: reviewNotesById[id] ?? "",
      }),
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? `Failed to ${action} request.`);
      setActingId(null);
      return;
    }

    await loadRequests(savedKey);
    setActingId(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Verification Review</h1>
          <p className="text-sm text-slate-500 mt-1">Review landlord identity and property ownership submissions.</p>
        </div>

        {!savedKey && (
          <form onSubmit={handleAdminLogin} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-5 max-w-xl">
            <p className="text-sm font-semibold text-slate-800 mb-2">Admin Access</p>
            <p className="text-xs text-slate-500 mb-3">Enter your admin panel key to view and review requests.</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Admin panel key"
              />
              <button type="submit" className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold">
                Unlock
              </button>
            </div>
          </form>
        )}

        {savedKey && (
          <div className="mb-4 flex justify-end">
            <button onClick={logoutAdmin} className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700">
              Admin Logout
            </button>
          </div>
        )}

        {loading && <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading requests...</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {!loading && !error && savedKey && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Submitted</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Landlord</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Document</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        No verification requests yet.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-slate-700">{new Date(item.submitted_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-semibold">{item.landlord_profiles?.username ?? "Unknown"}</div>
                        <div className="text-xs text-slate-500">{item.landlord_profiles?.email ?? "No email"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 capitalize">{item.request_type}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex items-center gap-2">
                          <span>{item.document_name}</span>
                          {item.document_url ? (
                            <a
                              href={item.document_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No file link</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${
                            item.status === "approved"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : item.status === "rejected"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === "pending" ? (
                          <div className="space-y-2 min-w-[220px]">
                            <input
                              type="text"
                              value={reviewNotesById[item.id] ?? ""}
                              onChange={(e) => setReviewNotesById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Review note (optional)"
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => void handleAction(item.id, "approve")}
                                disabled={actingId === item.id}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => void handleAction(item.id, "reject")}
                                disabled={actingId === item.id}
                                className="px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">{item.reviewed_by ? `Reviewed by ${item.reviewed_by}` : "Reviewed"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
