"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { createOrGetConversation } from "@/lib/chatService";
import PropertyListingsMap from "@/components/renter/PropertyListingsMap";

type ListingCard = {
  id: string;
  landlordId: string;
  title: string;
  image: string | null;
  formattedAddress?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city: string;
  neighbourhood: string;
  type: string;
  price: number;
  beds: number;
  baths: number;
  amenities: string[];
  landlordName: string;
  landlordEmail?: string | null;
  landlordTrustScore?: number | null;
  landlordTrustLabel?: string | null;
  verified: boolean;
  tag: string;
  furnished: boolean;
  featuredListing?: boolean;
  specialOfferBadge?: string | null;
};

type ListingDetail = ListingCard & {
  postalCode: string | null;
  formattedAddress?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  squareFeet: number | null;
  deposit: number | null;
  utilitiesIncluded: boolean;
  furnishedStatus: string;
  availableFrom: string | null;
  leaseDurationMonths: number | null;
  images: string[];
  photoCount: number;
  videoCount?: number;
  videos?: string[];
  tour360Url?: string | null;
  createdAt: string;
  status: string;
  internetIncluded?: boolean;
  parkingIncluded?: boolean;
  limitedTimeOfferDescription?: string | null;
  limitedTimeOfferExpiresAt?: string | null;
  matterportUrl?: string | null;
  matterportEmbed?: string | null;
};

const types = ["All Types", "Apartment", "Condo", "Basement", "Private Room", "Shared Room"];
const fallbackImage = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80";

type RenterListingsProps = { onOpenConversation: (conversationId: string) => void };
type MediaItem = { type: "image"; src: string } | { type: "video"; src: string };

const amenityIcons: Record<string, string> = {
  wifi: "📶", "wi-fi": "📶", internet: "📶", laundry: "🫧", washer: "🫧",
  parking: "🚗", garage: "🚗", balcony: "🌿", patio: "🌿", gym: "🏋️",
  fitness: "🏋️", dishwasher: "🍽️", "a/c": "❄️", "air conditioning": "❄️",
  ac: "❄️", storage: "📦", elevator: "🛗", security: "🔐", heating: "🔥",
  pool: "🏊", "pet-friendly": "🐾", pets: "🐾",
};
function getAmenityIcon(a: string): string {
  const k = a.toLowerCase();
  for (const [key, val] of Object.entries(amenityIcons)) { if (k.includes(key)) return val; }
  return "✓";
}

