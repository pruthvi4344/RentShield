"use client";

import { useState } from "react";

const listings = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=75",
    city: "Toronto, ON",
    neighbourhood: "Downtown / Spadina",
    type: "Condo",
    price: 2200,
    beds: 1,
    baths: 1,
    amenities: ["Gym", "Laundry", "Parking"],
    landlordName: "James T.",
    verified: true,
    rating: 4.9,
    reviews: 12,
    tag: "Near UofT",
    furnished: true,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=75",
    city: "Vancouver, BC",
    neighbourhood: "Kitsilano",
    type: "Apartment",
    price: 1950,
    beds: 1,
    baths: 1,
    amenities: ["Utilities Incl.", "Pet Friendly", "Balcony"],
    landlordName: "Sarah M.",
    verified: true,
    rating: 4.8,
    reviews: 9,
    tag: "UBC Nearby",
    furnished: false,
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=75",
    city: "Waterloo, ON",
    neighbourhood: "Uptown Waterloo",
    type: "Private Room",
    price: 850,
    beds: 1,
    baths: 1,
    amenities: ["WiFi", "Furnished", "All Inclusive"],
    landlordName: "Raj P.",
    verified: true,
    rating: 5.0,
    reviews: 7,
    tag: "Student Friendly",
    furnished: true,
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=500&q=75",
    city: "Montréal, QC",
    neighbourhood: "Plateau-Mont-Royal",
    type: "Basement",
    price: 1100,
    beds: 1,
    baths: 1,
    amenities: ["Laundry", "Storage", "Quiet Area"],
    landlordName: "Marie L.",
    verified: true,
    rating: 4.7,
    reviews: 15,
    tag: "Near McGill",
    furnished: false,
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&q=75",
    city: "Toronto, ON",
    neighbourhood: "Scarborough",
    type: "Shared Room",
    price: 650,
    beds: 1,
    baths: 1,
    amenities: ["WiFi", "Bills Included", "Bus Stop"],
    landlordName: "David K.",
    verified: true,
    rating: 4.5,
    reviews: 4,
    tag: "Budget Friendly",
    furnished: true,
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=75",
    city: "Ottawa, ON",
    neighbourhood: "Sandy Hill",
    type: "Apartment",
    price: 1600,
    beds: 2,
    baths: 1,
    amenities: ["Parking", "Dishwasher", "Near Transit"],
    landlordName: "Fatima A.",
    verified: true,
    rating: 4.9,
    reviews: 20,
    tag: "Near uOttawa",
    furnished: false,
  },
];

const cities = ["All Cities", "Toronto, ON", "Vancouver, BC", "Waterloo, ON", "Montréal, QC", "Ottawa, ON"];
const types = ["All Types", "Apartment", "Condo", "Basement", "Private Room", "Shared Room"];

export default function RenterListings() {
  const [saved, setSaved] = useState<number[]>([]);
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [maxPrice, setMaxPrice] = useState(3000);
  const [furnishedFilter, setFurnishedFilter] = useState<"all" | "furnished" | "unfurnished">("all");

  const filtered = listings.filter((l) => {
    if (cityFilter !== "All Cities" && l.city !== cityFilter) return false;
    if (typeFilter !== "All Types" && l.type !== typeFilter) return false;
    if (l.price > maxPrice) return false;
    if (furnishedFilter === "furnished" && !l.furnished) return false;
    if (furnishedFilter === "unfurnished" && l.furnished) return false;
    return true;
  });

  function toggleSave(id: number) {
    setSaved((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Find Listings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Browse verified rental listings across Canada.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Property Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Max Price: ${maxPrice.toLocaleString()}/mo
            </label>
            <input
              type="range"
              min={500}
              max={3000}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
              className="w-full accent-teal-500 mt-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Furnished</label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
              {(["all", "furnished", "unfurnished"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setFurnishedFilter(v)}
                  className={`flex-1 py-2 capitalize transition-colors ${
                    furnishedFilter === v ? "bg-teal-500 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {v === "all" ? "All" : v === "furnished" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">{filtered.length} listing{filtered.length !== 1 ? "s" : ""} found</p>
      </div>

      {/* Listing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((listing) => (
          <div key={listing.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
            {/* Image */}
            <div className="relative h-44 overflow-hidden bg-slate-200">
              <img
                src={listing.image}
                alt={listing.type}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 left-2">
                <span className="px-2.5 py-1 bg-slate-900/70 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                  {listing.tag}
                </span>
              </div>
              <div className="absolute top-2 right-2">
                <span className="px-2.5 py-1 bg-white/90 text-slate-700 text-xs font-semibold rounded-full">
                  {listing.type}
                </span>
              </div>
              <button
                onClick={() => toggleSave(listing.id)}
                className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  saved.includes(listing.id)
                    ? "bg-teal-500 text-white"
                    : "bg-white/90 text-slate-400 hover:text-teal-500"
                }`}
              >
                <svg className="w-4 h-4" fill={saved.includes(listing.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xl font-extrabold text-slate-900">${listing.price.toLocaleString()}</span>
                <span className="text-slate-400 text-sm">/mo</span>
              </div>
              <p className="text-xs text-slate-500 mb-3 truncate">
                📍 {listing.neighbourhood}, {listing.city}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {listing.amenities.map((a) => (
                  <span key={a} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{a}</span>
                ))}
              </div>

              {/* Landlord row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                    {listing.landlordName.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-slate-700">{listing.landlordName}</span>
                  {listing.verified && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 text-xs font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      ✓
                    </span>
                  )}
                </div>
                <button className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition-colors">
                  Contact
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🏚️</div>
          <p className="font-semibold text-slate-600">No listings match your filters</p>
          <p className="text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}