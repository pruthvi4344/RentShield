"use client";

import { useMemo, useState } from "react";
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from "@react-google-maps/api";

type MapListing = {
  id: string;
  title: string;
  price: number;
  city: string;
  neighbourhood: string;
  latitude?: number | null;
  longitude?: number | null;
  image?: string | null;
};

type PropertyListingsMapProps = {
  listings: MapListing[];
  onOpenListing: (listingId: string) => void;
};

const defaultCenter = { lat: 42.3149, lng: -83.0364 };
const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#64779e" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#334e87" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#023e58" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6f9ba5" }] },
  { featureType: "poi", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#023e58" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#3C7680" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#b0d5ce" }] },
  { featureType: "road.highway", elementType: "labels.text.stroke", stylers: [{ color: "#023e58" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
  { featureType: "transit", elementType: "labels.text.stroke", stylers: [{ color: "#1d2c4d" }] },
  { featureType: "transit.line", elementType: "geometry.fill", stylers: [{ color: "#283d6a" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#3a4762" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e6d70" }] },
];
const fallbackImage = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=75";

export default function PropertyListingsMap({ listings, onOpenListing }: PropertyListingsMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { isLoaded, loadError } = useJsApiLoader({
    id: "rentshield-renter-map",
    googleMapsApiKey: apiKey,
  });

  const markerListings = useMemo(
    () =>
      listings.filter(
        (listing): listing is MapListing & { latitude: number; longitude: number } =>
          typeof listing.latitude === "number" && typeof listing.longitude === "number",
      ),
    [listings],
  );

  const selectedListing = markerListings.find((listing) => listing.id === selectedId) ?? null;
  const mapCenter = useMemo(() => {
    if (selectedListing) {
      return { lat: selectedListing.latitude, lng: selectedListing.longitude };
    }

    if (markerListings.length === 0) {
      return defaultCenter;
    }

    const totals = markerListings.reduce(
      (acc, listing) => ({
        lat: acc.lat + listing.latitude,
        lng: acc.lng + listing.longitude,
      }),
      { lat: 0, lng: 0 },
    );

    return {
      lat: totals.lat / markerListings.length,
      lng: totals.lng / markerListings.length,
    };
  }, [markerListings, selectedListing]);

  const focusLabel = selectedListing?.city ?? markerListings[0]?.city ?? "your filtered area";

  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-700">
        Add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the renter map view.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Google Maps failed to load. Check the browser console and Maps API key restrictions.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading map...</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Map View</p>
          <p className="text-xs text-slate-500">Centered on {focusLabel} and updated from your current filters.</p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`px-3 py-2 transition-colors ${theme === "light" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`px-3 py-2 transition-colors ${theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Dark
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="max-h-[680px] overflow-y-auto border-b border-slate-100 bg-slate-50 xl:border-b-0 xl:border-r xl:border-slate-100">
          {markerListings.length === 0 ? (
            <div className="flex h-full min-h-[220px] items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm font-semibold text-slate-700">No properties match these filters</p>
                <p className="mt-1 text-xs text-slate-500">The map stays visible so you can adjust filters without losing context.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {markerListings.map((listing) => {
                const isSelected = selectedId === listing.id;
                return (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => setSelectedId(listing.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-teal-300 bg-teal-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={listing.image ?? fallbackImage}
                        alt={listing.title}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{listing.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {listing.neighbourhood}, {listing.city}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${isSelected ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                            ${listing.price}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-xs font-medium ${isSelected ? "text-teal-700" : "text-slate-500"}`}>
                        {isSelected ? "Marker selected" : "Click to focus"}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">Map pin</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "680px" }}
          center={mapCenter}
          zoom={selectedListing ? 13 : 11}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            styles: theme === "dark" ? darkMapStyles : [],
          }}
        >
          {markerListings.map((listing) => (
            <MarkerF
              key={listing.id}
              position={{ lat: listing.latitude, lng: listing.longitude }}
              onClick={() => setSelectedId(listing.id)}
              label={{
                text: `$${listing.price}`,
                className: "rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700",
              }}
            />
          ))}

          {selectedListing && (
            <InfoWindowF position={{ lat: selectedListing.latitude, lng: selectedListing.longitude }} onCloseClick={() => setSelectedId(null)}>
              <div className="max-w-[220px] space-y-2">
                <p className="text-sm font-bold text-slate-900">{selectedListing.title}</p>
                <p className="text-xs text-slate-500">
                  {selectedListing.neighbourhood}, {selectedListing.city}
                </p>
                <p className="text-sm font-semibold text-teal-700">${selectedListing.price.toLocaleString()}/mo</p>
                <button
                  type="button"
                  onClick={() => onOpenListing(selectedListing.id)}
                  className="rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600"
                >
                  View Listing
                </button>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
