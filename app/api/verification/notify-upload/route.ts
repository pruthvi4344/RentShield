import { NextResponse } from "next/server";

type VerificationType = "identity" | "property";

type NotifyPayload = {
  verificationType?: VerificationType;
  documentName?: string;
  landlordEmail?: string;
  landlordName?: string;
};

function labelForType(type: VerificationType): string {
  return type === "identity" ? "Identity Verification" : "Property Ownership Verification";
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.VERIFICATION_ADMIN_EMAIL;
  const fromEmail = process.env.VERIFICATION_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey || !adminEmail) {
    return NextResponse.json(
      { ok: false, skipped: true, message: "Email provider env vars are not configured." },
      { status: 200 },
    );
  }

  let payload: NotifyPayload;
  try {
    payload = (await request.json()) as NotifyPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const verificationType = payload.verificationType;
  const documentName = payload.documentName;
  const landlordEmail = payload.landlordEmail;
  const landlordName = payload.landlordName ?? "Landlord";

  if (!verificationType || !documentName || !landlordEmail) {
    return NextResponse.json(
      { ok: false, error: "verificationType, documentName, landlordEmail are required" },
      { status: 400 },
    );
  }

  const subject = `RentShield: ${labelForType(verificationType)} document uploaded`;
  const submittedAt = new Date().toISOString();

  const html = `
    <h2>Landlord verification document submitted</h2>
    <p><strong>Type:</strong> ${labelForType(verificationType)}</p>
    <p><strong>Document:</strong> ${documentName}</p>
    <p><strong>Landlord Name:</strong> ${landlordName}</p>
    <p><strong>Landlord Email:</strong> ${landlordEmail}</p>
    <p><strong>Submitted At (UTC):</strong> ${submittedAt}</p>
    <p>Please review this request in the admin panel.</p>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [adminEmail],
      subject,
      html,
    }),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    return NextResponse.json(
      { ok: false, error: "Failed to send notification email", providerError: errorText },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
