"use client";

import { useMemo, useState } from "react";
import { createLandlordListing } from "@/lib/landlordListingService";
import { getAuthIdentity } from "@/lib/profileService";

const STEPS = ["Basic Info", "Details & Price", "Amenities", "Photos", "Availability"];
const propertyTypes = ["Apartment", "Condo", "Basement", "Private Room", "Shared Room"];
const cities = ["Toronto, ON", "Vancouver, BC", "Waterloo, ON", "Montreal, QC", "Ottawa, ON", "Calgary, AB"];
const amenityList = ["wifi", "laundry", "parking", "balcony", "gym", "dishwasher", "ac", "storage", "elevator", "security"];
const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white";
const selectClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white";

type FormState = {
  title: string;
  type: string;
  address: string;
  city: string;
  postalCode: string;
  beds: string;
  baths: string;
  sqft: string;
  furnished: "furnished" | "unfurnished" | "partially";
  rent: string;
  deposit: string;
  utilitiesIncluded: boolean;
  amenities: string[];
  moveIn: string;
  leaseDuration: string;
};

const initialForm: FormState = {
  title: "",
  type: "",
  address: "",
  city: "",
  postalCode: "",
  beds: "1",
  baths: "1",
  sqft: "",
  furnished: "furnished",
  rent: "",
  deposit: "",
  utilitiesIncluded: false,
  amenities: [],
  moveIn: "",
  leaseDuration: "12",
};

type Props = {
  onCreated?: () => void;
};

export default function AddPropertyDynamic({ onCreated }: Props) {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(id: string) {
    set("amenities", form.amenities.includes(id) ? form.amenities.filter((a) => a !== id) : [...form.amenities, id]);
  }

  function handlePhotoPick(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024);
    setPhotos((prev) => [...prev, ...selected].slice(0, 20));
    if (selected.length !== files.length) {
      setError("Some files were skipped. Only images up to 5MB are allowed.");
    } else {
      setError("");
    }
  }

  const summaryRent = useMemo(() => (form.rent ? `$${Number(form.rent).toLocaleString()}/mo` : "-"), [form.rent]);

  async function submitListing() {
    setError("");
    if (!form.title || !form.type || !form.address || !form.city || !form.rent) {
      setError("Please fill required fields: title, type, address, city, rent.");
      return;
    }

    const auth = await getAuthIdentity();
    if (!auth || auth.role !== "landlord") {
      setError("Landlord session not found. Please login again.");
      return;
    }

    setSubmitting(true);
    try {
      await createLandlordListing(
        auth.id,
        {
          title: form.title,
          property_type: form.type,
          street_address: form.address,
          city: form.city,
          postal_code: form.postalCode || null,
          bedrooms: Number(form.beds || 1),
          bathrooms: Number(form.baths || 1),
          square_feet: form.sqft ? Number(form.sqft) : null,
          furnished_status: form.furnished,
          monthly_rent: Number(form.rent),
          security_deposit: form.deposit ? Number(form.deposit) : null,
          utilities_included: form.utilitiesIncluded,
          amenities: form.amenities,
          available_from: form.moveIn || null,
          lease_duration_months: form.leaseDuration ? Number(form.leaseDuration) : null,
          status: "pending",
        },
        photos,
      );
      setSubmitted(true);
      onCreated?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit listing.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mb-5">OK</div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Listing Submitted</h2>
        <p className="text-slate-500 text-sm max-w-sm mb-6">Your property is saved and now visible in My Listings.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setStep(0);
            setForm(initialForm);
            setPhotos([]);
          }}
          className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl"
        >
          Add Another Property
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Add New Property</h2>
        <p className="text-sm text-slate-500 mt-0.5">Fill in the details to list your property on RentShield.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 ${i <= step ? "text-teal-600" : "text-slate-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"}`}>{i + 1}</div>
                <span className="text-xs font-medium hidden sm:block whitespace-nowrap">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < step ? "bg-teal-400" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Basic Information</h3>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Property title" className={fieldClass} />
            <div className="grid grid-cols-3 gap-2">
              {propertyTypes.map((t) => (
                <button key={t} type="button" onClick={() => set("type", t)} className={`py-2.5 rounded-xl border text-sm font-medium ${form.type === t ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600"}`}>{t}</button>
              ))}
            </div>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street address" className={fieldClass} />
            <div className="grid grid-cols-2 gap-3">
              <select value={form.city} onChange={(e) => set("city", e.target.value)} className={selectClass}>
                <option value="">Select city</option>
                {cities.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} placeholder="Postal code" className={fieldClass} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Property Details & Pricing</h3>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" min="1" value={form.beds} onChange={(e) => set("beds", e.target.value)} placeholder="Bedrooms" className={fieldClass} />
              <input type="number" min="1" value={form.baths} onChange={(e) => set("baths", e.target.value)} placeholder="Bathrooms" className={fieldClass} />
              <input value={form.sqft} onChange={(e) => set("sqft", e.target.value)} placeholder="Square feet" className={fieldClass} />
            </div>
            <div className="flex gap-2">
              {(["furnished", "unfurnished", "partially"] as const).map((v) => (
                <button key={v} type="button" onClick={() => set("furnished", v)} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize ${form.furnished === v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600"}`}>{v}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={form.rent} onChange={(e) => set("rent", e.target.value)} placeholder="Monthly rent" className={fieldClass} />
              <input type="number" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} placeholder="Deposit" className={fieldClass} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenityList.map((a) => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium ${form.amenities.includes(a) ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600"}`}>{a}</button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Property Photos</h3>
            <label className="cursor-pointer">
              <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handlePhotoPick(e.target.files)} />
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-10 text-center">
                <p className="text-sm font-semibold text-slate-700">Click to upload photos</p>
                <p className="text-xs text-slate-400 mt-1">{photos.length} selected</p>
              </div>
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Availability</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={form.moveIn} onChange={(e) => set("moveIn", e.target.value)} className={fieldClass} />
              <select value={form.leaseDuration} onChange={(e) => set("leaseDuration", e.target.value)} className={selectClass}>
                {["3", "6", "8", "12", "16", "24"].map((d) => <option key={d} value={d}>{d} months</option>)}
              </select>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Listing Summary</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <span className="text-slate-400">Title</span><span className="font-medium">{form.title || "-"}</span>
                <span className="text-slate-400">Type</span><span className="font-medium">{form.type || "-"}</span>
                <span className="text-slate-400">City</span><span className="font-medium">{form.city || "-"}</span>
                <span className="text-slate-400">Rent</span><span className="font-medium">{summaryRent}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || submitting} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl disabled:opacity-40">
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={submitting} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl">
            Continue
          </button>
        ) : (
          <button onClick={() => void submitListing()} disabled={submitting} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl disabled:opacity-70">
            {submitting ? "Submitting..." : "Submit Listing"}
          </button>
        )}
      </div>
    </div>
  );
}
