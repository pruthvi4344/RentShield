import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";

type VerificationStatus = "not_submitted" | "pending" | "verified";

type PersonaWebhookEvent = {
  data?: {
    attributes?: {
      name?: string;
      payload?: {
        data?: {
          id?: string;
          attributes?: Record<string, unknown>;
        };
      };
    };
  };
};

type SignatureParts = {
  timestamp: string;
  signature: string;
};

function parseSignatureHeader(header: string | null): SignatureParts | null {
  if (!header) {
    return null;
  }

  const parts = header.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signaturePart = parts.find((part) => part.startsWith("v1="));
  if (!timestampPart || !signaturePart) {
    return null;
  }

  const timestamp = timestampPart.slice(2).trim();
  const signature = signaturePart.slice(3).trim();
  if (!timestamp || !signature) {
    return null;
  }

  return { timestamp, signature };
}

function verifySignature(payload: string, header: string | null, secret: string): boolean {
  const parsed = parseSignatureHeader(header);
  if (!parsed) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(parsed.signature, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function mapPersonaToVerification(status: string): VerificationStatus {
  if (status === "approved") {
    return "verified";
  }
  if (["declined", "failed", "expired", "canceled", "cancelled"].includes(status)) {
    return "not_submitted";
  }
  return "pending";
}

function extractReferenceId(attributes: Record<string, unknown>): string | null {
  const candidates = [attributes["reference-id"], attributes.reference_id, attributes.referenceId];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (!hasSupabaseAdmin) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "PERSONA_WEBHOOK_SECRET is missing." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("persona-signature");
  if (!verifySignature(rawBody, signatureHeader, webhookSecret)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  let eventPayload: PersonaWebhookEvent;
  try {
    eventPayload = JSON.parse(rawBody) as PersonaWebhookEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON webhook payload." }, { status: 400 });
  }

  const eventName = normalize(eventPayload.data?.attributes?.name);
  const inquiry = eventPayload.data?.attributes?.payload?.data;
  const inquiryAttributes = inquiry?.attributes;

  if (!eventName.startsWith("inquiry.") || !inquiryAttributes) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const referenceId = extractReferenceId(inquiryAttributes);
  if (!referenceId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const inquiryStatus = normalize(inquiryAttributes.status ?? eventName.replace("inquiry.", ""));
  const nextIdentityStatus = mapPersonaToVerification(inquiryStatus);
  const nextPropertyStatus = nextIdentityStatus;

  const { error: updateError } = await supabaseAdmin
    .from("landlord_profiles")
    .update({
      identity_verification_status: nextIdentityStatus,
      property_ownership_status: nextPropertyStatus,
      identity_document_name: null,
      property_document_name: null,
    })
    .eq("id", referenceId);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    inquiryId: inquiry?.id ?? null,
    inquiryStatus,
    referenceId,
  });
}
