import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";

type VerificationType = "identity" | "property";

type NotifyPayload = {
  verificationType?: VerificationType;
  documentName?: string;
  landlordEmail?: string;
  landlordName?: string;
};

type SavePayload = {
  listingId?: string;
};

function labelForType(type: VerificationType): string {
  return type === "identity" ? "Identity Verification" : "Property Ownership Verification";
}

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const purpose = url.searchParams.get("purpose");
  if (purpose !== "listings" && purpose !== "listing-detail" && purpose !== "saved-listings") {
    return NextResponse.json({ ok: false, error: "Unsupported GET request." }, { status: 400 });
  }

  if (!hasSupabaseAdmin) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
  }

  if (purpose === "saved-listings") {
    const renterId = await getAuthenticatedUserId(request);
    if (!renterId) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { data: savedRows, error: savedError } = await supabaseAdmin
      .from("renter_saved_listings")
      .select(`
        id,
        listing_id,
        created_at,
        landlord_listings!renter_saved_listings_listing_id_fkey (
          id,
          title,
          property_type,
          street_address,
          city,
          bedrooms,
          bathrooms,
          monthly_rent,
          amenities,
          furnished_status,
          status,
          listing_photos (
            storage_path,
            sort_order
          ),
          landlord_profiles!landlord_listings_landlord_id_fkey (
            username,
            email,
            is_verified
          )
        )
      `)
      .eq("renter_id", renterId)
      .order("created_at", { ascending: false });

    if (savedError) {
      return NextResponse.json({ ok: false, error: savedError.message }, { status: 500 });
    }

    const savedListings = await Promise.all(
      (savedRows ?? []).map(async (row) => {
        const listingJoin = row.landlord_listings as unknown;
        const listingRaw = Array.isArray(listingJoin) ? listingJoin[0] : listingJoin;

        if (!listingRaw || typeof listingRaw !== "object") {
          return null;
        }

        const typedListing = listingRaw as {
          id: string;
          title: string;
          property_type: string;
          street_address: string;
          city: string;
          bedrooms: number;
          bathrooms: number;
          monthly_rent: number;
          amenities: string[] | null;
          furnished_status: string;
          status: string;
          listing_photos?: Array<{ storage_path: string; sort_order: number }> | null;
          landlord_profiles?: { username: string | null; email: string | null; is_verified: boolean | null } | Array<{ username: string | null; email: string | null; is_verified: boolean | null }> | null;
        };

        const photos = [...(typedListing.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        let imageUrl: string | null = null;
        if (photos[0]?.storage_path) {
          const { data: signed } = await supabaseAdmin.storage
            .from("listing-photos")
            .createSignedUrl(photos[0].storage_path, 3600);
          imageUrl = signed?.signedUrl ?? null;
        }

        const profileRaw = typedListing.landlord_profiles as
          | { username: string | null; email: string | null; is_verified: boolean | null }
          | Array<{ username: string | null; email: string | null; is_verified: boolean | null }>
          | null;
        const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

        return {
          savedId: row.id,
          savedAt: row.created_at,
          id: typedListing.id,
          title: typedListing.title,
          type: typedListing.property_type,
          city: typedListing.city,
          neighbourhood: typedListing.street_address,
          price: Number(typedListing.monthly_rent),
          beds: typedListing.bedrooms,
          baths: typedListing.bathrooms,
          amenities: Array.isArray(typedListing.amenities) ? typedListing.amenities : [],
          furnished: typedListing.furnished_status === "furnished",
          landlordName: profile?.username ?? "Landlord",
          landlordEmail: profile?.email ?? null,
          verified: Boolean(profile?.is_verified),
          image: imageUrl,
          tag: typedListing.property_type,
        };
      }),
    );

    return NextResponse.json({ ok: true, listings: savedListings.filter(Boolean) });
  }

  const listingId = url.searchParams.get("id");

  const query = supabaseAdmin
    .from("landlord_listings")
    .select(`
      id,
      landlord_id,
      title,
      property_type,
      street_address,
      city,
      postal_code,
      bedrooms,
      bathrooms,
      square_feet,
      monthly_rent,
      security_deposit,
      utilities_included,
      amenities,
      available_from,
      lease_duration_months,
      furnished_status,
      status,
      created_at,
      listing_photos (
        id,
        storage_path,
        sort_order
      ),
      landlord_profiles!landlord_listings_landlord_id_fkey (
        username,
        email,
        is_verified
      )
    `)
    .in("status", ["pending", "active"]);

  const { data, error } =
    purpose === "listing-detail" && listingId
      ? await query.eq("id", listingId).limit(1)
      : await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const mappedListings = await Promise.all(
    (data ?? []).map(async (row) => {
      const photos = [...((row.listing_photos as Array<{ storage_path: string; sort_order: number }> | null) ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      const photoUrls = await Promise.all(
        photos.map(async (photo) => {
          const { data: signed } = await supabaseAdmin.storage
            .from("listing-photos")
            .createSignedUrl(photo.storage_path, 3600);
          return signed?.signedUrl ?? null;
        }),
      );
      const validPhotoUrls = photoUrls.filter((item): item is string => Boolean(item));

      const profileRaw = row.landlord_profiles as
        | { username: string | null; email: string | null; is_verified: boolean | null }
        | Array<{ username: string | null; email: string | null; is_verified: boolean | null }>
        | null;
      const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;

      return {
        id: row.id,
        landlordId: row.landlord_id,
        title: row.title,
        type: row.property_type,
        city: row.city,
        neighbourhood: row.street_address,
        postalCode: row.postal_code,
        price: Number(row.monthly_rent),
        beds: row.bedrooms,
        baths: row.bathrooms,
        squareFeet: row.square_feet,
        deposit: row.security_deposit ? Number(row.security_deposit) : null,
        utilitiesIncluded: Boolean(row.utilities_included),
        amenities: Array.isArray(row.amenities) ? row.amenities : [],
        furnished: row.furnished_status === "furnished",
        furnishedStatus: row.furnished_status,
        availableFrom: row.available_from,
        leaseDurationMonths: row.lease_duration_months,
        landlordName: profile?.username ?? "Landlord",
        landlordEmail: profile?.email ?? null,
        verified: Boolean(profile?.is_verified),
        image: validPhotoUrls[0] ?? null,
        images: validPhotoUrls,
        photoCount: validPhotoUrls.length,
        createdAt: row.created_at,
        status: row.status,
        tag: row.property_type,
      };
    }),
  );

  if (purpose === "listing-detail") {
    return NextResponse.json({ ok: true, listing: mappedListings[0] ?? null });
  }

  return NextResponse.json({ ok: true, listings: mappedListings });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const purpose = url.searchParams.get("purpose");

  if (purpose === "toggle-save") {
    if (!hasSupabaseAdmin) {
      return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is missing." }, { status: 500 });
    }

    const renterId = await getAuthenticatedUserId(request);
    if (!renterId) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    let payload: SavePayload;
    try {
      payload = (await request.json()) as SavePayload;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    const listingId = payload.listingId?.trim();
    if (!listingId) {
      return NextResponse.json({ ok: false, error: "listingId is required" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("renter_saved_listings")
      .select("id")
      .eq("renter_id", renterId)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (existing?.id) {
      const { error: removeError } = await supabaseAdmin
        .from("renter_saved_listings")
        .delete()
        .eq("id", existing.id)
        .eq("renter_id", renterId);

      if (removeError) {
        return NextResponse.json({ ok: false, error: removeError.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, saved: false });
    }

    const { error: insertError } = await supabaseAdmin
      .from("renter_saved_listings")
      .insert({ renter_id: renterId, listing_id: listingId });

    if (insertError) {
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, saved: true });
  }

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
