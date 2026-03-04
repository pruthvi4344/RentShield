"use client";

import { useState } from "react";
import Link from "next/link";

const stats = [
  { value: "12,000+", label: "Verified Listings" },
  { value: "98%", label: "Fraud-Free Rate" },
  { value: "8,500+", label: "Happy Renters" },
];

const badges = [
  { name: "Priya M.", role: "International Student", city: "Toronto", initials: "PM", color: "bg-violet-100 text-violet-700" },
  { name: "Ahmed K.", role: "New Immigrant", city: "Vancouver", initials: "AK", color: "bg-amber-100 text-amber-700" },
  { name: "Li W.", role: "Verified Landlord", city: "Waterloo", initials: "LW", color: "bg-teal-100 text-teal-700" },
  { name: "Sofia R.", role: "Roommate Seeker", city: "Montreal", initials: "SR", color: "bg-rose-100 text-rose-700" },
];

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("Any Type");

  return (
    <section className="relative min-h-screen pt-16 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left: Text + Search */}
          <div className="flex-1 text-center lg:text-left">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
              Trusted by 8,500+ renters across Canada
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Find Safe &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                Verified Rentals
              </span>{" "}
              in Your New City
            </h1>

            <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              RentShield protects international students and new immigrants from rental fraud. Every landlord and listing is verified before you see it.
            </p>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto lg:mx-0 mb-4">
              <div className="flex items-center gap-2 flex-1 px-3">
                <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="City, university, or neighbourhood..."
                  className="flex-1 py-2.5 text-slate-800 placeholder-slate-400 text-sm outline-none bg-transparent"
                />
              </div>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="px-3 py-2.5 text-sm text-slate-700 bg-slate-50 rounded-xl border-0 outline-none cursor-pointer"
              >
                <option>Any Type</option>
                <option>Apartment</option>
                <option>Condo</option>
                <option>Basement</option>
                <option>Private Room</option>
                <option>Shared Room</option>
              </select>
              <button className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md whitespace-nowrap">
                Find Rentals
              </button>
            </div>

            {/* Quick filters */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-10">
              {["Toronto", "Vancouver", "Waterloo", "Montreal", "Ottawa"].map((city) => (
                <button
                  key={city}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors"
                >
                  {city}
                </button>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link
                href="/listings"
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all duration-200 text-sm"
              >
                Browse Listings
              </Link>
              <Link
                href="/list-property"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 text-sm backdrop-blur-sm"
              >
                List Your Property
              </Link>
            </div>
          </div>

          {/* Right: Floating user cards */}
          <div className="relative w-full max-w-sm lg:max-w-xs xl:max-w-sm flex-shrink-0">
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b, i) => (
                <div
                  key={b.name}
                  className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:bg-white/15 transition-all duration-300 ${i === 0 || i === 3 ? "mt-6" : ""}`}
                >
                  <div className={`w-12 h-12 rounded-full ${b.color} flex items-center justify-center text-sm font-bold`}>
                    {b.initials}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{b.name}</p>
                    <p className="text-slate-400 text-xs">{b.role}</p>
                    <div className="mt-1 flex items-center justify-center gap-1 text-teal-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs">{b.city}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Verified badge floating */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              All users verified
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-6 border-t border-white/10 pt-10 max-w-lg mx-auto lg:max-w-none lg:mx-0">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}