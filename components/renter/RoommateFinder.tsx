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

type ProvinceOption = {
  name: string;
  code: string;
  cities: string[];
};

const genderOptions = ["Any", "Male", "Female"];
const countryOptions = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Bangladesh", "Belgium", "Brazil", "Canada",
  "Chile", "China", "Colombia", "Egypt", "Ethiopia", "France", "Germany", "Ghana", "India", "Indonesia", "Iran",
  "Iraq", "Ireland", "Italy", "Japan", "Jordan", "Kenya", "Lebanon", "Malaysia", "Mexico", "Morocco", "Nepal",
  "Netherlands", "New Zealand", "Nigeria", "Pakistan", "Peru", "Philippines", "Portugal", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Syria", "Thailand", "Tunisia",
  "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Vietnam", "Zimbabwe",
  "Other",
];
const locationOptions: Record<string, ProvinceOption[]> = {
  Canada: [
    { name: "Alberta", code: "AB", cities: ["Calgary", "Edmonton", "Red Deer"] },
    { name: "British Columbia", code: "BC", cities: ["Burnaby", "Kelowna", "Richmond", "Surrey", "Vancouver", "Victoria"] },
    { name: "Manitoba", code: "MB", cities: ["Brandon", "Winnipeg"] },
    { name: "New Brunswick", code: "NB", cities: ["Fredericton", "Moncton", "Saint John"] },
    { name: "Newfoundland and Labrador", code: "NL", cities: ["Corner Brook", "St. John's"] },
    { name: "Nova Scotia", code: "NS", cities: ["Halifax", "Sydney"] },
    { name: "Ontario", code: "ON", cities: ["Hamilton", "Kingston", "Kitchener", "London", "Mississauga", "Ottawa", "Toronto", "Waterloo", "Windsor"] },
    { name: "Prince Edward Island", code: "PE", cities: ["Charlottetown"] },
    { name: "Quebec", code: "QC", cities: ["Gatineau", "Laval", "Montreal", "Quebec City", "Sherbrooke"] },
    { name: "Saskatchewan", code: "SK", cities: ["Regina", "Saskatoon"] },
  ],
  "United States": [
    { name: "California", code: "CA", cities: ["Los Angeles", "San Diego", "San Francisco"] },
    { name: "Illinois", code: "IL", cities: ["Chicago"] },
    { name: "Massachusetts", code: "MA", cities: ["Boston"] },
    { name: "Michigan", code: "MI", cities: ["Detroit"] },
    { name: "New York", code: "NY", cities: ["Buffalo", "New York City"] },
    { name: "Texas", code: "TX", cities: ["Austin", "Dallas", "Houston"] },
  ],
  India: [
    { name: "Delhi", code: "DL", cities: ["New Delhi"] },
    { name: "Gujarat", code: "GJ", cities: ["Ahmedabad", "Surat", "Vadodara"] },
    { name: "Karnataka", code: "KA", cities: ["Bengaluru", "Mysuru"] },
    { name: "Maharashtra", code: "MH", cities: ["Mumbai", "Pune"] },
    { name: "Punjab", code: "PB", cities: ["Amritsar", "Ludhiana"] },
    { name: "Tamil Nadu", code: "TN", cities: ["Chennai", "Coimbatore"] },
  ],
  "United Kingdom": [
    { name: "England", code: "ENG", cities: ["Birmingham", "London", "Manchester"] },
    { name: "Scotland", code: "SCT", cities: ["Edinburgh", "Glasgow"] },
  ],
  Australia: [
    { name: "New South Wales", code: "NSW", cities: ["Newcastle", "Sydney"] },
    { name: "Victoria", code: "VIC", cities: ["Geelong", "Melbourne"] },
  ],
};
const moveToCountries = Object.keys(locationOptions);
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
  "Gym routine",
  "Work from home",
  "Religious",
  "No parties",
  "Weekend traveler",
  "Shared cooking",
  "Music friendly",
  "Minimalist",
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

function formatCooldownMessage(rejectedAt: string | null): string {
  if (!rejectedAt) return "You can send another request after 48 hours";
  const nextAllowed = new Date(new Date(rejectedAt).getTime() + 48 * 60 * 60 * 1000);
  if (Number.isNaN(nextAllowed.getTime())) return "You can send another request after 48 hours";
  return `Available to request again on ${nextAllowed.toLocaleString()}`;
}

function splitLegacyCity(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) {
    return { city: "", province: "" };
  }

  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return { city: raw, province: "" };
  }

  return { city: parts[0], province: parts[1] };
}

