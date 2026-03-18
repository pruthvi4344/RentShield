"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RenterProfileRecord } from "@/types/profiles";

type VerificationStatus = "not_submitted" | "pending" | "verified";

type Props = {
  profile: RenterProfileRecord | null;
  onSave: (updates: Partial<Omit<RenterProfileRecord, "id" | "created_at" | "updated_at">>) => Promise<void>;
  saving?: boolean;
};

const statusConfig = {
  verified: { label: "Verified", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "OTP Sent", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  not_submitted: { label: "Not Verified", badge: "bg-slate-100 text-slate-500 border-slate-200" },
} as const;

export default function VerificationStatus({ profile, onSave, saving = false }: Props) {
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const phoneStatus: VerificationStatus = profile?.phone_verification_status ?? "not_submitted";

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
    setPhoneInput(profile?.phone_number_for_verification ?? profile?.phone ?? "");
  }, [profile?.phone, profile?.phone_number_for_verification]);

  const completedCount = useMemo(() => {
    return Number(emailVerified === true) + Number(phoneStatus === "verified");
  }, [emailVerified, phoneStatus]);

  const progress = Math.round((completedCount / 2) * 100);
  const accountVerified = Boolean(profile?.is_verified);

  if (!profile) {
    return <div className="text-sm text-slate-500">Loading verification...</div>;
  }

  async function sendOtp() {
    setError("");
    setInfo("");

    if (!phoneInput.trim()) {
      setError("Enter your mobile number first.");
      return;
    }

    const generatedOtp = `${Math.floor(100000 + Math.random() * 900000)}`;
    setDemoOtp(generatedOtp);
    setOtpInput("");
    setOtpSent(true);

    await onSave({
      phone_number_for_verification: phoneInput.trim(),
      phone_verification_status: "pending",
      is_verified: false,
    });

    setInfo(`Demo OTP sent: ${generatedOtp}`);
  }

  async function verifyOtp() {
    setError("");
    setInfo("");

    if (!otpInput.trim()) {
      setError("Enter the OTP first.");
      return;
    }

    if (otpInput.trim() !== demoOtp) {
      setError("Invalid OTP. Please try again.");
      return;
    }

    await onSave({
      phone: phoneInput.trim(),
      phone_number_for_verification: phoneInput.trim(),
      phone_verification_status: "verified",
      is_verified: emailVerified !== false,
    });

    setOtpSent(false);
    setDemoOtp("");
    setOtpInput("");
    setInfo("Mobile number verified successfully.");
  }

  const emailBadgeClass =
    emailVerified === true
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : emailVerified === false
        ? "bg-red-100 text-red-700 border-red-200"
        : "bg-slate-100 text-slate-500 border-slate-200";
  const emailStatusLabel = emailVerified === true ? "Verified" : emailVerified === false ? "Not Verified" : "Checking";

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Verification Status</h2>
        <p className="mt-0.5 text-sm text-slate-500">Your renter account uses email verification and mobile OTP verification only.</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Verification Progress</p>
            <p className="mt-0.5 text-xs text-slate-500">{completedCount} of 2 steps complete</p>
          </div>
          <span className={`text-2xl font-extrabold ${progress === 100 ? "text-emerald-600" : "text-amber-500"}`}>{progress}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className={`mt-2 text-xs font-medium ${accountVerified ? "text-emerald-600" : "text-amber-600"}`}>
          {accountVerified
            ? "Your renter account is verified. All features are unlocked."
            : "Verify your mobile number to unlock full renter access."}
        </p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {info ? <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{info}</div> : null}

      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Email Verification</h3>
            <p className="text-sm text-slate-500">Your email was verified during account registration.</p>
            <p className="mt-1 text-xs text-slate-400">{profile.email}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${emailBadgeClass}`}>{emailStatusLabel}</span>
        </div>

        {emailVerified === true ? (
          <p className="mt-3 text-xs font-medium text-emerald-600">Verification complete</p>
        ) : emailVerified === false ? (
          <p className="mt-3 text-xs font-medium text-amber-600">Please confirm your email from the signup link before continuing.</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Mobile Number Verification</h3>
            <p className="text-sm text-slate-500">Enter your mobile number, request an OTP, and verify it here.</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig[phoneStatus].badge}`}>
            {statusConfig[phoneStatus].label}
          </span>
        </div>

        {phoneStatus === "verified" ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-700">Mobile number verified</p>
            <p className="mt-1 text-xs text-emerald-700">{profile.phone_number_for_verification ?? profile.phone ?? "Verified number on file."}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="tel"
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="+1 416 000 0000"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => void sendOtp()}
                disabled={saving}
                className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
              >
                Send OTP
              </button>
            </div>

            {otpSent && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={otpInput}
                  onChange={(event) => setOtpInput(event.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => void verifyOtp()}
                  disabled={saving}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  Verify OTP
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400">For now this uses a demo OTP flow inside RentShield. Real SMS provider integration can be added later.</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-teal-900">Why this matters</p>
            <p className="text-xs leading-relaxed text-teal-700">
              Verified renter accounts help landlords trust inquiries, improve match quality, and unlock the full RentShield renter experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
