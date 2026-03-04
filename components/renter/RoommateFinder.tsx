"use client";

import { useState } from "react";

const roommates = [
  {
    id: 1,
    initials: "KL",
    name: "Kim Lee",
    country: "South Korea",
    university: "University of Toronto",
    city: "Toronto, ON",
    budgetMin: 700,
    budgetMax: 950,
    moveIn: "Sept 2026",
    preference: "Shared Room",
    gender: "Female",
    lifestyle: ["Non-smoker", "Early riser", "Quiet household"],
    verified: true,
    score: 94,
    color: "from-violet-400 to-purple-500",
    bio: "CS undergrad looking for a clean, quiet roommate near UofT. Love cooking and hiking on weekends.",
  },
  {
    id: 2,
    initials: "OM",
    name: "Omar Mahmoud",
    country: "Egypt",
    university: "University of Waterloo",
    city: "Waterloo, ON",
    budgetMin: 500,
    budgetMax: 800,
    moveIn: "Aug 2026",
    preference: "Private Room",
    gender: "Male",
    lifestyle: ["Non-smoker", "Flexible schedule", "Tidy"],
    verified: true,
    score: 88,
    color: "from-teal-400 to-cyan-500",
    bio: "Engineering student from Egypt. Looking for budget-friendly housing near UW. Very tidy and quiet.",
  },
  {
    id: 3,
    initials: "AP",
    name: "Anika Patel",
    country: "India",
    university: "UBC Vancouver",
    city: "Vancouver, BC",
    budgetMin: 800,
    budgetMax: 1100,
    moveIn: "Sept 2026",
    preference: "Shared Apartment",
    gender: "Female",
    lifestyle: ["Vegetarian", "Non-smoker", "Early riser"],
    verified: true,
    score: 91,
    color: "from-amber-400 to-orange-400",
    bio: "MBA student. Vegetarian, non-smoker, very clean. Looking to share a 2-bed near UBC.",
  },
  {
    id: 4,
    initials: "LS",
    name: "Lucas Silva",
    country: "Brazil",
    university: "McGill University",
    city: "Montréal, QC",
    budgetMin: 600,
    budgetMax: 900,
    moveIn: "Jan 2026",
    preference: "Private Room",
    gender: "Male",
    lifestyle: ["Social household", "Flexible", "Bilingual"],
    verified: true,
    score: 83,
    color: "from-emerald-400 to-teal-500",
    bio: "Law student originally from São Paulo. Love cooking and meeting people. Looking for a lively household.",
  },
  {
    id: 5,
    initials: "YK",
    name: "Yuna Kim",
    country: "South Korea",
    university: "University of Toronto",
    city: "Toronto, ON",
    budgetMin: 900,
    budgetMax: 1300,
    moveIn: "Sept 2026",
    preference: "Private Room",
    gender: "Female",
    lifestyle: ["Non-smoker", "Night owl", "Student household"],
    verified: true,
    score: 96,
    color: "from-rose-400 to-pink-500",
    bio: "Masters student in Psychology at UofT. Looking for a private room in a safe, quiet building.",
  },
  {
    id: 6,
    initials: "JO",
    name: "Jide Okoye",
    country: "Nigeria",
    university: "University of Ottawa",
    city: "Ottawa, ON",
    budgetMin: 700,
    budgetMax: 1000,
    moveIn: "May 2026",
    preference: "Shared Apartment",
    gender: "Male",
    lifestyle: ["Non-smoker", "Pet-friendly", "Tidy"],
    verified: true,
    score: 79,
    color: "from-cyan-400 to-blue-500",
    bio: "Public policy student. Very respectful and tidy. Moving from Lagos and excited to explore Ottawa.",
  },
];

const cities = ["All Cities", "Toronto, ON", "Vancouver, BC", "Waterloo, ON", "Montréal, QC", "Ottawa, ON"];
const genderOptions = ["Any", "Male", "Female"];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                score >= 80 ? "bg-teal-100 text-teal-700 border-teal-200" :
                "bg-amber-100 text-amber-700 border-amber-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${color}`}>
      ⭐ {score}% match
    </span>
  );
}

export default function RoommateFinder() {
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [genderFilter, setGenderFilter] = useState("Any");
  const [maxBudget, setMaxBudget] = useState(1500);
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = roommates.filter((r) => {
    if (cityFilter !== "All Cities" && r.city !== cityFilter) return false;
    if (genderFilter !== "Any" && r.gender !== genderFilter) return false;
    if (r.budgetMax > maxBudget) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Find Roommate</h2>
        <p className="text-sm text-slate-500 mt-0.5">Connect with verified roommate seekers across Canada.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Gender Preference</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {genderOptions.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
              Max Budget: ${maxBudget.toLocaleString()}/mo
            </label>
            <input
              type="range"
              min={400}
              max={1500}
              step={50}
              value={maxBudget}
              onChange={(e) => setMaxBudget(+e.target.value)}
              className="w-full accent-teal-500 mt-1.5"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">{filtered.length} profile{filtered.length !== 1 ? "s" : ""} found</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-lg font-extrabold flex-shrink-0 shadow-md`}>
                {r.initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">{r.name}</h3>
                      {r.verified && (
                        <span className="inline-flex items-center gap-0.5 text-teal-500 text-xs font-semibold">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">from {r.country} · {r.gender}</p>
                  </div>
                  <ScoreBadge score={r.score} />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs text-slate-600">
                  <span>🎓 {r.university}</span>
                  <span>📍 {r.city}</span>
                  <span>💰 ${r.budgetMin}–${r.budgetMax}/mo</span>
                  <span>📅 {r.moveIn}</span>
                  <span>🏠 {r.preference}</span>
                </div>

                {/* Lifestyle tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {r.lifestyle.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{tag}</span>
                  ))}
                </div>

                {/* Bio expand */}
                {expanded === r.id && (
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {r.bio}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
                    Send Message
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                  >
                    {expanded === r.id ? "Hide Profile" : "View Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="text-4xl mb-3">👥</div>
          <p className="font-semibold text-slate-600">No profiles match your filters</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}