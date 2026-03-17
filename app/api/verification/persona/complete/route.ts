import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";

type VerificationStatus = "not_submitted" | "pending" | "verified";

type CompletePayload = {
  inquiryId?: string;
};

type PersonaInquiryResponse = {
  data?: {
    id?: string;
    attributes?: Record<string, unknown>;
  };
  errors?: Array<{ title?: string; detail?: string }>;
};

const PERSONA_BASE_URL = "https://withpersona.com/api/v1";

function getAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !anonKey) {
    return null;
  }
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length).trim() || null;
}

async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const token = readBearerToken(request);
  if (!token) {
    return null;
  }

  const authClient = getAuthClient();
  if (!authClient) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);
  if (error || !user?.id) {
    return null;
  }

  return user.id;
}

function normalize(input: unknown): string {
  return typeof input === "string" ? input.trim().toLowerCase() : "";
}

function getPersonaError(payload: PersonaInquiryResponse): string {
  const firstError = payload.errors?.[0];
  return firstError?.detail ?? firstError?.title ?? "Unable to retrieve Persona inquiry.";
}

function extractReferenceId(attributes: Record<string, unknown>): string | null {
  const candidates = [attributes["reference-id"], attributes.reference_id, attributes.referenceId];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function mapInquiryStatusToVerification(status: string): VerificationStatus {
  const normalized = normalize(status);

  if (normalized === "approved") {
    return "verified";
  }

  if (["declined", "failed", "expired", "canceled", "cancelled"].includes(normalized)) {
    return "not_submitted";
  }

  return "pending";
}

export async function POST(request: Request) {
  if (!hasSupabaseAdmin) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const personaApiKey = process.env.PERSONA_API_KEY;
  if (!personaApiKey) {
    return NextResponse.json({ ok: false, error: "PERSONA_API_KEY is missing." }, { status: 500 });
  }

  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let payload: CompletePayload;
  try {
    payload = (await request.json()) as CompletePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const inquiryId = payload.inquiryId?.trim();
  if (!inquiryId) {
    return NextResponse.json({ ok: false, error: "inquiryId is required." }, { status: 400 });
  }

  const inquiryResponse = await fetch(`${PERSONA_BASE_URL}/inquiries/${encodeURIComponent(inquiryId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${personaApiKey}`,
    },
  });

  const inquiryPayload = (await inquiryResponse.json()) as PersonaInquiryResponse;
  if (!inquiryResponse.ok) {
    return NextResponse.json({ ok: false, error: getPersonaError(inquiryPayload) }, { status: 502 });
  }

  const inquiryAttributes = inquiryPayload.data?.attributes;
  if (!inquiryAttributes) {
    return NextResponse.json({ ok: false, error: "Persona inquiry response missing attributes." }, { status: 502 });
  }

  const referenceId = extractReferenceId(inquiryAttributes);
  if (!referenceId || referenceId !== userId) {
    return NextResponse.json({ ok: false, error: "Persona inquiry does not belong to this user." }, { status: 403 });
  }

  const inquiryStatus = normalize(inquiryAttributes.status);
  const nextIdentityStatus = mapInquiryStatusToVerification(inquiryStatus);
  const nextPropertyStatus = nextIdentityStatus;

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from("landlord_profiles")
    .update({
      identity_verification_status: nextIdentityStatus,
      property_ownership_status: nextPropertyStatus,
      identity_document_name: null,
      property_document_name: null,
    })
    .eq("id", userId)
    .select("identity_verification_status, property_ownership_status, phone_verification_status, is_verified")
    .single();

  if (updateError || !updatedProfile) {
    return NextResponse.json({ ok: false, error: updateError?.message ?? "Failed to update landlord profile." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    inquiryId,
    inquiryStatus,
    identityStatus: updatedProfile.identity_verification_status,
    propertyStatus: updatedProfile.property_ownership_status,
    phoneStatus: updatedProfile.phone_verification_status,
    isVerified: updatedProfile.is_verified,
  });
}
