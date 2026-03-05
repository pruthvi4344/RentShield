import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";

type AdminActionPayload = {
  requestId?: string;
  action?: "approve" | "reject";
  reviewNotes?: string;
};

function getAdminPanelKey(): string {
  return process.env.ADMIN_PANEL_KEY ?? "";
}

function getProvidedAdminKey(request: Request): string {
  return request.headers.get("x-admin-key")?.trim() ?? "";
}

function ensureAdminAuthorized(request: Request): NextResponse | null {
  const expectedKey = getAdminPanelKey();
  if (!expectedKey) {
    return NextResponse.json({ ok: false, error: "ADMIN_PANEL_KEY is missing." }, { status: 500 });
  }

  const providedKey = getProvidedAdminKey(request);
  if (!providedKey || providedKey !== expectedKey) {
    return NextResponse.json({ ok: false, error: "Forbidden: invalid admin key." }, { status: 403 });
  }

  return null;
}

export async function GET(request: Request) {
  if (!hasSupabaseAdmin) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const authFailure = ensureAdminAuthorized(request);
  if (authFailure) {
    return authFailure;
  }

  const { data, error } = await supabaseAdmin
    .from("landlord_verification_requests")
    .select(`
      id,
      landlord_id,
      request_type,
      document_name,
      document_storage_path,
      document_content_type,
      status,
      submitted_at,
      reviewed_at,
      review_notes,
      reviewed_by,
      landlord_profiles!landlord_verification_requests_landlord_id_fkey (
        username,
        email
      )
    `)
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const requestsWithSignedUrl = await Promise.all(
    (data ?? []).map(async (item) => {
      const storagePath = item.document_storage_path as string | null;
      if (!storagePath) {
        return { ...item, document_url: null };
      }

      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from("verification-documents")
        .createSignedUrl(storagePath, 60 * 60);

      if (signedError || !signedData?.signedUrl) {
        return { ...item, document_url: null };
      }

      return { ...item, document_url: signedData.signedUrl };
    }),
  );

  return NextResponse.json({ ok: true, requests: requestsWithSignedUrl });
}

export async function POST(request: Request) {
  if (!hasSupabaseAdmin) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const authFailure = ensureAdminAuthorized(request);
  if (authFailure) {
    return authFailure;
  }

  let payload: AdminActionPayload;
  try {
    payload = (await request.json()) as AdminActionPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload." }, { status: 400 });
  }

  const requestId = payload.requestId?.trim();
  const action = payload.action;
  const reviewNotes = payload.reviewNotes?.trim() ?? null;

  if (!requestId || !action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ ok: false, error: "requestId and valid action are required." }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("landlord_verification_requests")
    .select("id, landlord_id, request_type, status, document_storage_path")
    .eq("id", requestId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ ok: false, error: "Verification request not found." }, { status: 404 });
  }

  const nextRequestStatus = action === "approve" ? "approved" : "rejected";
  const nextProfileStatus = action === "approve" ? "verified" : "not_submitted";
  const requestType = existing.request_type as "identity" | "property";

  const profileUpdates: {
    identity_verification_status?: "verified" | "not_submitted";
    property_ownership_status?: "verified" | "not_submitted";
    identity_document_name?: null;
    property_document_name?: null;
  } = {};

  if (requestType === "identity") {
    profileUpdates.identity_verification_status = nextProfileStatus;
    if (action === "reject") {
      profileUpdates.identity_document_name = null;
    }
  } else {
    profileUpdates.property_ownership_status = nextProfileStatus;
    if (action === "reject") {
      profileUpdates.property_document_name = null;
    }
  }

  const reviewer = "admin-panel";

  const { error: requestUpdateError } = await supabaseAdmin
    .from("landlord_verification_requests")
    .update({
      status: nextRequestStatus,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes,
      reviewed_by: reviewer,
    })
    .eq("id", requestId);

  if (requestUpdateError) {
    return NextResponse.json({ ok: false, error: requestUpdateError.message }, { status: 500 });
  }

  const { error: profileUpdateError } = await supabaseAdmin
    .from("landlord_profiles")
    .update(profileUpdates)
    .eq("id", existing.landlord_id);

  if (profileUpdateError) {
    return NextResponse.json({ ok: false, error: profileUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
