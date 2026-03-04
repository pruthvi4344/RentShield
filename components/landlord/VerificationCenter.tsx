"use client";

import { useState } from "react";

type VStatus = "verified" | "pending" | "not_submitted";

const steps: { id: string; title: string; description: string; status: VStatus; docType: string }[] = [
  { id: "identity", title: "Identity Verification", description: "Upload a government-issued ID (passport, driver's license, or national ID).", status: "verified", docType: "ID Document" },
  { id: "property", title: "Property Ownership", description: "Upload property deed, title, or a lease agreement proving you own or manage the property.", status: "pending", docType: "Property Document" },
  { id: "phone", title: "Phone Verification", description: "Verify your phone number with a one-time SMS code.", status: "verified", docType: "Phone Number" },
];

const cfg = {
  verified: { label: "Verified", dot: "bg-emerald-400", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div> },
  pending: { label: "Pending Review", dot: "bg-amber-400", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div> },
  not_submitted: { label: "Not Submitted", dot: "bg-slate-300", badge: "bg-slate-100 text-slate-500 border-slate-200", icon: <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div> },
};

export default function VerificationCenter() {
  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const verified = steps.filter(s => s.status === "verified").length;
  const pct = Math.round((verified / steps.length) * 100);

  function simulateUpload(id: string) {
    setUploading(id);
    setTimeout(() => setUploading(null), 2000);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Verification Center</h2>
        <p className="text-sm text-slate-500 mt-0.5">Complete verification to start listing properties on RentShield.</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Verification Progress</p>
            <p className="text-xs text-slate-500 mt-0.5">{verified} of {steps.length} steps complete</p>
          </div>
          <span className={`text-2xl font-extrabold ${pct >= 100 ? "text-emerald-600" : "text-amber-500"}`}>{pct}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        {pct < 100 && (
          <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ Complete all steps before your listings can go live.</p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => {
          const c = cfg[step.status];
          return (
            <div key={step.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${step.status === "verified" ? "bg-emerald-50 text-emerald-600" : step.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
                  {step.id === "identity" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1" /></svg>}
                  {step.id === "property" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  {step.id === "phone" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${c.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">{step.description}</p>

                  {step.status === "verified" && (
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Verification complete
                    </p>
                  )}

                  {step.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-amber-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-400 h-1.5 rounded-full w-3/5 animate-pulse" />
                      </div>
                      <p className="text-xs text-amber-600 font-medium whitespace-nowrap">Under review · 24–48h</p>
                    </div>
                  )}

                  {step.status === "not_submitted" && step.id !== "phone" && (
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" onChange={() => simulateUpload(step.id)} />
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${uploading === step.id ? "bg-slate-100 text-slate-400" : "bg-teal-500 hover:bg-teal-600 text-white shadow-sm"}`}>
                        {uploading === step.id ? (
                          <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Uploading...</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Upload {step.docType}</>
                        )}
                      </span>
                    </label>
                  )}

                  {step.status === "not_submitted" && step.id === "phone" && (
                    <div className="space-y-2">
                      {!codeSent ? (
                        <div className="flex gap-2">
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (416) 000-0000" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          <button onClick={() => setCodeSent(true)} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-colors">Send Code</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">Verify</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {c.icon}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5">
        <p className="text-sm font-bold text-teal-900 mb-1">🔒 Your documents are safe</p>
        <p className="text-xs text-teal-700 leading-relaxed">All uploaded documents are encrypted with AES-256 and reviewed only by the RentShield trust & safety team. They are never shared with renters.</p>
      </div>
    </div>
  );
}