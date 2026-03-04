"use client";

import { useState } from "react";

const initialSaved = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=75",
    city: "Toronto, ON",
    neighbourhood: "Downtown / Spadina",
    type: "Condo",
    price: 2200,
    landlordName: "James T.",
    verified: true,
    savedDate: "Mar 2, 2026",
    tag: "Near UofT",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=75",
    city: "Waterloo, ON",
    neighbourhood: "Uptown Waterloo",
    type: "Private Room",
    price: 850,
    landlordName: "Raj P.",
    verified: true,
    savedDate: "Mar 1, 2026",
    tag: "Student Friendly",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=500&q=75",
    city: "Montréal, QC",
    neighbourhood: "Plateau-Mont-Royal",
    type: "Basement",
    price: 1100,
    landlordName: "Marie L.",
    verified: true,
    savedDate: "Feb 28, 2026",
    tag: "Near McGill",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=75",
    city: "Ottawa, ON",
    neighbourhood: "Sandy Hill",
    type: "Apartment",
    price: 1600,
    landlordName: "Fatima A.",
    verified: true,
    savedDate: "Feb 25, 2026",
    tag: "Near uOttawa",
  },
];

export default function SavedListings() {
  const [saved, setSaved] = useState(initialSaved);

  function remove(id: number) {
    setSaved((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Saved Listings</h2>
          <p className="text-sm text-slate-500 mt-0.5">{saved.length} propert{saved.length !== 1 ? "ies" : "y"} saved</p>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <div className="text-5xl mb-3">🔖</div>
          <p className="font-semibold text-slate-600 text-lg">No saved listings</p>
          <p className="text-sm mt-1">Listings you save will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {saved.map((listing) => (
            <div key={listing.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200 flex">
              {/* Image */}
              <div className="relative w-32 flex-shrink-0 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.type}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className="px-1.5 py-0.5 bg-slate-900/70 text-white text-xs font-medium rounded-md">
                    {listing.type}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold text-slate-900">${listing.price.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {listing.neighbourhood}, {listing.city}</p>
                  </div>
                  <button
                    onClick={() => remove(listing.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                    title="Remove from saved"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Landlord */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                    {listing.landlordName.charAt(0)}
                  </div>
                  <span className="text-xs text-slate-600">{listing.landlordName}</span>
                  {listing.verified && (
                    <span className="text-teal-500">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                  <p className="text-xs text-slate-400">Saved {listing.savedDate}</p>
                  <button className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition-colors">
                    Contact
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}