function getTrustMeta(score: number) {
  if (score >= 85) return { label: "Exceptional", color: "text-emerald-700", bar: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-700" };
  if (score >= 70) return { label: "Strong", color: "text-teal-700", bar: "bg-teal-500", pill: "bg-teal-100 text-teal-700" };
  if (score >= 50) return { label: "Moderate", color: "text-amber-700", bar: "bg-amber-500", pill: "bg-amber-100 text-amber-700" };
  return { label: "Low", color: "text-red-600", bar: "bg-red-500", pill: "bg-red-100 text-red-600" };
}

// ─── Unified Media Gallery ────────────────────────────────────────────────────
function UnifiedGallery({ items, title }: { items: MediaItem[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);

  const cur = items[idx];
  function prev() { setIdx(i => (i - 1 + items.length) % items.length); }
  function next() { setIdx(i => (i + 1) % items.length); }

  if (!items.length) return (
    <div className="w-full rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 py-16">
      <span className="text-5xl mb-2">🏠</span>
      <span className="text-sm font-medium">No media available</span>
    </div>
  );

  return (
    <>
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-slate-900 select-none"
        style={{ aspectRatio: "16/9" }}
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx > 50) prev(); else if (dx < -50) next();
          touchX.current = null;
        }}
      >
        {cur?.type === "image" ? (
          <img key={idx} src={cur.src} alt={`${title} ${idx + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300 cursor-zoom-in"
            onClick={() => setLightbox(true)} />
        ) : cur?.type === "video" ? (
          <video key={idx} src={cur.src} controls playsInline preload="metadata"
            className="w-full h-full object-contain bg-slate-950" />
        ) : null}

        {cur?.type === "image" && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-transparent pointer-events-none" />
        )}

        {cur?.type === "video" && (
          <div className="absolute top-4 left-4 pointer-events-none">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold border border-white/10">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
              Video Tour
            </span>
          </div>
        )}

        {items.length > 1 && (
          <div className="absolute top-4 right-4 pointer-events-none">
            <span className="px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-sm text-white text-xs font-semibold border border-white/15">
              {idx + 1} / {items.length}
            </span>
          </div>
        )}

        {items.length > 1 && <>
          <button onClick={prev} aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/35 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all z-10">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={next} aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/35 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all z-10">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </>}

        {cur?.type === "image" && (
          <button onClick={() => setLightbox(true)} aria-label="Fullscreen"
            className="absolute bottom-4 right-4 w-8 h-8 rounded-lg bg-white/15 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        )}
      </div>

      {items.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {items.map((item, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={`Media ${i + 1}`}
              className={`relative flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-150 ${i === idx ? "border-teal-500 ring-2 ring-teal-400/30" : "border-transparent opacity-55 hover:opacity-85"}`}
              style={{ width: 64, height: 44 }}>
              {item.type === "image"
                ? <img src={item.src} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                  </div>}
            </button>
          ))}
        </div>
      )}

      {lightbox && cur?.type === "image" && (
        <div className="fixed inset-0 z-50 bg-slate-950/96 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center" onClick={() => setLightbox(false)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img src={cur.src} alt={title} className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
          {items.length > 1 && <>
            <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>}
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-xs">{idx + 1} / {items.filter(m => m.type === "image").length}</p>
        </div>
      )}
    </>
  );
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-center min-w-[86px]">
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-extrabold text-slate-900">{value}</span>
      <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{label}</span>
    </div>
  );
}

function DetailRow({ icon, label, value, accent }: { icon: string; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${accent ? "border-teal-100 bg-teal-50/60" : "border-slate-100 bg-white"}`}>
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-sm font-bold ${accent ? "text-teal-700" : "text-slate-800"}`}>{value}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
      <span className="w-1 h-6 rounded-full bg-teal-500 block flex-shrink-0" />
      {children}
    </h2>
  );
}

export default function RenterListings({ onOpenConversation }: RenterListingsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");
  const heroQuery = (searchParams.get("q") ?? "").trim();
  const heroType = (searchParams.get("type") ?? "").trim();
  const [saved, setSaved] = useState<string[]>([]);
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(null);
  const [activeMediaTab, setActiveMediaTab] = useState<"photos" | "videos">("photos");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cityFilter, setCityFilter] = useState("All Cities");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [searchFilter, setSearchFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState(3000);
  const [furnishedFilter, setFurnishedFilter] = useState<"all" | "furnished" | "unfurnished">("all");
  const [contactBusyId, setContactBusyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "map">("cards");
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  useEffect(() => {
    async function loadListings() {
      setLoading(true); setLoadError("");
      try {
        const r = await fetch("/api/verification/notify-upload?purpose=listings");
        const p = (await r.json()) as { ok: boolean; error?: string; listings?: ListingCard[] };
        if (!r.ok || !p.ok) { setLoadError(p.error ?? "Failed to load listings."); return; }
        setListings(p.listings ?? []);
      } catch (e) { setLoadError(e instanceof Error ? e.message : "Failed to load listings."); }
      finally { setLoading(false); }
    }
    void loadListings();
  }, []);

  useEffect(() => {
    async function loadSavedIds() {
      const token = await getAccessToken();
      if (!token) { setSaved([]); return; }
      const r = await fetch("/api/verification/notify-upload?purpose=saved-listings", { headers: { Authorization: `Bearer ${token}` } });
      const p = (await r.json()) as { ok: boolean; listings?: Array<{ id: string }> };
      if (!r.ok || !p.ok) return;
      setSaved((p.listings ?? []).map(l => l.id));
    }
    void loadSavedIds();
  }, []);

  useEffect(() => {
    async function loadListingDetail(id: string) {
      setLoadingDetail(true); setLoadError(""); setHeroImageIndex(0);
      try {
        const r = await fetch(`/api/verification/notify-upload?purpose=listing-detail&id=${id}`);
        const p = (await r.json()) as { ok: boolean; error?: string; listing?: ListingDetail | null };
        if (!r.ok || !p.ok) { setLoadError(p.error ?? "Failed to load listing details."); setSelectedListing(null); return; }
        setSelectedListing(p.listing ?? null);
      } catch (e) { setLoadError(e instanceof Error ? e.message : "Failed to load listing details."); setSelectedListing(null); }
      finally { setLoadingDetail(false); }
    }
    if (listingId) void loadListingDetail(listingId);
    else setSelectedListing(null);
  }, [listingId]);

  useEffect(() => {
    if (!selectedListing) { setActiveMediaTab("photos"); return; }
    if ((selectedListing.images?.length ?? 0) > 0) setActiveMediaTab("photos");
    else if ((selectedListing.videos?.length ?? 0) > 0) setActiveMediaTab("videos");
    else setActiveMediaTab("photos");
  }, [selectedListing]);

  async function toggleSave(id: string) {
    setLoadError("");
    const token = await getAccessToken();
    if (!token) { setLoadError("Please login to save listings."); return; }
    const r = await fetch("/api/verification/notify-upload?purpose=toggle-save", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId: id }),
    });
    const p = (await r.json()) as { ok: boolean; saved?: boolean; error?: string };
    if (!r.ok || !p.ok) { setLoadError(p.error ?? "Failed to update saved listing."); return; }
    setSaved(prev => p.saved ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter(x => x !== id));
  }

  async function contactLandlord(listing: Pick<ListingCard, "id" | "title" | "landlordId">) {
    setLoadError("");
    try {
      setContactBusyId(listing.id);
      const c = await createOrGetConversation(listing.landlordId, listing.id);
      onOpenConversation(c.id);
    } catch (e) { setLoadError(e instanceof Error ? e.message : "Unable to start conversation."); }
    finally { setContactBusyId(null); }
  }

  const cities = useMemo(() => {
    const u = Array.from(new Set(listings.map(l => l.city).filter(Boolean)));
    return ["All Cities", ...u];
  }, [listings]);

  useEffect(() => { setSearchFilter(heroQuery); }, [heroQuery]);
  useEffect(() => { if (heroType && types.includes(heroType)) setTypeFilter(heroType); }, [heroType]);
  useEffect(() => {
    if (!heroQuery) return;
    const m = cities.find(c => c !== "All Cities" && c.toLowerCase() === heroQuery.toLowerCase());
    if (m) setCityFilter(m);
  }, [cities, heroQuery]);

  const filtered = listings.filter(l => {
    if (cityFilter !== "All Cities" && l.city !== cityFilter) return false;
    if (typeFilter !== "All Types" && l.type !== typeFilter) return false;
    if (l.price > maxPrice) return false;
    if (furnishedFilter === "furnished" && !l.furnished) return false;
    if (furnishedFilter === "unfurnished" && l.furnished) return false;
    if (searchFilter) {
      const hay = [l.title, l.city, l.neighbourhood, l.formattedAddress, l.type].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(searchFilter.toLowerCase())) return false;
    }
    return true;
  });

  // ═══════════════════════ DETAIL VIEW ═══════════════════════════════════════
  if (listingId) {
    const rawImages: MediaItem[] = selectedListing?.images?.length
      ? selectedListing.images.map(s => ({ type: "image" as const, src: s }))
      : selectedListing?.image
        ? [{ type: "image" as const, src: selectedListing.image }]
        : [{ type: "image" as const, src: fallbackImage }];
    const rawVideos: MediaItem[] = (selectedListing?.videos ?? []).map(s => ({ type: "video" as const, src: s }));
    const mediaItems: MediaItem[] = [...rawImages, ...rawVideos];
    const trust = typeof selectedListing?.landlordTrustScore === "number" ? getTrustMeta(selectedListing.landlordTrustScore) : null;
    const isSaved = selectedListing ? saved.includes(selectedListing.id) : false;

    const SaveBtn = ({ full }: { full?: boolean }) => (
      <button onClick={() => selectedListing && void toggleSave(selectedListing.id)}
        className={`${full ? "w-full" : ""} flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${isSaved ? "bg-teal-50 border-teal-300 text-teal-700" : "bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50/50"}`}>
        <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
        {isSaved ? "Saved" : "Save"}
      </button>
    );

    const ContactBtn = ({ full }: { full?: boolean }) => (
      <button onClick={() => selectedListing && void contactLandlord(selectedListing)}
        disabled={!!(selectedListing && contactBusyId === selectedListing.id)}
        className={`${full ? "w-full" : ""} flex items-center justify-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-sm font-extrabold rounded-xl transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        {selectedListing && contactBusyId === selectedListing.id ? "Opening chat…" : "Contact Landlord"}
      </button>
    );

    return (
      <div className="-mx-4 sm:-mx-6">
        <div className="sticky top-0 z-30 border-b border-slate-100 bg-white px-4 py-3 shadow-sm sm:px-6">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-teal-50">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </span>
            <span>Back to Listings</span>
          </button>
        </div>

        {/* Loading skeleton */}
        {loadingDetail && (
          <div className="px-4 sm:px-6 pt-6 pb-20 max-w-6xl mx-auto animate-pulse space-y-5">
            <div className="w-full rounded-2xl bg-slate-200" style={{ aspectRatio: "16/9" }} />
            <div className="h-8 bg-slate-200 rounded-full w-2/3" />
            <div className="h-5 bg-slate-100 rounded-full w-1/3" />
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
            </div>
          </div>
        )}

        {/* Error */}
        {!loadingDetail && loadError && !selectedListing && (
          <div className="px-4 sm:px-6 pt-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-center gap-3">
              <span className="text-xl">⚠️</span>{loadError}
            </div>
          </div>
        )}

        {/* Main content */}
        {!loadingDetail && selectedListing && (
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-16 max-w-6xl mx-auto">
            {/* Offer banner */}
            {(selectedListing.specialOfferBadge || selectedListing.limitedTimeOfferDescription) && (
              <div className="mb-5 rounded-2xl bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 border border-rose-200 px-5 py-4 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🏷️</span>
                <div>
                  {selectedListing.specialOfferBadge && <p className="text-sm font-extrabold text-rose-700">{selectedListing.specialOfferBadge}</p>}
                  {selectedListing.limitedTimeOfferDescription && <p className="text-sm text-rose-600 mt-0.5">{selectedListing.limitedTimeOfferDescription}</p>}
                  {selectedListing.limitedTimeOfferExpiresAt && <p className="text-xs text-rose-500 mt-1 font-semibold">⏰ Offer ends {selectedListing.limitedTimeOfferExpiresAt}</p>}
                </div>
              </div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT */}
              <div className="lg:col-span-2 space-y-7">
                {/* Gallery */}
                <UnifiedGallery items={mediaItems} title={selectedListing.title} />

                {/* Title */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">{selectedListing.type}</span>
                    {selectedListing.verified && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Verified
                      </span>
                    )}
                    {selectedListing.featuredListing && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">⭐ Featured</span>}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">{selectedListing.title}</h1>
                  <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {selectedListing.formattedAddress ?? `${selectedListing.neighbourhood}, ${selectedListing.city}`}
                  </div>
                </div>

                {/* Stat chips */}
                <div className="flex flex-wrap gap-3">
                  <StatChip icon="🛏️" label="Beds" value={String(selectedListing.beds)} />
                  <StatChip icon="🚿" label="Baths" value={String(selectedListing.baths)} />
                  {selectedListing.squareFeet && <StatChip icon="📐" label="sqft" value={String(selectedListing.squareFeet)} />}
                  <StatChip icon="🪑" label="Furnished" value={selectedListing.furnishedStatus.charAt(0).toUpperCase() + selectedListing.furnishedStatus.slice(1)} />
                  {selectedListing.availableFrom && <StatChip icon="📅" label="Available" value={selectedListing.availableFrom} />}
                </div>

                {/* Property details */}
                <div>
                  <SectionTitle>Property Details</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <DetailRow icon="💰" label="Monthly Rent" value={`$${selectedListing.price.toLocaleString()} / month`} accent />
                    <DetailRow icon="🔐" label="Security Deposit" value={selectedListing.deposit ? `$${selectedListing.deposit.toLocaleString()}` : "—"} />
                    <DetailRow icon="⚡" label="Utilities" value={selectedListing.utilitiesIncluded ? "Included" : "Not included"} />
                    <DetailRow icon="📶" label="Internet" value={selectedListing.internetIncluded ? "Included" : "Not included"} />
                    <DetailRow icon="🚗" label="Parking" value={selectedListing.parkingIncluded ? "Included" : "Not included"} />
                    <DetailRow icon="📋" label="Lease Duration" value={selectedListing.leaseDurationMonths ? `${selectedListing.leaseDurationMonths} months` : "Flexible"} />
                  </div>
                </div>

                {/* Amenities */}
                {selectedListing.amenities.length > 0 && (
                  <div>
                    <SectionTitle>Amenities</SectionTitle>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedListing.amenities.map(amenity => (
                        <span key={amenity}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-slate-700 text-sm font-medium rounded-2xl transition-colors cursor-default">
                          <span className="text-base">{getAmenityIcon(amenity)}</span>
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3D Tour */}
                {(selectedListing.matterportUrl || selectedListing.matterportEmbed) && (
                  <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 text-xl">🏠</div>
                      <div>
                        <p className="text-sm font-extrabold text-teal-900">Interactive 3D Tour Available</p>
                        <p className="text-xs text-teal-600 mt-0.5">Walk through this property virtually</p>
                      </div>
                    </div>
                    {selectedListing.matterportUrl && (
                      <a href={selectedListing.matterportUrl} target="_blank" rel="noreferrer"
                        className="flex-shrink-0 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
                        Open Tour →
                      </a>
                    )}
                  </div>
                )}

                {/* Mobile CTA */}
                <div className="lg:hidden bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 p-5 space-y-2.5">
                  <div className="flex items-baseline gap-2 pb-4 border-b border-slate-100">
                    <span className="text-3xl font-extrabold text-slate-900">${selectedListing.price.toLocaleString()}</span>
                    <span className="text-slate-400 font-medium">/ month</span>
                  </div>
                  <ContactBtn full />
                  <SaveBtn full />
                </div>
              </div>

              {/* RIGHT — sticky */}
              <div className="hidden lg:block">
                <div className="sticky top-20 space-y-4">
                  {/* Price + CTA */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 p-6">
                    <div className="flex items-baseline gap-2 pb-5 mb-5 border-b border-slate-100">
                      <span className="text-4xl font-extrabold text-slate-900">${selectedListing.price.toLocaleString()}</span>
                      <span className="text-slate-400 text-base font-medium">/ month</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-5 text-xs">
                      {[
                        ["Beds", String(selectedListing.beds)],
                        ["Baths", String(selectedListing.baths)],
                        ["Deposit", selectedListing.deposit ? `$${selectedListing.deposit.toLocaleString()}` : "—"],
                        ["Lease", selectedListing.leaseDurationMonths ? `${selectedListing.leaseDurationMonths}mo` : "Flex"],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-slate-50 rounded-xl p-2.5 text-center">
                          <p className="text-slate-400 font-medium">{k}</p>
                          <p className="font-extrabold text-slate-900 text-sm mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2.5">
                      <ContactBtn full />
                      <SaveBtn full />
                    </div>
                  </div>

                  {/* Landlord */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Your Landlord</p>
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xl font-extrabold shadow-lg flex-shrink-0">
                        {selectedListing.landlordName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-base font-extrabold text-slate-900">{selectedListing.landlordName}</p>
                        {selectedListing.verified && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-teal-600 text-xs font-bold">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Verified Landlord
                          </span>
                        )}
                      </div>
                    </div>
                    {trust && typeof selectedListing.landlordTrustScore === "number" && (
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-500">Trust Score</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-lg font-extrabold ${trust.color}`}>{selectedListing.landlordTrustScore}%</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trust.pill}`}>
                              {selectedListing.landlordTrustLabel ?? trust.label}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className={`h-2 rounded-full transition-all duration-700 ${trust.bar}`} style={{ width: `${selectedListing.landlordTrustScore}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Safety */}
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="text-xs font-extrabold text-amber-800 mb-1.5 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      RentShield Safety Tip
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">Only communicate and pay through RentShield. Never wire money outside the platform.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════ BROWSE VIEW ═══════════════════════════════════════
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Find Listings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Browse verified rental listings across Canada.</p>
      </div>

      <div className="flex items-center justify-end">
        <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white text-sm font-semibold">
          <button type="button" onClick={() => setViewMode("cards")} className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${viewMode === "cards" ? "bg-teal-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            Cards
          </button>
          <button type="button" onClick={() => setViewMode("map")} className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${viewMode === "map" ? "bg-teal-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
            Map
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="col-span-2 sm:col-span-4">
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="City, neighbourhood, address, or title"
                className="w-full pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">City</label>
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Property Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Max: ${maxPrice.toLocaleString()}/mo</label>
            <input type="range" min={500} max={3000} step={50} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-teal-500 mt-2" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Furnished</label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
              {(["all","furnished","unfurnished"] as const).map(v => (
                <button key={v} onClick={() => setFurnishedFilter(v)} className={`flex-1 py-2.5 capitalize transition-colors ${furnishedFilter === v ? "bg-teal-500 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  {v === "all" ? "All" : v === "furnished" ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 font-medium">{filtered.length} listing{filtered.length !== 1 ? "s" : ""} found</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="bg-slate-200" style={{ aspectRatio: "4/3" }} />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-100 rounded-full w-3/4" />
                <div className="h-4 bg-slate-100 rounded-full w-1/2" />
                <div className="flex gap-2"><div className="h-6 bg-slate-100 rounded-full w-16" /><div className="h-6 bg-slate-100 rounded-full w-16" /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 flex items-center gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span><span>{loadError}</span>
        </div>
      )}

      {!loading && !loadError && viewMode === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(listing => (
            <div key={listing.id} onClick={() => router.push(`/renter?listingId=${listing.id}`)}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
              <div className="relative overflow-hidden bg-slate-200" style={{ aspectRatio: "4/3" }}>
                <img src={listing.image ?? fallbackImage} alt={listing.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {listing.featuredListing && <span className="px-2.5 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full shadow-sm">⭐ Featured</span>}
                  {listing.specialOfferBadge && <span className="px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-sm">🏷️ {listing.specialOfferBadge}</span>}
                  {!listing.featuredListing && !listing.specialOfferBadge && <span className="px-2.5 py-1 bg-slate-900/65 backdrop-blur-sm text-white text-xs font-medium rounded-full">{listing.tag}</span>}
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 bg-white/90 text-slate-700 text-xs font-semibold rounded-full">{listing.type}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); void toggleSave(listing.id); }}
                  className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${saved.includes(listing.id) ? "bg-teal-500 text-white" : "bg-white/90 text-slate-400 hover:text-teal-500"}`}>
                  <svg className="w-4 h-4" fill={saved.includes(listing.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </button>
                <div className="absolute bottom-3 left-3">
                  <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-xl text-base font-extrabold text-slate-900 shadow-sm">
                    ${listing.price.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-slate-900 mb-1 truncate group-hover:text-teal-700 transition-colors">{listing.title}</p>
                <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="truncate">{listing.neighbourhood}, {listing.city}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 mb-3">
                  <span>🛏️ {listing.beds} bed</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                  <span>🚿 {listing.baths} bath</span>
                  {listing.furnished && <><span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" /><span className="text-teal-600 font-semibold">Furnished</span></>}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {listing.amenities.slice(0, 3).map(a => <span key={a} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{a}</span>)}
                  {listing.amenities.length > 3 && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">+{listing.amenities.length - 3}</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {listing.landlordName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{listing.landlordName}</p>
                      <div className="flex items-center gap-1">
                        {listing.verified && <span className="text-teal-500 text-[10px] font-bold">✓ Verified</span>}
                        {typeof listing.landlordTrustScore === "number" && <span className="text-[10px] font-bold text-amber-600 ml-1">{listing.landlordTrustScore}%</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); void contactLandlord(listing); }} disabled={contactBusyId === listing.id}
                    className="flex-shrink-0 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
                    {contactBusyId === listing.id ? "…" : "Contact"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !loadError && viewMode === "map" && (
        <PropertyListingsMap listings={filtered} onOpenListing={id => router.push(`/renter?listingId=${id}`)} />
      )}

      {!loading && !loadError && filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="text-5xl mb-3">🏚️</div>
          <p className="font-bold text-slate-700 text-lg">No listings match your filters</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria or clearing filters.</p>
        </div>
      )}
    </div>
  );
}
