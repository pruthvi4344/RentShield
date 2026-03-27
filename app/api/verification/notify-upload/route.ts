import { NextResponse } from "next/server";
import { hasSupabaseAdmin, supabaseAdmin } from "@/lib/supabaseAdmin";
import { createClient } from "@supabase/supabase-js";
import { buildLandlordTrustScore } from "@/lib/landlordTrustScore";
import type { ChatMessage } from "@/types/chat";
import type { LandlordProfileRecord } from "@/types/profiles";
import type { LandlordTrustListingInput, LandlordTrustScore } from "@/lib/landlordTrustScore";

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

async function fetchLandlordTrustScores(landlordIds: string[]): Promise<Map<string, LandlordTrustScore>> {
  const uniqueIds = Array.from(new Set(landlordIds.filter(Boolean)));
  const scoreMap = new Map<string, LandlordTrustScore>();

  if (uniqueIds.length === 0) {
    return scoreMap;
  }

  const [
    { data: profilesData, error: profilesError },
    { data: listingsData, error: listingsError },
    { data: conversationsData, error: conversationsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("landlord_profiles")
      .select("id, email, username, is_verified, identity_verification_status, property_ownership_status, phone_verification_status, phone_number_for_verification, phone, city, bio, business_name, avatar_url, created_at, updated_at")
      .in("id", uniqueIds),
    supabaseAdmin
      .from("landlord_listings")
      .select("landlord_id, title, property_type, street_address, formatted_address, place_id, latitude, longitude, city, postal_code, square_feet, monthly_rent, security_deposit, available_from, amenities, listing_media(id), listing_photos(id)")
      .in("landlord_id", uniqueIds),
    supabaseAdmin
      .from("conversations")
      .select("id, landlord_id")
      .in("landlord_id", uniqueIds),
  ]);

  if (profilesError) throw new Error(profilesError.message);
  if (listingsError) throw new Error(listingsError.message);
  if (conversationsError) throw new Error(conversationsError.message);

  const conversationToLandlord = new Map<string, string>();
  const conversationIds: string[] = [];
  for (const row of conversationsData ?? []) {
    conversationToLandlord.set(row.id as string, row.landlord_id as string);
    conversationIds.push(row.id as string);
  }

  let messagesByLandlord = new Map<string, ChatMessage[]>();
  if (conversationIds.length > 0) {
    const { data: messagesData, error: messagesError } = await supabaseAdmin
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true });

    if (messagesError) throw new Error(messagesError.message);

    for (const row of (messagesData ?? []) as ChatMessage[]) {
      const landlordId = conversationToLandlord.get(row.conversation_id);
      if (!landlordId) continue;
      const current = messagesByLandlord.get(landlordId) ?? [];
      current.push(row);
      messagesByLandlord.set(landlordId, current);
    }
  }

  const listingsByLandlord = new Map<string, LandlordTrustListingInput[]>();
  for (const row of (listingsData ?? []) as Array<LandlordTrustListingInput & { landlord_id: string }>) {
    const current = listingsByLandlord.get(row.landlord_id) ?? [];
    current.push(row);
    listingsByLandlord.set(row.landlord_id, current);
  }

  for (const profile of (profilesData ?? []) as LandlordProfileRecord[]) {
    scoreMap.set(
      profile.id,
      buildLandlordTrustScore(
        profile,
        listingsByLandlord.get(profile.id) ?? [],
        messagesByLandlord.get(profile.id) ?? [],
      ),
    );
  }

  return scoreMap;
}

function labelForType(type: VerificationType): string {
  return type === "identity" ? "Identity Verification" : "Property Ownership Verification";
}

