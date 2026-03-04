"use client";

import { useState } from "react";

type VerifStatus = "verified" | "pending" | "not_submitted";

const verificationItems: {
  id: string;
  title: string;
  description: string;
  status: VerifStatus;
  icon: React.ReactNode;
}[] = [
  {
    id: "email",
    title: "Email Verified",
    description: "Your email address has been confirmed.",
    status: "verified",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "identity",
    title: "Identity Verified",
    description: "Government-issued ID reviewed and approved.",
    status: "pending",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
      </svg>
    ),
  },
  {
    id: "student",
    title: "Student Status",
    description: "Prove you are an enrolled student or recent graduate.",
    status: "not_submitted",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const statusConfig = {
  verified: {
    label: "Verified",
    dot: "bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    border: "border-emerald-100",
    icon: (
      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
  },
  pending: {
    label: "Pending Review",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    border: "border-amber-100",
    icon: (
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  },
  not_submitted: {
    label: "Not Submitted",
    dot: "bg-slate-300",
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    border: "border-slate-100",
    icon: (
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  },
};

const completedCount = verificationItems.filter((i) => i.status === "verified").length;
const totalCount = verificationItems.length;
const pct = Math.round((completedCount / totalCount) * 100);

export default function VerificationStatus() {
  const [uploading, setUploading] = useState<string | null>(null);

  function simulateUpload(id: string) {
    setUploading(id);
    setTimeout(() => setUploading(null), 2000);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Verification Status</h2>
        <p className="text-sm text-slate-500 mt-0.5">Complete verification to unlock full access to RentShield.</p>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Overall Verification Progress</p>
            <p className="text-xs text-slate-500 mt-0.5">{completedCount} of {totalCount} steps complete</p>
          </div>
          <span className={`text-2xl font-extrabold ${pct >= 100 ? "text-emerald-600" : pct >= 50 ? "text-teal-600" : "text-amber-600"}`}>
            {pct}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${pct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-teal-500 to-cyan-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct < 100 && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
            ⚠️ Complete all steps to get the Verified Renter badge and access more listings.
          </p>
        )}
      </div>

      {/* Verification items */}
      <div className="space-y-4">
        {verificationItems.map((item) => {
          const cfg = statusConfig[item.status];
          return (
            <div key={item.id} className={`bg-white rounded-2xl border ${cfg.border} p-5 shadow-sm`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  item.status === "verified" ? "bg-emerald-50 text-emerald-600" :
                  item.status === "pending" ? "bg-amber-50 text-amber-600" :
                  "bg-slate-50 text-slate-400"
                }`}>
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>

                  {/* Action */}
                  {item.status === "verified" && (
                    <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Verification complete
                    </p>
                  )}
                  {item.status === "pending" && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-amber-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-400 h-1.5 rounded-full w-2/3 animate-pulse" />
                      </div>
                      <p className="text-xs text-amber-600 font-medium">Under review · usually 24–48h</p>
                    </div>
                  )}
                  {item.status === "not_submitted" && (
                    <div className="mt-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={() => simulateUpload(item.id)}
                        />
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          uploading === item.id
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-teal-500 hover:bg-teal-600 text-white shadow-sm cursor-pointer"
                        }`}>
                          {uploading === item.id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Upload Document
                            </>
                          )}
                        </span>
                      </label>
                      <p className="text-xs text-slate-400 mt-1.5">Accepted: JPG, PNG, PDF · Max 5MB · Encrypted upload</p>
                    </div>
                  )}
                </div>

                {cfg.icon}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 text-teal-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-teal-900 mb-1">Why verify your identity?</p>
            <p className="text-xs text-teal-700 leading-relaxed">
              Verified renters get priority access to new listings, are more trusted by landlords, and unlock the full RentShield experience including secure document signing. Your data is encrypted and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}