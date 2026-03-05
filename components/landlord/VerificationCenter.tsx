"use client";

import { useMemo, useState } from "react";
import type { LandlordProfileRecord } from "@/types/profiles";
import { supabase } from "@/lib/supabaseClient";

type VerificationStatus = "not_submitted" | "pending" | "verified";

type Props = {
  profile: LandlordProfileRecord | null;
  onSave: (updates: Partial<Omit<LandlordProfileRecord, "id" | "created_at" | "updated_at">>) => Promise<void>;
  saving?: boolean;
};

const allowedExt = [".pdf", ".jpeg", ".jpg", ".png"];
const verificationBucket = "verification-documents";

const statusConfig = {
  verified: { label: "Verified", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending Review", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  not_submitted: { label: "Not Submitted", badge: "bg-slate-100 text-slate-500 border-slate-200" },
} as const;

function isValidFile(name: string): boolean {
  const lower = name.toLowerCase();
  return allowedExt.some((ext) => lower.endsWith(ext));
}

function allVerified(identity: VerificationStatus, property: VerificationStatus, phone: VerificationStatus): boolean {
  return identity === "verified" && property === "verified" && phone === "verified";
}

function canUploadDocument(status: VerificationStatus): boolean {
  return status === "not_submitted";
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function VerificationCenter({ profile, onSave, saving = false }: Props) {
  const [uploading, setUploading] = useState<"identity" | "property" | null>(null);
  const [phoneInput, setPhoneInput] = useState(profile?.phone_number_for_verification ?? profile?.phone ?? "");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const identityStatus = profile?.identity_verification_status ?? "not_submitted";
  const propertyStatus = profile?.property_ownership_status ?? "not_submitted";
  const phoneStatus = profile?.phone_verification_status ?? "not_submitted";
  const verifiedCount = [identityStatus, propertyStatus, phoneStatus].filter((status) => status === "verified").length;
  const progress = Math.round((verifiedCount / 3) * 100);

  const lockMessage = useMemo(
    () =>
      profile?.is_verified
        ? "Your landlord account is verified. All features are unlocked."
        : "Complete all 3 verification steps to unlock all landlord features.",
    [profile?.is_verified],
  );

  if (!profile) {
    return <div className="text-sm text-slate-500">Loading verification...</div>;
  }

  async function updateStatuses(
    nextIdentity: VerificationStatus,
    nextProperty: VerificationStatus,
    nextPhone: VerificationStatus,
    extra: Partial<Omit<LandlordProfileRecord, "id" | "created_at" | "updated_at">> = {},
  ) {
    const verified = allVerified(nextIdentity, nextProperty, nextPhone);
    await onSave({
      identity_verification_status: nextIdentity,
      property_ownership_status: nextProperty,
      phone_verification_status: nextPhone,
      is_verified: verified,
      ...extra,
    });
  }

  async function handleUpload(kind: "identity" | "property", file: File) {
    const currentProfile = profile;
    if (!currentProfile) {
      setError("Profile not loaded yet. Please refresh and try again.");
      return;
    }

    setError("");
    setInfo("");

    if (!isValidFile(file.name)) {
      setError("Invalid file format. Only PDF, JPEG, PNG, or JPG are allowed.");
      return;
    }

    setUploading(kind);
    setInfo("Uploading document...");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const safeName = sanitizeFileName(file.name);
      const storagePath = `${currentProfile.id}/${kind}/${Date.now()}-${safeName}`;
      const { error: storageError } = await supabase.storage
        .from(verificationBucket)
        .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });

      if (storageError) {
        throw new Error(`Failed to upload document file: ${storageError.message}`);
      }

      if (kind === "identity") {
        await updateStatuses("pending", propertyStatus, phoneStatus, { identity_document_name: file.name });
        const { error: queueError } = await supabase.from("landlord_verification_requests").insert({
          landlord_id: currentProfile.id,
          request_type: "identity",
          document_name: file.name,
          document_storage_path: storagePath,
          document_content_type: file.type || null,
          status: "pending",
        });
        if (queueError) {
          setError("Document uploaded, but review queue entry failed. Please contact support.");
        }
        void fetch("/api/verification/notify-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verificationType: "identity",
            documentName: file.name,
            landlordEmail: currentProfile.email,
            landlordName: currentProfile.username,
          }),
        });
        setInfo("Identity document uploaded successfully. Status is pending review. Please wait 24-48 hours.");
        return;
      }

      await updateStatuses(identityStatus, "pending", phoneStatus, { property_document_name: file.name });
      const { error: queueError } = await supabase.from("landlord_verification_requests").insert({
        landlord_id: currentProfile.id,
        request_type: "property",
        document_name: file.name,
        document_storage_path: storagePath,
        document_content_type: file.type || null,
        status: "pending",
      });
      if (queueError) {
        setError("Document uploaded, but review queue entry failed. Please contact support.");
      }
      void fetch("/api/verification/notify-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationType: "property",
          documentName: file.name,
          landlordEmail: currentProfile.email,
          landlordName: currentProfile.username,
        }),
      });
      setInfo("Property ownership document uploaded successfully. Status is pending review. Please wait 24-48 hours.");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Failed to upload document. Please try again.";
      setError(message);
      setInfo("");
    } finally {
      setUploading(null);
    }
  }

  async function sendOtp() {
    setError("");
    setInfo("");
    if (!phoneInput.trim()) {
      setError("Enter phone number first.");
      return;
    }

    const generated = `${Math.floor(100000 + Math.random() * 900000)}`;
    setDemoOtp(generated);

    setOtpSent(true);
    setInfo(`Demo OTP sent: ${generated}`);

    await updateStatuses(identityStatus, propertyStatus, "pending", { phone_number_for_verification: phoneInput });
  }

  async function verifyOtp() {
    setError("");
    setInfo("");
    if (!otpInput.trim()) {
      setError("Enter OTP first.");
      return;
    }
    if (otpInput !== demoOtp) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    await updateStatuses(identityStatus, propertyStatus, "verified", {
      phone_number_for_verification: phoneInput,
      phone: phoneInput,
    });
    setOtpSent(false);
    setDemoOtp("");
    setOtpInput("");
    setInfo("Phone verification complete.");
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Verification Center</h2>
        <p className="text-sm text-slate-500 mt-0.5">Complete verification to start listing properties on RentShield.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Verification Progress</p>
            <p className="text-xs text-slate-500 mt-0.5">{verifiedCount} of 3 steps complete</p>
          </div>
          <span className={`text-2xl font-extrabold ${progress >= 100 ? "text-emerald-600" : "text-amber-500"}`}>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <p className={`text-xs mt-2 font-medium ${profile.is_verified ? "text-emerald-600" : "text-amber-600"}`}>{lockMessage}</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{info}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Identity Verification</h3>
            <p className="text-sm text-slate-500">Upload government ID. Allowed formats: PDF, JPEG, PNG, JPG.</p>
            {profile.identity_document_name && <p className="text-xs text-slate-400 mt-1">Uploaded: {profile.identity_document_name}</p>}
            {identityStatus === "pending" && (
              <p className="text-xs text-amber-600 mt-1">Document uploaded. Review takes 24-48 hours.</p>
            )}
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConfig[identityStatus].badge}`}>{statusConfig[identityStatus].label}</span>
        </div>
        {canUploadDocument(identityStatus) ? (
          <label className="inline-flex mt-3 cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpeg,.jpg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  return;
                }

                const confirmed = window.confirm(`Are you sure you want to upload "${file.name}" for identity verification?`);
                if (!confirmed) {
                  setInfo("Upload canceled. You can choose another file.");
                  e.target.value = "";
                  return;
                }

                void handleUpload("identity", file);
                e.target.value = "";
              }}
            />
            <span className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-60">
              {uploading === "identity" || saving ? "Uploading..." : "Upload Identity File"}
            </span>
          </label>
        ) : (
          <p className="text-xs font-medium text-slate-500 mt-3">
            Re-upload is locked while review is in progress or after approval. You can upload again if this gets rejected.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Property Ownership</h3>
            <p className="text-sm text-slate-500">Upload property proof. Allowed formats: PDF, JPEG, PNG, JPG.</p>
            {profile.property_document_name && <p className="text-xs text-slate-400 mt-1">Uploaded: {profile.property_document_name}</p>}
            {propertyStatus === "pending" && (
              <p className="text-xs text-amber-600 mt-1">Document uploaded. Review takes 24-48 hours.</p>
            )}
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConfig[propertyStatus].badge}`}>{statusConfig[propertyStatus].label}</span>
        </div>
        {canUploadDocument(propertyStatus) ? (
          <label className="inline-flex mt-3 cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpeg,.jpg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  return;
                }

                const confirmed = window.confirm(`Are you sure you want to upload "${file.name}" for property ownership verification?`);
                if (!confirmed) {
                  setInfo("Upload canceled. You can choose another file.");
                  e.target.value = "";
                  return;
                }

                void handleUpload("property", file);
                e.target.value = "";
              }}
            />
            <span className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-60">
              {uploading === "property" || saving ? "Uploading..." : "Upload Property File"}
            </span>
          </label>
        ) : (
          <p className="text-xs font-medium text-slate-500 mt-3">
            Re-upload is locked while review is in progress or after approval. You can upload again if this gets rejected.
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Phone Verification (OTP)</h3>
            <p className="text-sm text-slate-500">Enter phone number, receive OTP, then verify.</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConfig[phoneStatus].badge}`}>{statusConfig[phoneStatus].label}</span>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="+1 416 000 0000"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button onClick={() => void sendOtp()} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl">
              Send OTP
            </button>
          </div>

          {otpSent && (
            <div className="flex gap-2">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button onClick={() => void verifyOtp()} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl">
                Verify OTP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
