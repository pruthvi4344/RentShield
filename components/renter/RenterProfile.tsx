"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { RenterProfileRecord } from "@/types/profiles";

type Props = {
  profile: RenterProfileRecord | null;
  onSave: (updates: Partial<Omit<RenterProfileRecord, "id" | "created_at" | "updated_at">>) => Promise<void>;
  saving?: boolean;
};

type DraftProfile = {
  username: string;
  email: string;
  phone: string;
  gender: string;
  move_in_date: string;
  budget_min: number | "";
  budget_max: number | "";
  room_preference: string;
  move_to_country: string;
  move_to_province: string;
  move_to_city: string;
  move_to_postal_code: string;
  country: string;
  university: string;
  lifestyle: string[];
  bio: string;
};

type ProvinceOption = {
  name: string;
  code: string;
  cities: string[];
};

const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

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

const roomPreferenceOptions = [
  { value: "", label: "Select room preference" },
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" },
  { value: "shared_apartment", label: "Shared Apartment" },
  { value: "apartment", label: "Apartment" },
  { value: "condo_room", label: "Condo Room" },
  { value: "studio", label: "Studio" },
  { value: "basement_room", label: "Basement Room" },
  { value: "any", label: "Any" },
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

const countries = Object.keys(locationOptions);
const originCountryOptions = [
  ...countries,
  "Brazil",
  "China",
  "Egypt",
  "France",
  "Germany",
  "Nigeria",
  "Pakistan",
  "Philippines",
  "South Korea",
  "UAE",
  "Vietnam",
];

function formatPhoneNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatCanadianPostalCode(value: string): string {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (normalized.length <= 3) {
    return normalized;
  }
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

function icon(kind: "person" | "calendar" | "location" | "background" | "lifestyle") {
  const common = "h-4 w-4 text-teal-500";
  switch (kind) {
    case "person":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1118.879 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
        </svg>
      );
    case "location":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "background":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a4 4 0 100 8m0-8a4 4 0 110 8m-6 6h12" />
        </svg>
      );
    default:
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A4 4 0 006 12.367v.266A4 4 0 0011.556 16l3.196-2.132a4 4 0 000-5.664z" />
        </svg>
      );
  }
}

function getRoomPreferenceLabel(value: string | null | undefined): string {
  const match = roomPreferenceOptions.find((option) => option.value === (value ?? ""));
  return match?.label ?? value ?? "Not set";
}