async function createSignedMediaUrl(path: string, preferredBucket: "property-media" | "listing-media" | "listing-photos") {
  const buckets = preferredBucket === "property-media"
    ? ["property-media", "listing-media"] as const
    : preferredBucket === "listing-media"
      ? ["listing-media", "property-media"] as const
      : ["listing-photos", "property-media"] as const;

  for (const bucket of buckets) {
    const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      return data.signedUrl;
    }
  }

  return null;
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
          landlord_id,
          title,
          property_type,
          street_address,
          formatted_address,
          place_id,
          latitude,
          longitude,
          city,
          bedrooms,
          bathrooms,
          monthly_rent,
          amenities,
          furnished_status,
          featured_listing,
          discount_percentage,
          discount_duration_months,
          limited_time_offer_title,
          limited_time_offer_description,
          limited_time_offer_expires_at,
          internet_included,
          parking_included,
          matterport_url,
          matterport_embed,
          tour_360_storage_path,
          status,
          listing_media (
            storage_path,
            media_type,
            sort_order
          ),
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

    const savedLandlordIds = (savedRows ?? [])
      .map((row) => {
        const listingJoin = row.landlord_listings as unknown;
        const listingRaw = Array.isArray(listingJoin) ? listingJoin[0] : listingJoin;
        return listingRaw && typeof listingRaw === "object" && "landlord_id" in listingRaw
          ? String((listingRaw as { landlord_id: string }).landlord_id)
          : null;
      })
      .filter((value): value is string => Boolean(value));
    const trustScores = await fetchLandlordTrustScores(savedLandlordIds);

    const savedListings = await Promise.all(
      (savedRows ?? []).map(async (row) => {
        const listingJoin = row.landlord_listings as unknown;
        const listingRaw = Array.isArray(listingJoin) ? listingJoin[0] : listingJoin;

        if (!listingRaw || typeof listingRaw !== "object") {
          return null;
        }

        const typedListing = listingRaw as {
          id: string;
          landlord_id: string;
          title: string;
          property_type: string;
          street_address: string;
          formatted_address: string | null;
          place_id: string | null;
          latitude: number | null;
          longitude: number | null;
          city: string;
          bedrooms: number;
          bathrooms: number;
          monthly_rent: number;
          amenities: string[] | null;
          furnished_status: string;
          featured_listing: boolean;
          discount_percentage: number | null;
          discount_duration_months: number | null;
          limited_time_offer_title: string | null;
          limited_time_offer_description: string | null;
          limited_time_offer_expires_at: string | null;
          internet_included: boolean;
          parking_included: boolean;
          matterport_url: string | null;
          matterport_embed: string | null;
          tour_360_storage_path: string | null;
          status: string;
          listing_media?: Array<{ storage_path: string; media_type: "image" | "video" | "panorama"; sort_order: number }> | null;
          listing_photos?: Array<{ storage_path: string; sort_order: number }> | null;
          landlord_profiles?: { username: string | null; email: string | null; is_verified: boolean | null } | Array<{ username: string | null; email: string | null; is_verified: boolean | null }> | null;
        };

        const media = [...(typedListing.listing_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        const mediaImages = media.filter((item) => item.media_type === "image");
        const photos = mediaImages.length > 0 ? mediaImages : [...(typedListing.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        let imageUrl: string | null = null;
        if (photos[0]?.storage_path) {
          imageUrl = await createSignedMediaUrl(photos[0].storage_path, mediaImages.length > 0 ? "property-media" : "listing-photos");
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
          landlordId: typedListing.landlord_id,
          title: typedListing.title,
          type: typedListing.property_type,
          city: typedListing.city,
          neighbourhood: typedListing.street_address,
          formattedAddress: typedListing.formatted_address,
          placeId: typedListing.place_id,
          latitude: typedListing.latitude,
          longitude: typedListing.longitude,
          price: Number(typedListing.monthly_rent),
          beds: typedListing.bedrooms,
          baths: typedListing.bathrooms,
          amenities: Array.isArray(typedListing.amenities) ? typedListing.amenities : [],
          furnished: typedListing.furnished_status === "furnished",
          landlordName: profile?.username ?? "Landlord",
          landlordEmail: profile?.email ?? null,
          verified: Boolean(profile?.is_verified),
          landlordTrustScore: trustScores.get(typedListing.landlord_id)?.score ?? null,
          landlordTrustLabel: trustScores.get(typedListing.landlord_id)?.label ?? null,
          image: imageUrl,
          tour360Url: typedListing.tour_360_storage_path,
          tag: typedListing.featured_listing ? "Featured Property" : typedListing.property_type,
          featuredListing: typedListing.featured_listing,
          specialOfferBadge: typedListing.discount_percentage
            ? `First ${typedListing.discount_duration_months ?? 1} month${(typedListing.discount_duration_months ?? 1) > 1 ? "s" : ""} ${typedListing.discount_percentage}% off`
            : typedListing.limited_time_offer_title,
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
      formatted_address,
      place_id,
      latitude,
      longitude,
      city,
      postal_code,
      bedrooms,
      bathrooms,
      square_feet,
      monthly_rent,
      security_deposit,
      utilities_included,
      internet_included,
      parking_included,
      amenities,
      discount_percentage,
      discount_duration_months,
      limited_time_offer_title,
      limited_time_offer_description,
      limited_time_offer_expires_at,
      featured_listing,
      matterport_url,
      matterport_embed,
      tour_360_storage_path,
      available_from,
      lease_duration_months,
      furnished_status,
      status,
      created_at,
      listing_media (
        id,
        storage_path,
        media_type,
        sort_order
      ),
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
    .eq("status", "active");

  const { data, error } =
    purpose === "listing-detail" && listingId
      ? await query.eq("id", listingId).limit(1)
      : await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const landlordTrustScores = await fetchLandlordTrustScores((data ?? []).map((row) => row.landlord_id as string));

  const mappedListings = await Promise.all(
    (data ?? []).map(async (row) => {
      const media = [...((row.listing_media as Array<{ storage_path: string; media_type: "image" | "video" | "panorama"; sort_order: number }> | null) ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      const mediaImages = media.filter((item) => item.media_type === "image");
      const mediaVideos = media.filter((item) => item.media_type === "video");
      const mediaPanoramas = media.filter((item) => item.media_type === "panorama");
      const legacyPhotos = [...((row.listing_photos as Array<{ storage_path: string; sort_order: number }> | null) ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      const photoSource = mediaImages.length > 0 ? mediaImages : legacyPhotos;
      const photoUrls = await Promise.all(
        photoSource.map((photo) => createSignedMediaUrl(photo.storage_path, mediaImages.length > 0 ? "property-media" : "listing-photos")),
      );
      const videoUrls = await Promise.all(
        mediaVideos.map((video) => createSignedMediaUrl(video.storage_path, "property-media")),
      );
      const panoramaPath = row.tour_360_storage_path ?? mediaPanoramas[0]?.storage_path ?? null;
      const tour360Url = panoramaPath ? await createSignedMediaUrl(panoramaPath, "property-media") : null;
      const validPhotoUrls = photoUrls.filter((item): item is string => Boolean(item));
      const validVideoUrls = videoUrls.filter((item): item is string => Boolean(item));

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
        formattedAddress: row.formatted_address,
        placeId: row.place_id,
        latitude: row.latitude,
        longitude: row.longitude,
        postalCode: row.postal_code,
        price: Number(row.monthly_rent),
        beds: row.bedrooms,
        baths: row.bathrooms,
        squareFeet: row.square_feet,
        deposit: row.security_deposit ? Number(row.security_deposit) : null,
        utilitiesIncluded: Boolean(row.utilities_included),
        internetIncluded: Boolean(row.internet_included),
        parkingIncluded: Boolean(row.parking_included),
        amenities: Array.isArray(row.amenities) ? row.amenities : [],
        furnished: row.furnished_status === "furnished",
        furnishedStatus: row.furnished_status,
        featuredListing: Boolean(row.featured_listing),
        specialOfferBadge: row.discount_percentage
          ? `First ${row.discount_duration_months ?? 1} month${(row.discount_duration_months ?? 1) > 1 ? "s" : ""} ${row.discount_percentage}% off`
          : row.limited_time_offer_title,
        limitedTimeOfferDescription: row.limited_time_offer_description,
        limitedTimeOfferExpiresAt: row.limited_time_offer_expires_at,
        matterportUrl: row.matterport_url,
        matterportEmbed: row.matterport_embed,
        tour360Url,
        availableFrom: row.available_from,
        leaseDurationMonths: row.lease_duration_months,
        landlordName: profile?.username ?? "Landlord",
        landlordEmail: profile?.email ?? null,
        verified: Boolean(profile?.is_verified),
        landlordTrustScore: landlordTrustScores.get(row.landlord_id)?.score ?? null,
        landlordTrustLabel: landlordTrustScores.get(row.landlord_id)?.label ?? null,
        image: validPhotoUrls[0] ?? null,
        images: validPhotoUrls,
        videos: validVideoUrls,
        photoCount: validPhotoUrls.length,
        videoCount: validVideoUrls.length,
        createdAt: row.created_at,
        status: row.status,
        tag: row.featured_listing ? "Featured Property" : row.property_type,
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
