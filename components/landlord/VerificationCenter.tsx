"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { LandlordProfileRecord } from "@/types/profiles";

type VerificationStatus = "not_submitted" | "pending" | "verified";

type Props = {
  profile: LandlordProfileRecord | null;
  onSave: (updates: Partial<Omit<LandlordProfileRecord, "id" | "created_at" | "updated_at">>) => Promise<void>;
  saving?: boolean;
};

type PersonaStartPayload = {
  ok: boolean;
  inquiryId?: string;
  verifyUrl?: string;
  error?: string;
};

type PersonaCompletePayload = {
  ok: boolean;
  inquiryId?: string;
  inquiryStatus?: string;
  identityStatus?: VerificationStatus;
  propertyStatus?: VerificationStatus;
  phoneStatus?: VerificationStatus;
  isVerified?: boolean;
  error?: string;
};

const PERSONA_INQUIRY_STORAGE_KEY = "leaseverse_persona_inquiry_id";

const statusConfig = {
  verified: { label: "Verified", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  not_submitted: { label: "Not Submitted", badge: "bg-slate-100 text-slate-500 border-slate-200" },
} as const;

function allVerified(identity: VerificationStatus, property: VerificationStatus, phone: VerificationStatus): boolean {
  return identity === "verified" && property === "verified" && phone === "verified";
}

function identityStepStatus(identity: VerificationStatus, property: VerificationStatus): VerificationStatus {
  if (identity === "verified" && property === "verified") {
    return "verified";
  }
  if (identity === "pending" || property === "pending" || identity === "verified" || property === "verified") {
    return "pending";
  }
  return "not_submitted";
}

function normalizeInquiryStatus(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function isTerminalInquiryStatus(value: string | undefined): boolean {
  const normalized = normalizeInquiryStatus(value);
  return ["approved", "declined", "failed", "expired", "canceled", "cancelled"].includes(normalized);
}

function shouldAutoSyncAfterRedirect(value: string | undefined): boolean {
  const normalized = normalizeInquiryStatus(value);
  return ["approved", "completed", "declined", "failed", "expired", "canceled", "cancelled"].includes(normalized);
}

export default function VerificationCenter({ profile, onSave, saving = false }: Props) {
  const [phoneInput, setPhoneInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [startingPersona, setStartingPersona] = useState(false);
  const [syncingPersona, setSyncingPersona] = useState(false);
  const [personaInquiryId, setPersonaInquiryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const identityStatus = profile?.identity_verification_status ?? "not_submitted";
  const propertyStatus = profile?.property_ownership_status ?? "not_submitted";
  const phoneStatus = profile?.phone_verification_status ?? "not_submitted";

  const identityStatusForUi = identityStepStatus(identityStatus, propertyStatus);
  const identityVerified = identityStatusForUi === "verified";
  const verifiedCount = [identityStatus, propertyStatus, phoneStatus].filter((status) => status === "verified").length;
  const progress = Math.round((verifiedCount / 3) * 100);

  const lockMessage = useMemo(
    () =>
      profile?.is_verified
        ? "Your landlord account is verified. All features are unlocked."
        : "Complete identity and phone verification to unlock all landlord features.",
    [profile?.is_verified],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadEmailVerification() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (authError || !user) {
        setEmailVerified(null);
        return;
      }

      setEmailVerified(Boolean(user.email_confirmed_at));
    }

    void loadEmailVerification();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setPhoneInput(profile.phone_number_for_verification ?? profile.phone ?? "");
  }, [profile]);

  // Mount-only URL hydration for Persona return params.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const lastInquiryId = window.localStorage.getItem(PERSONA_INQUIRY_STORAGE_KEY);
    if (lastInquiryId) {
      setPersonaInquiryId(lastInquiryId);
    }

    const url = new URL(window.location.href);
    const inquiryIdFromRedirect = url.searchParams.get("inquiry-id") ?? url.searchParams.get("inquiry_id");
    const redirectStatus = url.searchParams.get("status") ?? undefined;
    if (!inquiryIdFromRedirect) {
      return;
    }

    window.localStorage.setItem(PERSONA_INQUIRY_STORAGE_KEY, inquiryIdFromRedirect);
    setPersonaInquiryId(inquiryIdFromRedirect);

    url.searchParams.delete("inquiry-id");
    url.searchParams.delete("inquiry_id");
    url.searchParams.delete("status");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

    if (shouldAutoSyncAfterRedirect(redirectStatus)) {
      setInfo("Returned from Persona. Syncing your verification result...");
      void syncPersonaResult(inquiryIdFromRedirect);
      return;
    }

    setInfo('Returned from Persona. Click "Sync Persona Result" to update your verification status.');
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

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

  async function getAccessToken(): Promise<string | null> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return null;
    }

    return session.access_token;
  }

  async function startPersonaVerification() {
    setError("");
    setInfo("");

    if (identityVerified) {
      setInfo("Identity verification is already complete.");
      return;
    }

    setStartingPersona(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Session expired. Please login again.");
      }

      const redirectUri = typeof window !== "undefined" ? window.location.href : undefined;
      const response = await fetch("/api/verification/persona/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ redirectUri }),
      });

      const payload = (await response.json()) as PersonaStartPayload;
      if (!response.ok || !payload.ok || !payload.verifyUrl || !payload.inquiryId) {
        throw new Error(payload.error ?? "Unable to start Persona verification.");
      }

      window.localStorage.setItem(PERSONA_INQUIRY_STORAGE_KEY, payload.inquiryId);
      setPersonaInquiryId(payload.inquiryId);

      await updateStatuses("pending", "pending", phoneStatus, {
        identity_document_name: null,
        property_document_name: null,
      });

      window.location.assign(payload.verifyUrl);
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : "Unable to start Persona verification.";
      setError(message);
    } finally {
      setStartingPersona(false);
    }
  }

  async function syncPersonaResult(inquiryIdOverride?: string) {
    setError("");
    setInfo("");

    const inquiryId = inquiryIdOverride ?? personaInquiryId;
    if (!inquiryId) {
      setError("No Persona inquiry found yet. Start verification first.");
      return;
    }

    setSyncingPersona(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Session expired. Please login again.");
      }

      const response = await fetch("/api/verification/persona/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ inquiryId }),
      });

      const payload = (await response.json()) as PersonaCompletePayload;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to sync Persona verification result.");
      }

      const nextIdentity = payload.identityStatus ?? identityStatus;
      const nextProperty = payload.propertyStatus ?? propertyStatus;
      const nextPhone = payload.phoneStatus ?? phoneStatus;
      const nextIsVerified = payload.isVerified ?? allVerified(nextIdentity, nextProperty, nextPhone);

      await onSave({
        identity_verification_status: nextIdentity,
        property_ownership_status: nextProperty,
        phone_verification_status: nextPhone,
        is_verified: nextIsVerified,
      });

      const normalizedStatus = normalizeInquiryStatus(payload.inquiryStatus);
      if (normalizedStatus === "approved") {
        setInfo("Persona verification approved and status synced.");
      } else if (normalizedStatus === "completed") {
        setInfo("Persona verification submitted. Result is pending review.");
      } else if (normalizedStatus) {
        setInfo(`Persona status synced: ${normalizedStatus}.`);
      } else {
        setInfo("Persona status synced.");
      }

      if (isTerminalInquiryStatus(payload.inquiryStatus)) {
        window.localStorage.removeItem(PERSONA_INQUIRY_STORAGE_KEY);
        setPersonaInquiryId(null);
      }
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Unable to sync Persona status.";
      setError(message);
    } finally {
      setSyncingPersona(false);
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

    await updateStatuses(identityStatus, propertyStatus, "pending", {
      phone_number_for_verification: phoneInput.trim(),
    });
  }

  async function verifyOtp() {
    setError("");
    setInfo("");

    if (!otpInput.trim()) {
      setError("Enter OTP first.");
      return;
    }

    if (otpInput.trim() !== demoOtp) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    await updateStatuses(identityStatus, propertyStatus, "verified", {
      phone_number_for_verification: phoneInput.trim(),
      phone: phoneInput.trim(),
    });

    setOtpSent(false);
    setDemoOtp("");
    setOtpInput("");
    setInfo("Phone verification complete.");
  }

  const emailBadgeClass =
    emailVerified === true
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : emailVerified === false
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-slate-100 text-slate-500 border-slate-200";
  const emailStatusLabel = emailVerified === true ? "Verified" : emailVerified === false ? "Not Verified" : "Unknown";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Verification Center</h2>
        <p className="text-sm text-slate-500 mt-0.5">Complete email, phone OTP, and Persona identity verification.</p>
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

      {profile.is_verified && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-emerald-700">Your account is verified</h3>
          <p className="text-sm text-emerald-700 mt-1">Identity and phone checks are complete. Verification actions are now disabled.</p>
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {info && <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{info}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Email Verification</h3>
            <p className="text-sm text-slate-500">This is managed by account email confirmation in Supabase Auth.</p>
            <p className="text-xs text-slate-400 mt-1">{profile.email}</p>
            {emailVerified === false && (
              <p className="text-xs text-amber-600 mt-1">Please verify your email from the link sent during signup.</p>
            )}
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${emailBadgeClass}`}>{emailStatusLabel}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Identity Verification (Persona)</h3>
            <p className="text-sm text-slate-500">Persona will collect government ID and a live selfie in its hosted flow.</p>
            <p className="text-xs text-slate-400 mt-1">Your app stores only verification statuses, not ID/selfie files.</p>
            {personaInquiryId && <p className="text-xs text-slate-400 mt-1">Current inquiry: {personaInquiryId}</p>}
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConfig[identityStatusForUi].badge}`}>
            {statusConfig[identityStatusForUi].label}
          </span>
        </div>

        {identityVerified ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">Identity verification complete</p>
            <p className="text-xs text-emerald-700 mt-1">Persona approved your identity check.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Flow: start Persona verification, upload ID and selfie on Persona, return to app, then sync result.
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void startPersonaVerification()}
                disabled={startingPersona || syncingPersona || saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-60"
              >
                {startingPersona ? "Opening Persona..." : "Start Persona Verification"}
              </button>
              <button
                onClick={() => void syncPersonaResult()}
                disabled={syncingPersona || startingPersona || saving || !personaInquiryId}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60"
              >
                {syncingPersona ? "Syncing..." : "Sync Persona Result"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Phone Verification (OTP)</h3>
            <p className="text-sm text-slate-500">Enter phone number, request OTP, and verify.</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusConfig[phoneStatus].badge}`}>
            {statusConfig[phoneStatus].label}
          </span>
        </div>

        {phoneStatus === "verified" ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">Phone verification complete</p>
            <p className="text-xs text-emerald-700 mt-1">{profile.phone_number_for_verification ?? profile.phone ?? "Verified phone number on file."}</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+1 416 000 0000"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={() => void sendOtp()}
                disabled={saving}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60"
              >
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
                <button
                  onClick={() => void verifyOtp()}
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60"
                >
                  Verify OTP
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
