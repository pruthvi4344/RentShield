import type { ChatMessage } from "@/types/chat";
import type { LandlordProfileRecord } from "@/types/profiles";

export type LandlordTrustListingInput = {
  title: string;
  property_type: string;
  street_address: string;
  city: string;
  postal_code: string | null;
  square_feet: number | null;
  monthly_rent: number;
  security_deposit: number | null;
  available_from: string | null;
  amenities: string[] | null;
  listing_media?: Array<{ id: string }> | null;
  listing_photos?: Array<{ id: string }> | null;
};

export type LandlordTrustScore = {
  score: number;
  label: string;
  summary: string;
  breakdown: {
    verification: number;
    profile: number;
    listings: number;
    responsiveness: number;
  };
};

function scoreVerification(profile: LandlordProfileRecord): number {
  const statusScore = (status: "not_submitted" | "pending" | "verified", max: number) => {
    if (status === "verified") return max;
    if (status === "pending") return Math.round(max * 0.5);
    return 0;
  };

  return (
    statusScore(profile.identity_verification_status, 15) +
    statusScore(profile.property_ownership_status, 15) +
    statusScore(profile.phone_verification_status, 10) +
    (profile.is_verified ? 5 : 0)
  );
}

function scoreProfileCompleteness(profile: LandlordProfileRecord): number {
  const checks = [
    Boolean(profile.username?.trim()),
    Boolean(profile.email?.trim()),
    Boolean(profile.phone?.trim() || profile.phone_number_for_verification?.trim()),
    Boolean(profile.city?.trim()),
    Boolean(profile.bio?.trim()),
    Boolean(profile.business_name?.trim()),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 20);
}

function scoreListings(listings: LandlordTrustListingInput[]): number {
  if (listings.length === 0) {
    return 0;
  }

  const listingScores = listings.map((listing) => {
    const checks = [
      Boolean(listing.title?.trim()),
      Boolean(listing.property_type?.trim()),
      Boolean(listing.street_address?.trim()),
      Boolean(listing.city?.trim()),
      Boolean(listing.postal_code?.trim()),
      typeof listing.square_feet === "number" && listing.square_feet > 0,
      typeof listing.monthly_rent === "number" && listing.monthly_rent > 0,
      typeof listing.security_deposit === "number" && listing.security_deposit >= 0,
      Boolean(listing.available_from),
      Array.isArray(listing.amenities) && listing.amenities.length > 0,
      ((listing.listing_media?.length ?? 0) + (listing.listing_photos?.length ?? 0)) >= 3,
    ];

    return checks.filter(Boolean).length / checks.length;
  });

  return Math.round((listingScores.reduce((sum, value) => sum + value, 0) / listingScores.length) * 25);
}

function scoreResponsiveness(landlordId: string, messages: ChatMessage[]): number {
  if (messages.length === 0) {
    return 6;
  }

  const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const responseTimesHours: number[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current.sender_id === landlordId) {
      continue;
    }

    for (let nextIndex = index + 1; nextIndex < sorted.length; nextIndex += 1) {
      const next = sorted[nextIndex];
      if (next.conversation_id !== current.conversation_id) {
        break;
      }

      if (next.sender_id === landlordId) {
        const deltaMs = new Date(next.created_at).getTime() - new Date(current.created_at).getTime();
        if (deltaMs >= 0) {
          responseTimesHours.push(deltaMs / (1000 * 60 * 60));
        }
        break;
      }
    }
  }

  if (responseTimesHours.length === 0) {
    return 2;
  }

  const averageHours = responseTimesHours.reduce((sum, value) => sum + value, 0) / responseTimesHours.length;

  if (averageHours <= 1) return 10;
  if (averageHours <= 6) return 8;
  if (averageHours <= 24) return 6;
  if (averageHours <= 48) return 4;
  return 2;
}

function buildSummary(breakdown: LandlordTrustScore["breakdown"]): string {
  const factors = [
    { text: "verification", ratio: breakdown.verification / 45 },
    { text: "listing quality", ratio: breakdown.listings / 25 },
    { text: "profile completeness", ratio: breakdown.profile / 20 },
    { text: "response time", ratio: breakdown.responsiveness / 10 },
  ].sort((a, b) => b.ratio - a.ratio);

  return `Based on ${factors[0].text}, ${factors[1].text}, and ${factors[2].text}`;
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 50) return "Building";
  return "New";
}

export function buildLandlordTrustScore(
  profile: LandlordProfileRecord,
  listings: LandlordTrustListingInput[],
  messages: ChatMessage[],
): LandlordTrustScore {
  const breakdown = {
    verification: scoreVerification(profile),
    profile: scoreProfileCompleteness(profile),
    listings: scoreListings(listings),
    responsiveness: scoreResponsiveness(profile.id, messages),
  };

  const score = breakdown.verification + breakdown.profile + breakdown.listings + breakdown.responsiveness;

  return {
    score,
    label: scoreLabel(score),
    summary: buildSummary(breakdown),
    breakdown,
  };
}
