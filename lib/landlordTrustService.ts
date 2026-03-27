import { supabase } from "@/lib/supabaseClient";
import { buildLandlordTrustScore } from "@/lib/landlordTrustScore";
import type { ChatMessage } from "@/types/chat";
import type { LandlordProfileRecord } from "@/types/profiles";
import type { LandlordTrustScore, LandlordTrustListingInput } from "@/lib/landlordTrustScore";

export type { LandlordTrustScore, LandlordTrustListingInput } from "@/lib/landlordTrustScore";

export async function computeLandlordTrustScore(profile: LandlordProfileRecord): Promise<LandlordTrustScore> {
  const [{ data: listingsData, error: listingsError }, { data: conversationsData, error: conversationsError }] = await Promise.all([
    supabase
      .from("landlord_listings")
      .select("title, property_type, street_address, city, postal_code, square_feet, monthly_rent, security_deposit, available_from, amenities, listing_media(id), listing_photos(id)")
      .eq("landlord_id", profile.id),
    supabase
      .from("conversations")
      .select("id")
      .eq("landlord_id", profile.id),
  ]);

  if (listingsError) {
    throw new Error(listingsError.message);
  }

  if (conversationsError) {
    throw new Error(conversationsError.message);
  }

  const conversationIds = (conversationsData ?? []).map((row) => row.id as string);

  let messages: ChatMessage[] = [];
  if (conversationIds.length > 0) {
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true });

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    messages = (messagesData ?? []) as ChatMessage[];
  }

  return buildLandlordTrustScore(
    profile,
    (listingsData ?? []) as LandlordTrustListingInput[],
    messages,
  );
}
