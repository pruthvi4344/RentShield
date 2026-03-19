"use client";

import { useEffect, useState } from "react";
import { deleteLandlordListing, getLandlordListings, updateLandlordListing } from "@/lib/landlordListingService";
import { getAuthIdentity } from "@/lib/profileService";
import Viewer360 from "@/components/Viewer360";
import type { LandlordListingWithCover } from "@/types/listing";

const statusCfg = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
  rented: { label: "Rented", className: "bg-teal-100 text-teal-700 border-teal-200" },
  inactive: { label: "Inactive", className: "bg-slate-100 text-slate-600 border-slate-200" },
} as const;

export default function MyListingsDynamic() {
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [listings, setListings] = useState<LandlordListingWithCover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewListing, setViewListing] = useState<LandlordListingWithCover | null>(null);
  const [editListing, setEditListing] = useState<LandlordListingWithCover | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    property_type: "",
    street_address: "",
    city: "",
    bedrooms: 1,
    bathrooms: 1,
    monthly_rent: 0,
    status: "pending" as "pending" | "active" | "rented" | "inactive",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const auth = await getAuthIdentity();
        if (!auth || auth.role !== "landlord") {
          setError("Landlord session not found.");
          return;
        }
        setLandlordId(auth.id);
        const data = await getLandlordListings(auth.id);
        setListings(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load listings.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function onDelete(listingId: string) {
    if (!landlordId) return;
    setDeletingId(listingId);
    setError("");
    try {
      await deleteLandlordListing(landlordId, listingId);
      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
      setDeleteConfirm(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete listing.");
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(listing: LandlordListingWithCover) {
    setEditListing(listing);
    setEditForm({
      title: listing.title,
      property_type: listing.property_type,
      street_address: listing.street_address,
      city: listing.city,
      bedrooms: Number(listing.bedrooms),
      bathrooms: Number(listing.bathrooms),
      monthly_rent: Number(listing.monthly_rent),
      status: listing.status,
    });
  }

  async function saveEdit() {
    if (!landlordId || !editListing) return;
    setSavingEdit(true);
    setError("");
    try {
      const updated = await updateLandlordListing(landlordId, editListing.id, {
        title: editForm.title,
        property_type: editForm.property_type,
        street_address: editForm.street_address,
        city: editForm.city,
        bedrooms: editForm.bedrooms,
        bathrooms: editForm.bathrooms,
        monthly_rent: editForm.monthly_rent,
        status: editForm.status,
      });

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === updated.id
            ? { ...listing, ...updated, monthly_rent: Number(updated.monthly_rent) }
            : listing,
        ),
      );
      setEditListing(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save listing.");
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading listings...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">My Listings</h2>
        <p className="text-sm text-slate-500 mt-0.5">{listings.length} propert{listings.length === 1 ? "y" : "ies"} listed</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <p className="font-semibold text-slate-600 text-lg">No listings yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first property to start receiving inquiries.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const status = statusCfg[listing.status] ?? statusCfg.pending;
            return (
              <div key={listing.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-slate-100">
                    {listing.cover_photo_url ? (
                      <img src={listing.cover_photo_url} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No photo</div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${status.className}`}>{status.label}</span>
                    </div>
                  </div>

                  <div className="flex-1 p-5">
                    <h3 className="text-base font-bold text-slate-900">{listing.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{listing.street_address}, {listing.city}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                      <span className="font-bold text-slate-900 text-lg">${Number(listing.monthly_rent).toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full">{listing.property_type}</span>
                      <span>{listing.bedrooms} bd · {listing.bathrooms} ba</span>
                      <span>{listing.photo_count} photos</span>
                    </div>

                    <div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
                      <span>{listing.views_count} views</span>
                      <span>{listing.inquiries_count} inquiries</span>
                      {listing.tour_360_url && <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-700">360 tour</span>}
                      <span>Listed {new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => startEdit(listing)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setViewListing(listing)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200"
                      >
                        View
                      </button>
                      {deleteConfirm === listing.id ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-slate-500">Delete?</span>
                          <button
                            onClick={() => void onDelete(listing.id)}
                            disabled={deletingId === listing.id}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-60"
                          >
                            {deletingId === listing.id ? "Deleting..." : "Yes"}
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg">
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(listing.id)} className="ml-auto px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-lg border border-red-100">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewListing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">Listing Details</h3>
              <button onClick={() => setViewListing(null)} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-400 text-xs">Title</p><p className="font-semibold text-slate-800">{viewListing.title}</p></div>
              <div><p className="text-slate-400 text-xs">Type</p><p className="font-semibold text-slate-800">{viewListing.property_type}</p></div>
              <div><p className="text-slate-400 text-xs">Address</p><p className="font-semibold text-slate-800">{viewListing.street_address}</p></div>
              <div><p className="text-slate-400 text-xs">City</p><p className="font-semibold text-slate-800">{viewListing.city}</p></div>
              <div><p className="text-slate-400 text-xs">Rent</p><p className="font-semibold text-slate-800">${Number(viewListing.monthly_rent).toLocaleString()}/mo</p></div>
              <div><p className="text-slate-400 text-xs">Beds/Baths</p><p className="font-semibold text-slate-800">{viewListing.bedrooms} bd / {viewListing.bathrooms} ba</p></div>
              <div><p className="text-slate-400 text-xs">Amenities</p><p className="font-semibold text-slate-800">{viewListing.amenities?.length ?? 0}</p></div>
              <div><p className="text-slate-400 text-xs">Status</p><p className="font-semibold text-slate-800 capitalize">{viewListing.status}</p></div>
            </div>
            {viewListing.tour_360_url && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">360 Room Tour</p>
                <Viewer360 src={viewListing.tour_360_url} className="border-slate-100" />
              </div>
            )}
          </div>
        </div>
      )}

      {editListing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">Edit Listing</h3>
              <button onClick={() => setEditListing(null)} className="text-sm text-slate-500 hover:text-slate-700">Close</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <input value={editForm.property_type} onChange={(e) => setEditForm((p) => ({ ...p, property_type: e.target.value }))} placeholder="Type" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <input value={editForm.street_address} onChange={(e) => setEditForm((p) => ({ ...p, street_address: e.target.value }))} placeholder="Address" className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <input value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <input type="number" value={editForm.monthly_rent} onChange={(e) => setEditForm((p) => ({ ...p, monthly_rent: Number(e.target.value || 0) }))} placeholder="Rent" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <input type="number" value={editForm.bedrooms} onChange={(e) => setEditForm((p) => ({ ...p, bedrooms: Number(e.target.value || 1) }))} placeholder="Bedrooms" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <input type="number" value={editForm.bathrooms} onChange={(e) => setEditForm((p) => ({ ...p, bathrooms: Number(e.target.value || 1) }))} placeholder="Bathrooms" className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900" />
              <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value as typeof editForm.status }))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900">
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="rented">Rented</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditListing(null)} className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-700">Cancel</button>
              <button onClick={() => void saveEdit()} disabled={savingEdit} className="px-3 py-2 rounded-lg text-sm bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-60">
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
