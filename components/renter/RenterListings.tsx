"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ListingCard = {
  id: string;
  title: string;
  image: string | null;
  city: string;
  neighbourhood: string;
  type: string;
  price: number;
  beds: number;
  baths: number;
  amenities: string[];
  landlordName: string;
  landlordEmail?: string | null;
  verified: boolean;
  tag: string;
  furnished: boolean;
};

type ListingDetail = ListingCard & {
  postalCode: string | null;
  squareFeet: number | null;
  deposit: number | null;
  utilitiesIncluded: boolean;
  furnishedStatus: string;
  availableFrom: string | null;
  leaseDurationMonths: number | null;
  images: string[];
  photoCount: number;
  createdAt: string;
  status: string;
};

const types = ["All Types", "Apartment", "Condo", "Basement", "Private Room", "Shared Room"];
const fallbackImage = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=75";

export default function RenterListings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const [saved, setSaved] = useState<string[]>([]);
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [maxPrice, setMaxPrice] = useState(3000);
  const [furnishedFilter, setFurnishedFilter] = useState<"all" | "furnished" | "unfurnished">("all");

  async function getAccessToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  useEffect(() => {
    async function loadListings() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/verification/notify-upload?purpose=listings");
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          listings?: ListingCard[];
        };

        if (!response.ok || !payload.ok) {
          setLoadError(payload.error ?? "Failed to load listings.");
          return;
        }

        setListings(payload.listings ?? []);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load listings.");
      } finally {
        setLoading(false);
      }
    }

    void loadListings();
  }, []);

  useEffect(() => {
    async function loadSavedIds() {
      const token = await getAccessToken();
      if (!token) {
        setSaved([]);
        return;
      }

      const response = await fetch("/api/verification/notify-upload?purpose=saved-listings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { ok: boolean; listings?: Array<{ id: string }> };
      if (!response.ok || !payload.ok) {
        return;
      }
      setSaved((payload.listings ?? []).map((listing) => listing.id));
    }

    void loadSavedIds();
  }, []);

  useEffect(() => {
    async function loadListingDetail(id: string) {
      setLoadingDetail(true);
      setLoadError("");
      try {
        const response = await fetch(`/api/verification/notify-upload?purpose=listing-detail&id=${id}`);
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          listing?: ListingDetail | null;
        };
        if (!response.ok || !payload.ok) {
          setLoadError(payload.error ?? "Failed to load listing details.");
          setSelectedListing(null);
          return;
        }
        setSelectedListing(payload.listing ?? null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load listing details.");
        setSelectedListing(null);
      } finally {
        setLoadingDetail(false);
      }
    }

    if (listingId) {
      void loadListingDetail(listingId);
    } else {
      setSelectedListing(null);
    }
  }, [listingId]);

  async function toggleSave(id: string) {
    setLoadError("");
    const token = await getAccessToken();
    if (!token) {
      setLoadError("Please login to save listings.");
      return;
    }

    const response = await fetch("/api/verification/notify-upload?purpose=toggle-save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ listingId: id }),
    });
    const payload = (await response.json()) as { ok: boolean; saved?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setLoadError(payload.error ?? "Failed to update saved listing.");
      return;
    }

    setSaved((prev) => {
      if (payload.saved) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  }

  const cities = useMemo(() => {
    const unique = Array.from(new Set(listings.map((listing) => listing.city).filter(Boolean)));
    return ["All Cities", ...unique];
  }, [listings]);

  const filtered = listings.filter((listing) => {
    if (cityFilter !== "All Cities" && listing.city !== cityFilter) return false;
    if (typeFilter !== "All Types" && listing.type !== typeFilter) return false;
    if (listing.price > maxPrice) return false;
    if (furnishedFilter === "furnished" && !listing.furnished) return false;
    if (furnishedFilter === "unfurnished" && listing.furnished) return false;
    return true;
  });

  if (listingId) {
    const images =
      selectedListing?.images?.length
        ? selectedListing.images
        : selectedListing?.image
          ? [selectedListing.image]
          : [fallbackImage];

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Property Details</h2>
            <p className="text-sm text-slate-500 mt-0.5">Full listing details and landlord photos.</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
          >
            Back to Listings
          </button>
        </div>

        {loadingDetail && <div className="text-sm text-slate-500">Loading listing details...</div>}
        {loadError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}
        {!loadingDetail && !loadError && selectedListing && (
          <div className="space-y-5">
            <section className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">All Photos ({images.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {images.map((image, index) => (
                  <div key={`${image}-${index}`} className="rounded-xl overflow-hidden border border-slate-100 bg-slate-100">
                    <img src={image} alt={`${selectedListing.title} ${index + 1}`} className="w-full h-52 object-cover" />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-lg font-bold text-slate-900">{selectedListing.title}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void toggleSave(selectedListing.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                      saved.includes(selectedListing.id)
                        ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {saved.includes(selectedListing.id) ? "Saved" : "Save Listing"}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedListing.landlordEmail) {
                        window.location.href = `mailto:${selectedListing.landlordEmail}?subject=RentShield Listing: ${encodeURIComponent(selectedListing.title)}`;
                        return;
                      }
                      setLoadError("Landlord contact email is not available for this listing.");
                    }}
                    className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Contact
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4">📍 {selectedListing.neighbourhood}, {selectedListing.city}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div><p className="text-slate-400 text-xs">Price</p><p className="font-semibold text-slate-800">${selectedListing.price.toLocaleString()}/mo</p></div>
                <div><p className="text-slate-400 text-xs">Type</p><p className="font-semibold text-slate-800">{selectedListing.type}</p></div>
                <div><p className="text-slate-400 text-xs">Landlord</p><p className="font-semibold text-slate-800">{selectedListing.landlordName}</p></div>
                <div><p className="text-slate-400 text-xs">Beds/Baths</p><p className="font-semibold text-slate-800">{selectedListing.beds} bd / {selectedListing.baths} ba</p></div>
                <div><p className="text-slate-400 text-xs">Square Feet</p><p className="font-semibold text-slate-800">{selectedListing.squareFeet ?? "-"}</p></div>
                <div><p className="text-slate-400 text-xs">Security Deposit</p><p className="font-semibold text-slate-800">{selectedListing.deposit ? `$${selectedListing.deposit.toLocaleString()}` : "-"}</p></div>
                <div><p className="text-slate-400 text-xs">Furnished</p><p className="font-semibold text-slate-800 capitalize">{selectedListing.furnishedStatus}</p></div>
                <div><p className="text-slate-400 text-xs">Utilities Included</p><p className="font-semibold text-slate-800">{selectedListing.utilitiesIncluded ? "Yes" : "No"}</p></div>
                <div><p className="text-slate-400 text-xs">Available From</p><p className="font-semibold text-slate-800">{selectedListing.availableFrom ?? "-"}</p></div>
              </div>
              <div className="mt-4">
                <p className="text-slate-400 text-xs mb-1">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.amenities.length === 0 && <span className="text-sm text-slate-500">No amenities listed</span>}
                  {selectedListing.amenities.map((amenity) => (
                    <span key={amenity} className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">{amenity}</span>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Find Listings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Browse verified rental listings across Canada.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Property Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {types.map((type) => (
                <option key={type}>{type}</option>
              ))}
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
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-teal-500 mt-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Furnished</label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
              {(["all", "furnished", "unfurnished"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setFurnishedFilter(value)}
                  className={`flex-1 py-2 capitalize transition-colors ${
                    furnishedFilter === value ? "bg-teal-500 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {value === "all" ? "All" : value === "furnished" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">{filtered.length} listing{filtered.length !== 1 ? "s" : ""} found</p>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading listings...</div>}
      {loadError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>}

      {!loading && !loadError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((listing) => (
            <div
              key={listing.id}
              onClick={() => router.push(`/renter?listingId=${listing.id}`)}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
            >
              <div className="relative h-44 overflow-hidden bg-slate-200">
                <img
                  src={listing.image ?? fallbackImage}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    void toggleSave(listing.id);
                  }}
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

              <div className="p-4">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xl font-extrabold text-slate-900">${listing.price.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1 truncate">{listing.title}</p>
                <p className="text-xs text-slate-500 mb-3 truncate">
                  📍 {listing.neighbourhood}, {listing.city}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.amenities.slice(0, 3).map((amenity) => (
                    <span key={amenity} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{amenity}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                      {listing.landlordName.charAt(0).toUpperCase()}
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleSave(listing.id);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                        saved.includes(listing.id)
                          ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {saved.includes(listing.id) ? "Saved" : "Save"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (listing.landlordEmail) {
                          window.location.href = `mailto:${listing.landlordEmail}?subject=RentShield Listing: ${encodeURIComponent(listing.title)}`;
                        }
                      }}
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !loadError && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="font-semibold text-slate-600">No listings match your filters</p>
          <p className="text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}
