"use client";

import { useState } from "react";

const initialListings = [
  { id: 1, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=70", title: "Modern Condo – Downtown Spadina", address: "88 Spadina Ave, Toronto, ON M5V 2J2", price: 2200, type: "Condo", beds: 1, baths: 1, status: "active", views: 143, inquiries: 7, postedDate: "Feb 15, 2026" },
  { id: 2, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=70", title: "Private Room near UW Campus", address: "412 King St N, Waterloo, ON N2J 2Z3", price: 850, type: "Private Room", beds: 1, baths: 1, status: "active", views: 98, inquiries: 4, postedDate: "Feb 22, 2026" },
  { id: 3, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=70", title: "Cozy Basement Suite – Plateau", address: "342 Rue Saint-Denis, Montréal, QC H2X 3K4", price: 1100, type: "Basement", beds: 1, baths: 1, status: "rented", views: 106, inquiries: 5, postedDate: "Jan 10, 2026" },
];

const statusCfg = {
  active: { label: "Active", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending Review", class: "bg-amber-100 text-amber-700 border-amber-200" },
  rented: { label: "Rented", class: "bg-teal-100 text-teal-700 border-teal-200" },
};

export default function MyListings() {
  const [listings, setListings] = useState(initialListings);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">My Listings</h2>
          <p className="text-sm text-slate-500 mt-0.5">{listings.length} propert{listings.length !== 1 ? "ies" : "y"} listed</p>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="text-5xl mb-3">🏚️</div>
          <p className="font-semibold text-slate-600 text-lg">No listings yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first property to start receiving inquiries.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map(l => {
            const s = statusCfg[l.status as keyof typeof statusCfg];
            return (
              <div key={l.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
                    <img src={l.image} alt={l.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.class}`}>{s.label}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{l.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">📍 {l.address}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                          <span className="font-bold text-slate-900 text-lg">${l.price.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></span>
                          <span className="px-2 py-0.5 bg-slate-100 rounded-full">{l.type}</span>
                          <span>{l.beds} bd · {l.baths} ba</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-5 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        <span className="font-semibold text-slate-700">{l.views}</span> views
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <span className="font-semibold text-slate-700">{l.inquiries}</span> inquiries
                      </span>
                      <span>Listed {l.postedDate}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
                      <button className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-100 transition-colors flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                      </button>
                      <button className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        View
                      </button>
                      {deleteConfirm === l.id ? (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-xs text-slate-500">Delete?</span>
                          <button onClick={() => setListings(prev => prev.filter(x => x.id !== l.id))} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors">Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-colors">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(l.id)} className="ml-auto px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-lg border border-red-100 transition-colors flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
    </div>
  );
}