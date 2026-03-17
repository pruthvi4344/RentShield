"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthIdentity, getOrCreateRenterProfile, saveRenterProfile } from "@/lib/profileService";
import {
  createOrGetRoommateConversation,
  fetchPublishedRoommateProfiles,
  fetchRoommateRequests,
  sendRoommateRequest,
  updateRoommateRequestStatus,
} from "@/lib/roommateService";
import type {
  RoommateRequestWithProfiles,
  RenterProfileRecord,
} from "@/types/profiles";

type RoommateCard = RenterProfileRecord;
type RoommateFinderProps = {
  onOpenConversation: (conversationId: string) => void;
};

const genderOptions = ["Any", "Male", "Female"];
const countryOptions = ["India", "Canada", "Nigeria", "Brazil", "Egypt", "South Korea", "Other"];
const cityOptions = ["Toronto, ON", "Waterloo, ON", "Vancouver, BC", "Montreal, QC", "Ottawa, ON", "Calgary, AB"];
const universityOptions = [
  "University of Toronto",
  "University of Waterloo",
  "UBC Vancouver",
  "McGill University",
  "University of Ottawa",
  "York University",
  "Other",
];
const roomTypeOptions = [
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" },
  { value: "shared_apartment", label: "Shared Apartment" },
  { value: "studio", label: "Studio" },
  { value: "condo_room", label: "Condo Room" },
  { value: "basement_room", label: "Basement Room" },
  { value: "any", label: "Any" },
];
const lifestyleOptions = [
  "Non-smoker",
  "Vegetarian",
  "Early riser",
  "Night owl",
  "Clean",
  "Quiet",
  "Social",
  "Student only",
  "Pet friendly",
];

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

function roomTypeLabel(value: string | null): string {
  if (!value) return "Not set";
  const match = roomTypeOptions.find((option) => option.value === value);
  if (match) return match.label;
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
    score >= 90
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : score >= 80
        ? "bg-teal-100 text-teal-700 border-teal-200"
        : "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${color}`}>
      <span>Match</span>
      <span>{score}%</span>
    </span>
  );
}

