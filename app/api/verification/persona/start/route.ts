import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";

type StartPayload = {
  redirectUri?: string;
};

type PersonaCreateInquiryResponse = {
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

function sameOriginRedirect(input: string | undefined, allowedOrigin: string): string | null {
  if (!input) {
    return null;
  }
  try {
    const parsed = new URL(input);
    if (parsed.origin !== allowedOrigin) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function getPersonaError(payload: PersonaCreateInquiryResponse): string {
  const firstError = payload.errors?.[0];
  return firstError?.detail ?? firstError?.title ?? "Unable to create Persona inquiry.";
}

function buildPersonaHostedUrl(inquiryId: string, redirectUri: string | null, referenceId: string): string {
  const hostedFlowUrl = process.env.PERSONA_HOSTED_FLOW_URL ?? "https://inquiry.withpersona.com/verify";
  const url = new URL(hostedFlowUrl);
  url.searchParams.set("inquiry-id", inquiryId);
  url.searchParams.set("reference-id", referenceId);
  if (redirectUri) {
    url.searchParams.set("redirect-uri", redirectUri);
  }
  return url.toString();
}

export async function POST(request: Request) {
  if (!hasSupabaseAdmin) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  const personaApiKey = process.env.PERSONA_API_KEY;
  const inquiryTemplateId = process.env.PERSONA_INQUIRY_TEMPLATE_ID;
  if (!personaApiKey || !inquiryTemplateId) {
    return NextResponse.json(
      { ok: false, error: "PERSONA_API_KEY and PERSONA_INQUIRY_TEMPLATE_ID are required." },
      { status: 500 },
    );
  }

  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { data: landlordProfile } = await supabaseAdmin
    .from("landlord_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!landlordProfile?.id) {
    return NextResponse.json({ ok: false, error: "Landlord profile not found." }, { status: 403 });
  }

  let payload: StartPayload = {};
  try {
    payload = (await request.json()) as StartPayload;
  } catch {
    payload = {};
  }

  const requestOrigin = new URL(request.url).origin;
  const safeRedirectUri = sameOriginRedirect(payload.redirectUri, requestOrigin);

  const personaResponse = await fetch(`${PERSONA_BASE_URL}/inquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${personaApiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "inquiry",
        attributes: {
          "inquiry-template-id": inquiryTemplateId,
          "reference-id": userId,
          ...(safeRedirectUri ? { "redirect-uri": safeRedirectUri } : {}),
        },
      },
    }),
  });

  const personaPayload = (await personaResponse.json()) as PersonaCreateInquiryResponse;
  if (!personaResponse.ok) {
    return NextResponse.json({ ok: false, error: getPersonaError(personaPayload) }, { status: 502 });
  }

  const inquiryId = personaPayload.data?.id;
  if (!inquiryId) {
    return NextResponse.json({ ok: false, error: "Persona inquiry response missing id." }, { status: 502 });
  }

  const inquiryUrlFromPersona =
    typeof personaPayload.data?.attributes?.["inquiry-url"] === "string"
      ? (personaPayload.data?.attributes?.["inquiry-url"] as string)
      : null;
  const verifyUrl = inquiryUrlFromPersona ?? buildPersonaHostedUrl(inquiryId, safeRedirectUri, userId);

  return NextResponse.json({
    ok: true,
    inquiryId,
    verifyUrl,
  });
}

