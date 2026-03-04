"use client";

import { useState } from "react";

const STEPS = ["Basic Info", "Details & Price", "Amenities", "Photos", "Availability"];

const propertyTypes = ["Apartment", "Condo", "Basement", "Private Room", "Shared Room"];
const cities = ["Toronto, ON", "Vancouver, BC", "Waterloo, ON", "Montréal, QC", "Ottawa, ON", "Calgary, AB"];

const amenityList = [
  { id: "wifi", label: "WiFi", icon: "📶" },
  { id: "laundry", label: "Laundry", icon: "🫧" },
  { id: "parking", label: "Parking", icon: "🚗" },
  { id: "balcony", label: "Balcony", icon: "🌿" },
  { id: "gym", label: "Gym", icon: "🏋️" },
  { id: "dishwasher", label: "Dishwasher", icon: "🍽️" },
  { id: "ac", label: "A/C", icon: "❄️" },
  { id: "storage", label: "Storage", icon: "📦" },
  { id: "elevator", label: "Elevator", icon: "🛗" },
  { id: "security", label: "Security System", icon: "🔐" },
];

export default function AddProperty() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    title: "", type: "", address: "", city: "", postalCode: "",
    beds: "1", baths: "1", sqft: "", furnished: "furnished",
    rent: "", deposit: "", utilitiesIncluded: false,
    amenities: [] as string[],
    moveIn: "", leaseDuration: "12",
  });

  function set(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(id: string) {
    set("amenities", form.amenities.includes(id) ? form.amenities.filter(a => a !== id) : [...form.amenities, id]);
  }

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mb-5">✅</div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Listing Submitted!</h2>
      <p className="text-slate-500 text-sm max-w-sm mb-6">Your property has been submitted for review. RentShield's team will approve it within 24 hours before it goes live.</p>
      <button onClick={() => { setSubmitted(false); setStep(0); }} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors">
        Add Another Property
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Add New Property</h2>
        <p className="text-sm text-slate-500 mt-0.5">Fill in the details to list your property on RentShield.</p>
      </div>

      {/* Progress steps */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 ${i <= step ? "text-teal-600" : "text-slate-400"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${i < step ? "bg-teal-500 text-white" : i === step ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500 ring-offset-1" : "bg-slate-100 text-slate-400"}`}>
                  {i < step ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block whitespace-nowrap">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < step ? "bg-teal-400" : "bg-slate-100"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Basic Information</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Property Title</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Modern Studio Near UofT" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Property Type</label>
              <div className="grid grid-cols-3 gap-2">
                {propertyTypes.map(t => (
                  <button key={t} type="button" onClick={() => set("type", t)} className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.type === t ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-teal-200"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Street Address</label>
              <input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, Unit 4A" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">City</label>
                <select value={form.city} onChange={e => set("city", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Postal Code</label>
                <input value={form.postalCode} onChange={e => set("postalCode", e.target.value)} placeholder="M5S 1A1" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Details & Price */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Property Details & Pricing</h3>
            <div className="grid grid-cols-3 gap-3">
              {[["beds", "Bedrooms"], ["baths", "Bathrooms"], ["sqft", "Square Feet"]].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type={key === "sqft" ? "text" : "number"} min="1" value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={key === "sqft" ? "e.g. 550" : "1"} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Furnished?</label>
              <div className="flex gap-2">
                {["furnished", "unfurnished", "partially"].map(v => (
                  <button key={v} type="button" onClick={() => set("furnished", v)} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium capitalize transition-colors ${form.furnished === v ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-600 hover:border-teal-200"}`}>{v}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Monthly Rent ($)</label>
                <input type="number" value={form.rent} onChange={e => set("rent", e.target.value)} placeholder="1200" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Security Deposit ($)</label>
                <input type="number" value={form.deposit} onChange={e => set("deposit", e.target.value)} placeholder="1200" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
              </div>
            </div>
            {/* Market hint */}
            {form.city && (
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-center gap-2">
                <span>📊</span>
                <p className="text-xs text-teal-700"><span className="font-semibold">Market Suggestion for {form.city}:</span> $900 – $1,400/month for similar properties</p>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <button type="button" onClick={() => set("utilitiesIncluded", !form.utilitiesIncluded)} className={`relative w-11 h-6 rounded-full transition-colors ${form.utilitiesIncluded ? "bg-teal-500" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.utilitiesIncluded ? "translate-x-5" : ""}`} />
              </button>
              <div>
                <p className="text-sm font-semibold text-slate-900">Utilities Included</p>
                <p className="text-xs text-slate-500">Heat, water, and electricity included in rent</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Amenities */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Amenities</h3>
            <p className="text-sm text-slate-500">Select all amenities available at your property.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenityList.map(a => (
                <button key={a.id} type="button" onClick={() => toggleAmenity(a.id)} className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-medium transition-all ${form.amenities.includes(a.id) ? "border-teal-400 bg-teal-50 text-teal-700 shadow-sm" : "border-slate-200 text-slate-600 hover:border-teal-200 bg-white"}`}>
                  <span>{a.icon}</span>
                  <span>{a.label}</span>
                  {form.amenities.includes(a.id) && <svg className="w-3.5 h-3.5 ml-auto text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
              ))}
            </div>
            {form.amenities.length === 0 && <p className="text-xs text-amber-600">💡 Tip: Properties with more amenities get more views</p>}
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Property Photos</h3>
            <p className="text-sm text-slate-500">Upload clear, well-lit photos. Listings with 5+ photos get 3× more inquiries.</p>
            <label className="cursor-pointer">
              <input type="file" className="hidden" multiple accept="image/*" />
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-10 text-center transition-colors group">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-600">Click to upload photos</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG · Max 5MB each · Up to 20 photos</p>
              </div>
            </label>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700"><span className="font-semibold">📸 Photo Tip:</span> Include photos of each room, the kitchen, bathroom, and building entrance. Natural lighting works best.</p>
            </div>
          </div>
        )}

        {/* Step 4: Availability */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Availability</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Move-in Date</label>
                <input type="date" value={form.moveIn} onChange={e => set("moveIn", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Lease Duration (months)</label>
                <select value={form.leaseDuration} onChange={e => set("leaseDuration", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {["3", "6", "8", "12", "16", "24"].map(d => <option key={d} value={d}>{d} months</option>)}
                </select>
              </div>
            </div>
            {/* Summary */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Listing Summary</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <span className="text-slate-400">Title</span><span className="font-medium">{form.title || "—"}</span>
                <span className="text-slate-400">Type</span><span className="font-medium">{form.type || "—"}</span>
                <span className="text-slate-400">City</span><span className="font-medium">{form.city || "—"}</span>
                <span className="text-slate-400">Rent</span><span className="font-medium">{form.rent ? `$${form.rent}/mo` : "—"}</span>
                <span className="text-slate-400">Beds/Baths</span><span className="font-medium">{form.beds} bd / {form.baths} ba</span>
                <span className="text-slate-400">Amenities</span><span className="font-medium">{form.amenities.length} selected</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            Continue →
          </button>
        ) : (
          <button onClick={() => setSubmitted(true)} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Submit Listing
          </button>
        )}
      </div>
    </div>
  );
}