function buildLegacyCity(country: string, province: string, city: string): string | null {
  if (!city.trim()) return null;
  if (!province.trim()) return city.trim();

  const provinceEntry = (locationOptions[country] ?? []).find(
    (option) => option.name === province || option.code === province,
  );

  return `${city.trim()}, ${provinceEntry?.code ?? province.trim()}`;
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
    gender: "",
    moveToCountry: "Canada",
    moveToProvince: "",
    moveToCity: "",
    roommatePreferredGender: "Any",
    budgetMin: "",
    budgetMax: "",
    moveInDate: "",
    roomPreference: "",
    lifestyle: [] as string[],
    customLifestyle: "",
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
      const fallbackLocation = splitLegacyCity(mine.city);
      setForm({
        country: mine.country ?? "",
        university: mine.university ?? "",
        gender: mine.gender ?? "",
        moveToCountry: mine.move_to_country ?? "Canada",
        moveToProvince: mine.move_to_province ?? fallbackLocation.province,
        moveToCity: mine.move_to_city ?? fallbackLocation.city,
        roommatePreferredGender: mine.roommate_preferred_gender ?? "Any",
        budgetMin: mine.budget_min?.toString() ?? "",
        budgetMax: mine.budget_max?.toString() ?? "",
        moveInDate: mine.move_in_date ?? "",
        roomPreference: mine.room_preference ?? "",
        lifestyle: (mine.lifestyle ?? []).filter((tag) => lifestyleOptions.includes(tag)),
        customLifestyle: (mine.lifestyle ?? []).filter((tag) => !lifestyleOptions.includes(tag)).join(", "),
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

  const availableMoveToProvinces = locationOptions[form.moveToCountry] ?? [];
  const availableMoveToCities = availableMoveToProvinces.find((province) => province.name === form.moveToProvince)?.cities ?? [];

  function setFormField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleMoveToCountryChange(value: string) {
    setForm((prev) => ({
      ...prev,
      moveToCountry: value,
      moveToProvince: "",
      moveToCity: "",
    }));
  }

  function handleMoveToProvinceChange(value: string) {
    setForm((prev) => ({
      ...prev,
      moveToProvince: value,
      moveToCity: "",
    }));
  }

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
    if (publish && (!form.moveToCountry || !form.moveToProvince || !form.moveToCity || !form.university || !form.gender || !form.roomPreference)) {
      setFormError("Complete your move preferences, university, gender, and room type before publishing.");
      return;
    }

    setSaving(true);
    setError("");
    setFormError("");
    try {
      const allLifestyleTags = [
        ...form.lifestyle,
        ...form.customLifestyle.split(",").map((tag) => tag.trim()).filter(Boolean),
      ];
      const updated = await saveRenterProfile(myProfile.id, {
        country: form.country || null,
        university: form.university || null,
        city: buildLegacyCity(form.moveToCountry, form.moveToProvince, form.moveToCity),
        move_to_country: form.moveToCountry || null,
        move_to_province: form.moveToProvince || null,
        move_to_city: form.moveToCity || null,
        gender: form.gender || null,
        roommate_preferred_gender: form.roommatePreferredGender || null,
        budget_min: budgetMin,
        budget_max: budgetMax,
        move_in_date: form.moveInDate || null,
        room_preference: form.roomPreference || null,
        lifestyle: Array.from(new Set(allLifestyleTags)),
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
      await sendRoommateRequest(receiverId);
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
      await updateRoommateRequestStatus(requestId, response);
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

  const pendingIncomingCount = useMemo(
    () => incomingRequests.filter((request) => request.status === "pending").length,
    [incomingRequests],
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
          { id: "requests" as const, label: `Requests (${pendingIncomingCount})` },
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
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Move-To City</label>
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
              let helperMessage = "";

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
                const rejectedAt = relatedRequest.rejected_at ? new Date(relatedRequest.rejected_at) : null;
                const nextAllowed = rejectedAt ? new Date(rejectedAt.getTime() + 48 * 60 * 60 * 1000) : null;
                if (nextAllowed && nextAllowed > new Date()) {
                  actionLabel = "Request Rejected";
                  actionDisabled = true;
                  actionKind = "none";
                  helperMessage = formatCooldownMessage(relatedRequest.rejected_at);
                }
              } else if (relatedRequest?.status === "expired") {
                actionLabel = "Request Expired";
                helperMessage = "Request expired";
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
                            from {profile.country ?? "Unknown"} - {profile.gender ?? "Not set"}
                          </p>
                        </div>
                        <ScoreBadge score={score} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span>University: {profile.university ?? "Not set"}</span>
                        <span>Move to: {profile.city ?? "Not set"}</span>
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
                      {helperMessage && (
                        <p className="mt-2 text-xs font-medium text-amber-700">{helperMessage}</p>
                      )}
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
                              : request.status === "expired"
                                ? "bg-slate-100 text-slate-600"
                              : request.status === "rejected"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Move to {sender?.city ?? "Unknown city"} - {sender?.university ?? "University not set"}
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
                      ) : request.status === "expired" ? (
                        <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
                          Request expired
                        </span>
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
                <p className="mt-1 text-sm text-slate-500">Tell other renters where you are from and where you want to move.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-xs font-medium text-teal-700">
                Pre-filled from your profile. Update anything here before you publish.
              </div>

              <section className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Basic Information</h4>
                  <p className="mt-1 text-xs text-slate-400">Tell others where you are from and a bit about your current background.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    list="roommate-origin-country-options"
                    value={form.country}
                    onChange={(e) => setFormField("country", e.target.value)}
                    placeholder="Country of origin"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="roommate-origin-country-options">
                    {countryOptions.map((country) => (
                      <option key={country} value={country} />
                    ))}
                  </datalist>
                  <input
                    value={form.university}
                    onChange={(e) => setFormField("university", e.target.value)}
                    placeholder="University / workplace"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <select value={form.gender} onChange={(e) => setFormField("gender", e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Move Preferences</h4>
                  <p className="mt-1 text-xs text-slate-400">Choose where you want to move and when you plan to move in.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    list="roommate-move-country-options"
                    value={form.moveToCountry}
                    onChange={(e) => handleMoveToCountryChange(e.target.value)}
                    placeholder="Select Country"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="roommate-move-country-options">
                    {moveToCountries.map((country) => (
                      <option key={country} value={country} />
                    ))}
                  </datalist>
                  <select
                    value={form.moveToProvince}
                    onChange={(e) => handleMoveToProvinceChange(e.target.value)}
                    disabled={!form.moveToCountry}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Select Province</option>
                    {availableMoveToProvinces.map((province) => (
                      <option key={province.code} value={province.name}>{province.name}</option>
                    ))}
                  </select>
                  <input
                    list="roommate-move-city-options"
                    value={form.moveToCity}
                    onChange={(e) => setFormField("moveToCity", e.target.value)}
                    disabled={!form.moveToProvince}
                    placeholder="Search City"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <datalist id="roommate-move-city-options">
                    {availableMoveToCities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                  <input
                    type="date"
                    value={form.moveInDate}
                    onChange={(e) => setFormField("moveInDate", e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input type="number" min="0" value={form.budgetMin} onChange={(e) => setFormField("budgetMin", e.target.value)} placeholder="Budget min" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  <input type="number" min="0" value={form.budgetMax} onChange={(e) => setFormField("budgetMax", e.target.value)} placeholder="Budget max" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Budget min: ${form.budgetMin || 0}</span>
                    <span>Budget max: ${form.budgetMax || 1500}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input type="range" min="0" max="3000" step="50" value={form.budgetMin || 0} onChange={(e) => setFormField("budgetMin", e.target.value)} className="w-full accent-teal-500" />
                    <input type="range" min="0" max="3000" step="50" value={form.budgetMax || 1500} onChange={(e) => setFormField("budgetMax", e.target.value)} className="w-full accent-teal-500" />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Room Preferences</h4>
                  <p className="mt-1 text-xs text-slate-400">Set the room type you want and who you would prefer to live with.</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Room Type</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {roomTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormField("roomPreference", option.value)}
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
                <select value={form.roommatePreferredGender} onChange={(e) => setFormField("roommatePreferredGender", e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="Any">Preferred roommate gender: Any</option>
                  <option value="Male">Preferred roommate gender: Male</option>
                  <option value="Female">Preferred roommate gender: Female</option>
                </select>
              </section>

              <section className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Lifestyle Preferences</h4>
                  <p className="mt-1 text-xs text-slate-400">Keep the chips that match your day-to-day living style.</p>
                </div>
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
                <input
                  value={form.customLifestyle}
                  onChange={(e) => setFormField("customLifestyle", e.target.value)}
                  placeholder="Add personal lifestyle tags, comma separated"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-slate-400">Example: Prayer routine, Early classes, Loves cooking</p>
              </section>

              <section className="space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">About You</h4>
                  <p className="mt-1 text-xs text-slate-400">Give other renters a quick sense of your routine and what kind of home you want.</p>
                </div>
                <textarea value={form.bio} onChange={(e) => setFormField("bio", e.target.value)} rows={4} placeholder="Tell potential roommates about your routine, habits, and the kind of home you want." className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </section>
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