export default function RoommateFinder({ onOpenConversation }: RoommateFinderProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "requests">("browse");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [genderFilter, setGenderFilter] = useState("Any");
  const [maxBudget, setMaxBudget] = useState(1500);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestBusyId, setRequestBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [myProfile, setMyProfile] = useState<RenterProfileRecord | null>(null);
  const [profiles, setProfiles] = useState<RoommateCard[]>([]);
  const [requests, setRequests] = useState<RoommateRequestWithProfiles[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formError, setFormError] = useState("");
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
    lifestyle: [] as string[],
    bio: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const auth = await getAuthIdentity();
      if (!auth || auth.role !== "renter") {
        setError("Please login as renter to use roommate matching.");
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
        lifestyle: mine.lifestyle ?? [],
        bio: mine.bio ?? "",
      });

      const [publishedProfiles, roommateRequests] = await Promise.all([
        fetchPublishedRoommateProfiles(auth.id),
        fetchRoommateRequests(auth.id),
      ]);

      setProfiles(publishedProfiles);
      setRequests(roommateRequests);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load roommate data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSaveProfile(publish: boolean) {
    if (!myProfile) return;

    const budgetMin = form.budgetMin ? Number(form.budgetMin) : null;
    const budgetMax = form.budgetMax ? Number(form.budgetMax) : null;
    if ((budgetMin !== null && budgetMin < 0) || (budgetMax !== null && budgetMax < 0)) {
      setFormError("Budget values must be positive.");
      return;
    }
    if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
      setFormError("Budget min cannot be greater than budget max.");
      return;
    }
    if (publish && (!form.city || !form.university || !form.gender || !form.roomPreference)) {
      setFormError("Select city, university, gender, and room type before publishing.");
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");
    try {
      const updated = await saveRenterProfile(myProfile.id, {
        country: form.country || null,
        university: form.university || null,
        city: form.city || null,
        gender: form.gender || null,
        roommate_preferred_gender: form.roommatePreferredGender || null,
        budget_min: budgetMin,
        budget_max: budgetMax,
        move_in_date: form.moveInDate || null,
        room_preference: form.roomPreference || null,
        lifestyle: form.lifestyle,
        bio: form.bio || null,
        is_published: publish,
        is_roommate_profile_public: publish,
      });

      setMyProfile(updated);
      setShowCreateModal(false);
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save roommate profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendRequest(receiverId: string) {
    if (!myProfile) return;

    setRequestBusyId(receiverId);
    setError("");
    try {
      await sendRoommateRequest(myProfile.id, receiverId);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to send request.");
    } finally {
      setRequestBusyId(null);
    }
  }

  async function handleRespond(requestId: string, response: "accepted" | "rejected", senderId: string) {
    if (!myProfile) return;

    setRequestBusyId(requestId);
    setError("");
    try {
      await updateRoommateRequestStatus(requestId, myProfile.id, response);
      if (response === "accepted") {
        const conversation = await createOrGetRoommateConversation(senderId);
        onOpenConversation(conversation.id);
      }
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update request.");
    } finally {
      setRequestBusyId(null);
    }
  }

  async function handleOpenAcceptedChat(otherRenterId: string) {
    setRequestBusyId(otherRenterId);
    setError("");
    try {
      const conversation = await createOrGetRoommateConversation(otherRenterId);
      onOpenConversation(conversation.id);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Failed to open chat.");
    } finally {
      setRequestBusyId(null);
    }
  }

  function toggleLifestyleTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      lifestyle: prev.lifestyle.includes(tag)
        ? prev.lifestyle.filter((item) => item !== tag)
        : [...prev.lifestyle, tag],
    }));
  }

  const cities = useMemo(() => {
    const unique = Array.from(new Set(profiles.map((profile) => profile.city).filter((value): value is string => Boolean(value))));
    return ["All Cities", ...unique];
  }, [profiles]);

  const requestMap = useMemo(() => {
    const map = new Map<string, RoommateRequestWithProfiles>();
    if (!myProfile) return map;

    for (const request of requests) {
      const otherId = request.sender_id === myProfile.id ? request.receiver_id : request.sender_id;
      map.set(otherId, request);
    }

    return map;
  }, [requests, myProfile]);

  const incomingRequests = useMemo(
    () =>
      requests.filter((request) => myProfile && request.receiver_id === myProfile.id),
    [requests, myProfile],
  );

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Find Roommate</h2>
          <p className="mt-0.5 text-sm text-slate-500">Publish your roommate profile, send requests, and chat only after acceptance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${myProfile?.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {myProfile?.is_published ? "Published" : "Draft only"}
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-600"
          >
            {myProfile?.is_published ? "Edit Roommate Profile" : "Create Roommate Profile"}
          </button>
        </div>
      </div>

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {[
          { id: "browse" as const, label: "Browse Profiles" },
          { id: "requests" as const, label: `Requests (${incomingRequests.filter((request) => request.status === "pending").length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id ? "bg-teal-500 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="text-sm text-slate-500">Loading roommate data...</div>}

      {!loading && activeTab === "browse" && (
        <>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
                <select
                  value={cityFilter}
                  onChange={(event) => setCityFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {cities.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Gender Preference</label>
                <select
                  value={genderFilter}
                  onChange={(event) => setGenderFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {genderOptions.map((gender) => (
                    <option key={gender}>{gender}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Max Budget: ${maxBudget.toLocaleString()}/mo
                </label>
                <input
                  type="range"
                  min={400}
                  max={1500}
                  step={50}
                  value={maxBudget}
                  onChange={(event) => setMaxBudget(Number(event.target.value))}
                  className="mt-1.5 w-full accent-teal-500"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">{filtered.length} published profile{filtered.length !== 1 ? "s" : ""} found</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((profile) => {
              const score = calculateMatchScore(myProfile, profile);
              const relatedRequest = requestMap.get(profile.id);

              let actionLabel = "Send Request";
              let actionDisabled = false;
              let actionKind: "send" | "message" | "none" = "send";

              if (relatedRequest?.status === "pending") {
                if (relatedRequest.sender_id === myProfile?.id) {
                  actionLabel = "Request Sent";
                  actionDisabled = true;
                  actionKind = "none";
                } else {
                  actionLabel = "Respond in Requests";
                  actionDisabled = true;
                  actionKind = "none";
                }
              } else if (relatedRequest?.status === "accepted") {
                actionLabel = "Message";
                actionKind = "message";
              } else if (relatedRequest?.status === "rejected") {
                actionLabel = "Request Rejected";
                actionDisabled = true;
                actionKind = "none";
              }

              return (
                <div key={profile.id} className="rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientForId(profile.id)} text-lg font-extrabold text-white shadow-md`}>
                      {initialsFromName(profile.username)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{profile.username}</h3>
                            {profile.is_verified && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-500">
                                <span>Verified</span>
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            from {profile.country ?? "Unknown"} · {profile.gender ?? "Not set"}
                          </p>
                        </div>
                        <ScoreBadge score={score} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>University: {profile.university ?? "Not set"}</span>
                        <span>City: {profile.city ?? "Not set"}</span>
                        <span>Budget: ${profile.budget_min ?? 0}-${profile.budget_max ?? 0}/mo</span>
                        <span>Move in: {formatMoveInDate(profile.move_in_date)}</span>
                        <span>Room: {roomTypeLabel(profile.room_preference)}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {(profile.lifestyle ?? []).map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {expanded === profile.id && (
                        <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                          {profile.bio ?? "No bio added yet."}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <button
                          type="button"
                          disabled={actionDisabled || requestBusyId === profile.id}
                          onClick={() => {
                            if (actionKind === "message") {
                              void handleOpenAcceptedChat(profile.id);
                              return;
                            }
                            if (actionKind === "send") {
                              void handleSendRequest(profile.id);
                            }
                          }}
                          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                            actionKind === "message"
                              ? "bg-teal-500 text-white hover:bg-teal-600"
                              : actionDisabled
                                ? "cursor-not-allowed bg-slate-100 text-slate-500"
                                : "bg-teal-500 text-white hover:bg-teal-600"
                          }`}
                        >
                          {requestBusyId === profile.id ? "Working..." : actionLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpanded(expanded === profile.id ? null : profile.id)}
                          className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          {expanded === profile.id ? "Hide Profile" : "View Profile"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center">
              <p className="font-semibold text-slate-600">No published roommate profiles match your filters</p>
              <p className="mt-1 text-sm text-slate-400">Try adjusting your search criteria</p>
            </div>
          )}
        </>
      )}

      {!loading && activeTab === "requests" && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center">
              <p className="font-semibold text-slate-600">No incoming roommate requests</p>
              <p className="mt-1 text-sm text-slate-400">Requests sent to you will appear here.</p>
            </div>
          ) : (
            incomingRequests.map((request) => {
              const sender = request.sender_profile;
              return (
                <div key={request.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientForId(sender?.id ?? request.sender_id)} text-sm font-extrabold text-white`}>
                        {initialsFromName(sender?.username ?? "Roommate")}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{sender?.username ?? "Roommate"}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            request.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700"
                              : request.status === "rejected"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {sender?.city ?? "Unknown city"} · {sender?.university ?? "University not set"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Sent {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {request.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleRespond(request.id, "accepted", request.sender_id)}
                            disabled={requestBusyId === request.id}
                            className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleRespond(request.id, "rejected", request.sender_id)}
                            disabled={requestBusyId === request.id}
                            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      ) : request.status === "accepted" ? (
                        <button
                          type="button"
                          onClick={() => void handleOpenAcceptedChat(request.sender_id)}
                          disabled={requestBusyId === request.id}
                          className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                        >
                          Message
                        </button>
                      ) : (
                        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Roommate Profile</h3>
                <p className="mt-1 text-sm text-slate-500">Save as draft or publish when you are ready to be visible.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select value={form.country} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select country</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <select value={form.university} onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select university</option>
                  {universityOptions.map((university) => (
                    <option key={university} value={university}>{university}</option>
                  ))}
                </select>
                <select value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select city</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <select value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <select value={form.roommatePreferredGender} onChange={(e) => setForm((prev) => ({ ...prev, roommatePreferredGender: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="Any">Preferred roommate gender: Any</option>
                  <option value="Male">Preferred roommate gender: Male</option>
                  <option value="Female">Preferred roommate gender: Female</option>
                </select>
                <input type="date" value={form.moveInDate} onChange={(e) => setForm((prev) => ({ ...prev, moveInDate: e.target.value }))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred room type</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {roomTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, roomPreference: option.value }))}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                        form.roomPreference === option.value
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="number" min="0" value={form.budgetMin} onChange={(e) => setForm((prev) => ({ ...prev, budgetMin: e.target.value }))} placeholder="Budget min" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <input type="number" min="0" value={form.budgetMax} onChange={(e) => setForm((prev) => ({ ...prev, budgetMax: e.target.value }))} placeholder="Budget max" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Lifestyle</p>
                <div className="flex flex-wrap gap-2">
                  {lifestyleOptions.map((tag) => {
                    const selected = form.lifestyle.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleLifestyleTag(tag)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selected ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</p>
                <textarea value={form.bio} onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))} rows={4} placeholder="Tell potential roommates about your routine, habits, and the kind of home you want." className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {formError}
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                Cancel
              </button>
              <button
                onClick={() => void handleSaveProfile(false)}
                disabled={saving}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                onClick={() => void handleSaveProfile(true)}
                disabled={saving}
                className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Publish Profile"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