function buildLegacyCity(country: string, province: string, city: string): string | null {
  if (!city.trim()) return null;
  if (!province.trim()) return city.trim();

  const provinceEntry = (locationOptions[country] ?? []).find(
    (option) => option.name === province || option.code === province,
  );

  return `${city.trim()}, ${provinceEntry?.code ?? province.trim()}`;
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

function toDraft(profile: RenterProfileRecord): DraftProfile {
  const fallbackLocation = splitLegacyCity(profile.city);
  return {
    username: profile.username,
    email: profile.email,
    phone: profile.phone ?? "",
    gender: profile.gender ?? "",
    move_in_date: profile.move_in_date ?? "",
    budget_min: profile.budget_min ?? "",
    budget_max: profile.budget_max ?? "",
    room_preference: profile.room_preference ?? "",
    move_to_country: profile.move_to_country ?? "Canada",
    move_to_province: profile.move_to_province ?? fallbackLocation.province,
    move_to_city: profile.move_to_city ?? fallbackLocation.city,
    move_to_postal_code: profile.move_to_postal_code ?? "",
    country: profile.country ?? "",
    university: profile.university ?? "",
    lifestyle: profile.lifestyle ?? [],
    bio: profile.bio ?? "",
  };
}

export default function RenterProfile({ profile, onSave, saving = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftProfile | null>(profile ? toDraft(profile) : null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initials = useMemo(() => {
    const name = draft?.username ?? profile?.username ?? "RS";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "RS";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [draft?.username, profile?.username]);

  if (!profile) {
    return <div className="text-sm text-slate-500">Loading profile...</div>;
  }

  const currentDraft = draft ?? toDraft(profile);
  const availableProvinces = locationOptions[currentDraft.move_to_country] ?? [];
  const availableCities = availableProvinces.find((province) => province.name === currentDraft.move_to_province)?.cities ?? [];

  function setField<K extends keyof DraftProfile>(key: K, value: DraftProfile[K]) {
    setDraft((prev) => ({ ...(prev ?? currentDraft), [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[String(key)];
      return next;
    });
  }

  function handleCountryChange(value: string) {
    setDraft((prev) => ({
      ...(prev ?? currentDraft),
      move_to_country: value,
      move_to_province: "",
      move_to_city: "",
      move_to_postal_code: "",
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.move_to_country;
      delete next.move_to_province;
      delete next.move_to_city;
      delete next.move_to_postal_code;
      return next;
    });
  }

  function handleProvinceChange(value: string) {
    setDraft((prev) => ({
      ...(prev ?? currentDraft),
      move_to_province: value,
      move_to_city: "",
      move_to_postal_code: "",
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.move_to_province;
      delete next.move_to_city;
      delete next.move_to_postal_code;
      return next;
    });
  }

  function toggleLifestyle(tag: string) {
    const current = currentDraft.lifestyle;
    if (current.includes(tag)) {
      setField("lifestyle", current.filter((item) => item !== tag));
      return;
    }
    setField("lifestyle", [...current, tag]);
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (currentDraft.phone.trim() && currentDraft.phone.trim().length !== 10) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (!currentDraft.move_to_country.trim()) {
      nextErrors.move_to_country = "Country is required.";
    }

    if (!currentDraft.move_to_province.trim()) {
      nextErrors.move_to_province = "Province is required.";
    }

    if (!currentDraft.move_to_city.trim()) {
      nextErrors.move_to_city = "City is required.";
    }

    if (currentDraft.move_to_country === "Canada" && currentDraft.move_to_postal_code.trim() && !postalCodeRegex.test(currentDraft.move_to_postal_code.trim())) {
      nextErrors.move_to_postal_code = "Enter a valid Canadian postal code in A1A 1A1 format.";
    }

    if (currentDraft.budget_min !== "" && currentDraft.budget_max !== "" && Number(currentDraft.budget_min) > Number(currentDraft.budget_max)) {
      nextErrors.budget_max = "Budget max must be greater than or equal to budget min.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    await onSave({
      username: currentDraft.username,
      email: currentDraft.email,
      phone: currentDraft.phone || null,
      gender: currentDraft.gender || null,
      move_in_date: currentDraft.move_in_date || null,
      budget_min: currentDraft.budget_min === "" ? null : Number(currentDraft.budget_min),
      budget_max: currentDraft.budget_max === "" ? null : Number(currentDraft.budget_max),
      room_preference: currentDraft.room_preference || null,
      move_to_country: currentDraft.move_to_country || null,
      move_to_province: currentDraft.move_to_province || null,
      move_to_city: currentDraft.move_to_city || null,
      move_to_postal_code: currentDraft.move_to_postal_code || null,
      city: buildLegacyCity(currentDraft.move_to_country, currentDraft.move_to_province, currentDraft.move_to_city),
      country: currentDraft.country || null,
      university: currentDraft.university || null,
      lifestyle: currentDraft.lifestyle,
      bio: currentDraft.bio || null,
    });

    setEditing(false);
  }

  function renderFieldError(key: string) {
    return errors[key] ? <p className="mt-1 text-xs font-medium text-rose-600">{errors[key]}</p> : null;
  }

  function renderInput(label: string, children: ReactNode, helper?: string) {
    return (
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
        {children}
        {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">My Profile</h2>
          <p className="mt-0.5 text-sm text-slate-500">Manage your personal information and preferences.</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-600"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setDraft(toDraft(profile));
                setErrors({});
              }}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-600 disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 text-2xl font-extrabold text-white shadow-lg">
            {initials}
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={currentDraft.username}
                onChange={(e) => setField("username", e.target.value)}
                className="w-full border-b-2 border-teal-400 bg-transparent pb-0.5 text-xl font-extrabold text-slate-900 outline-none"
              />
            ) : (
              <h3 className="text-xl font-extrabold text-slate-900">{profile.username}</h3>
            )}
            <p className="mt-1 text-xs text-slate-500">{profile.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            {icon("person")}
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">Personal Information</h4>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {renderInput(
              "Email",
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.email}</p>,
            )}
            {renderInput(
              "Phone Number",
              editing ? (
                <>
                  <input
                    value={currentDraft.phone}
                    onChange={(e) => setField("phone", formatPhoneNumber(e.target.value))}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit phone number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {renderFieldError("phone")}
                </>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.phone || "Not set"}</p>
              ),
            )}
            {renderInput(
              "Gender",
              editing ? (
                <select value={currentDraft.gender} onChange={(e) => setField("gender", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.gender || "Not set"}</p>
              ),
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            {icon("calendar")}
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">Move-in Preferences</h4>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {renderInput(
              "Target Move-in Date",
              editing ? (
                <input type="date" value={currentDraft.move_in_date} onChange={(e) => setField("move_in_date", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.move_in_date || "Not set"}</p>
              ),
            )}
            {renderInput(
              "Room Preference",
              editing ? (
                <select value={currentDraft.room_preference} onChange={(e) => setField("room_preference", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {roomPreferenceOptions.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{getRoomPreferenceLabel(profile.room_preference)}</p>
              ),
            )}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Monthly Budget Range</label>
              {editing ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <input type="number" value={currentDraft.budget_min} onChange={(e) => setField("budget_min", e.target.value === "" ? "" : Number(e.target.value))} placeholder="Budget min" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  <span className="text-center text-sm text-slate-400">to</span>
                  <div>
                    <input type="number" value={currentDraft.budget_max} onChange={(e) => setField("budget_max", e.target.value === "" ? "" : Number(e.target.value))} placeholder="Budget max" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    {renderFieldError("budget_max")}
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.budget_min ?? "-"} to {profile.budget_max ?? "-"} / month</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            {icon("location")}
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">Location Preferences</h4>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Country</label>
              {editing ? (
                <>
                  <input
                    list="move-to-country-options"
                    value={currentDraft.move_to_country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    placeholder="Select Country"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="move-to-country-options">
                    {countries.map((country) => (
                      <option key={country} value={country} />
                    ))}
                  </datalist>
                  {renderFieldError("move_to_country")}
                </>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.move_to_country || "Canada"}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Province</label>
              {editing ? (
                <>
                  <select
                    value={currentDraft.move_to_province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    disabled={!currentDraft.move_to_country}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Select Province</option>
                    {availableProvinces.map((province) => (
                      <option key={province.code} value={province.name}>{province.name}</option>
                    ))}
                  </select>
                  {renderFieldError("move_to_province")}
                </>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.move_to_province || "Not set"}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">City</label>
              {editing ? (
                <>
                  <input
                    list="move-to-city-options"
                    value={currentDraft.move_to_city}
                    onChange={(e) => setField("move_to_city", e.target.value)}
                    disabled={!currentDraft.move_to_province}
                    placeholder="Search City"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <datalist id="move-to-city-options">
                    {availableCities.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                  {renderFieldError("move_to_city")}
                </>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.move_to_city || splitLegacyCity(profile.city).city || "Not set"}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Postal Code</label>
              {editing ? (
                <>
                  <input
                    value={currentDraft.move_to_postal_code}
                    onChange={(e) => setField("move_to_postal_code", formatCanadianPostalCode(e.target.value))}
                    inputMode="text"
                    maxLength={7}
                    placeholder="A1A 1A1"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {renderFieldError("move_to_postal_code")}
                </>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.move_to_postal_code || "Not set"}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            {icon("background")}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">Background Information</h4>
              <p className="mt-0.5 text-xs text-slate-400">This helps us personalize recommendations and roommate matching.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Country of Origin</label>
              {editing ? (
                <>
                  <input
                    list="origin-country-options"
                    value={currentDraft.country}
                    onChange={(e) => setField("country", e.target.value)}
                    placeholder="Select Country"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <datalist id="origin-country-options">
                    {originCountryOptions.map((country) => (
                      <option key={country} value={country} />
                    ))}
                  </datalist>
                </>
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.country || "Not set"}</p>
              )}
            </div>
            {renderInput(
              "University / Workplace",
              editing ? (
                <input value={currentDraft.university} onChange={(e) => setField("university", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
              ) : (
                <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800">{profile.university || "Not set"}</p>
              ),
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            {icon("lifestyle")}
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">Lifestyle Preferences</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {(editing ? lifestyleOptions : currentDraft.lifestyle).map((tag) => {
              const selected = currentDraft.lifestyle.includes(tag);
              return editing ? (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleLifestyle(tag)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected ? "border-teal-300 bg-teal-100 text-teal-700" : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {selected ? "Selected - " : ""}
                  {tag}
                </button>
              ) : (
                <span key={tag} className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700">
                  {tag}
                </span>
              );
            })}
            {!editing && currentDraft.lifestyle.length === 0 && <span className="text-sm text-slate-500">No preferences added yet.</span>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">About Me</h4>
          {editing ? (
            <textarea
              value={currentDraft.bio}
              onChange={(e) => setField("bio", e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          ) : (
            <p className="text-sm leading-relaxed text-slate-700">{currentDraft.bio || "No bio added yet."}</p>
          )}
        </section>
      </div>
    </div>
  );
}
