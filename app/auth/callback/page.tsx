"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { resolvePostLoginRoute } from "@/lib/profileService";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleAuthCallback() {
      if (!isSupabaseConfigured) {
        setError("Supabase is not configured.");
        return;
      }

      const nextPath = searchParams.get("next");
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      const queryError = searchParams.get("error_description") ?? searchParams.get("error");
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashError = hashParams.get("error_description") ?? hashParams.get("error");

      if (queryError || hashError) {
        setError(queryError ?? hashError ?? "Verification failed.");
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        const route = await resolvePostLoginRoute(nextPath);
        router.replace(route);
        return;
      }

      if (tokenHash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (verifyError) {
          setError(verifyError.message);
          return;
        }
        const route = await resolvePostLoginRoute(nextPath);
        router.replace(route);
        return;
      }

      if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setSessionError) {
          setError(setSessionError.message);
          return;
        }
        const route = await resolvePostLoginRoute(nextPath);
        router.replace(route);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const route = await resolvePostLoginRoute(nextPath);
        router.replace(route);
        return;
      }

      setError("Invalid verification link.");
    }

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 border border-slate-100 shadow-xl shadow-slate-200/70">
        <h1 className="text-xl font-bold text-slate-900">{error ? "Verification Failed" : "Verifying your account..."}</h1>
        {error ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-red-600">{error}</p>
            <Link href="/login" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
              Back to login
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Please wait while we finish sign-in.</p>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 border border-slate-100 shadow-xl shadow-slate-200/70">
            <h1 className="text-xl font-bold text-slate-900">Verifying your account...</h1>
            <p className="mt-2 text-sm text-slate-600">Please wait while we finish sign-in.</p>
          </div>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
