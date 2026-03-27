import type { RenterProfileRecord } from "@/types/profiles";

export type RecommendationCandidate = {
  id: string;
  landlordId: string;
  title: string;
  image: string | null;
  city: string;
  neighbourhood: string;
  type: string;
  price: number;
  beds: number;
  baths: number;
  amenities: string[];
  landlordName: string;
  landlordEmail?: string | null;
  verified: boolean;
  tag: string;
  furnished: boolean;
  featuredListing?: boolean;
  specialOfferBadge?: string | null;
  availableFrom?: string | null;
  utilitiesIncluded?: boolean;
  internetIncluded?: boolean;
  parkingIncluded?: boolean;
};

export type RecommendedListingMatch = RecommendationCandidate & {
  matchPercentage: number;
  explanation: string;
};

type ListingsPayload = {
  ok: boolean;
  error?: string;
  listings?: RecommendationCandidate[];
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function getCityToken(value: string | null | undefined): string {
  return normalizeText(value).split(",")[0]?.trim() ?? "";
}

function isSameCity(a: string | null | undefined, b: string | null | undefined): boolean {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);

  if (!normalizedA || !normalizedB) {
    return false;
  }

  if (normalizedA === normalizedB) {
    return true;
  }

  const cityTokenA = getCityToken(a);
  const cityTokenB = getCityToken(b);
  return cityTokenA !== "" && cityTokenA === cityTokenB;
}

function getPreferredListingCity(renter: RenterProfileRecord): string | null {
  const city = normalizeText(renter.move_to_city);
  if (!city) {
    return renter.city;
  }

  const province = (renter.move_to_province ?? "").trim();
  if (!province) {
    return renter.move_to_city;
  }

  const formattedProvince = province.length <= 3 ? province.toUpperCase() : province;
  return `${renter.move_to_city}, ${formattedProvince}`;
}

function getBudgetScore(renter: RenterProfileRecord, listing: RecommendationCandidate): number {
  const min = renter.budget_min ?? null;
  const max = renter.budget_max ?? null;
  const price = Number(listing.price);

  if (Number.isNaN(price) || price <= 0) {
    return 0;
  }

  if (min !== null && max !== null) {
    if (price >= min && price <= max) {
      return 25;
    }

    const overLimit = price > max ? (price - max) / max : (min - price) / min;
    return overLimit <= 0.1 ? 10 : 0;
  }

  if (max !== null) {
    if (price <= max) {
      return 25;
    }

    return (price - max) / max <= 0.1 ? 10 : 0;
  }

  if (min !== null) {
    if (price >= min) {
      return 25;
    }

    return (min - price) / min <= 0.1 ? 10 : 0;
  }

  return 0;
}

function getMoveInScore(renterMoveInDate: string | null, listingAvailableFrom: string | null | undefined): number {
  if (!renterMoveInDate || !listingAvailableFrom) {
    return 0;
  }

  const renterTs = new Date(renterMoveInDate).getTime();
  const listingTs = new Date(listingAvailableFrom).getTime();

  if (Number.isNaN(renterTs) || Number.isNaN(listingTs)) {
    return 0;
  }

  const diffDays = Math.abs(renterTs - listingTs) / (1000 * 60 * 60 * 24);

  if (diffDays <= 7) {
    return 20;
  }
  if (diffDays <= 14) {
    return 15;
  }
  if (diffDays <= 30) {
    return 10;
  }

  return 0;
}

function normalizeRoomType(value: string | null | undefined): string {
  return normalizeText(value).replace(/[_-]/g, " ");
}

function getRoomTypeScore(renterRoomType: string | null, listingType: string): number {
  const renterType = normalizeRoomType(renterRoomType);
  const listingRoomType = normalizeRoomType(listingType);

  if (!renterType || renterType === "any") {
    return 15;
  }

  if (renterType === listingRoomType) {
    return 15;
  }

  const compatiblePairs = new Set([
    "private room:condo room",
    "condo room:private room",
    "shared room:shared apartment",
    "shared apartment:shared room",
  ]);

  return compatiblePairs.has(`${renterType}:${listingRoomType}`) ? 8 : 0;
}

function getOptionalFeaturesScore(listing: RecommendationCandidate): number {
  const matches = [
    listing.utilitiesIncluded,
    listing.internetIncluded,
    listing.parkingIncluded,
    listing.featuredListing,
  ].filter(Boolean).length;

  return Math.min(matches * 3, 10);
}

function buildExplanation(parts: string[]): string {
  if (parts.length === 0) {
    return "Good overall fit for your renter profile";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} and ${parts[1]}`;
}

function shouldPassHardFilters(renter: RenterProfileRecord, listing: RecommendationCandidate): boolean {
  const preferredCity = getPreferredListingCity(renter);
  if (preferredCity && !isSameCity(preferredCity, listing.city)) {
    return false;
  }

  const budgetScore = getBudgetScore(renter, listing);
  if ((renter.budget_min !== null || renter.budget_max !== null) && budgetScore === 0) {
    return false;
  }

  if (renter.move_in_date && listing.availableFrom) {
    const renterTs = new Date(renter.move_in_date).getTime();
    const listingTs = new Date(listing.availableFrom).getTime();
    if (!Number.isNaN(renterTs) && !Number.isNaN(listingTs)) {
      const diffDays = Math.abs(renterTs - listingTs) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        return false;
      }
    }
  }

  return true;
}

function scoreListing(renter: RenterProfileRecord, listing: RecommendationCandidate): RecommendedListingMatch | null {
  if (!shouldPassHardFilters(renter, listing)) {
    return null;
  }

  const preferredCity = getPreferredListingCity(renter);
  const cityScore = isSameCity(preferredCity, listing.city) ? 30 : 0;
  const budgetScore = getBudgetScore(renter, listing);
  const moveInScore = getMoveInScore(renter.move_in_date, listing.availableFrom);
  const roomTypeScore = getRoomTypeScore(renter.room_preference, listing.type);
  const optionalFeaturesScore = getOptionalFeaturesScore(listing);

  const total = cityScore + budgetScore + moveInScore + roomTypeScore + optionalFeaturesScore;
  if (total < 50) {
    return null;
  }

  const explanationParts: string[] = [];
  if (cityScore > 0) explanationParts.push("Matches your move-to city");
  if (budgetScore >= 25) explanationParts.push("Fits your budget");
  else if (budgetScore > 0) explanationParts.push("Close to your budget");
  if (moveInScore >= 15) explanationParts.push("Available near your move-in date");
  if (roomTypeScore >= 15) explanationParts.push("Matches your preferred room type");
  else if (roomTypeScore > 0) explanationParts.push("Close to your room preference");
  if (optionalFeaturesScore > 0) explanationParts.push("Includes useful extras");

  return {
    ...listing,
    matchPercentage: Math.min(total, 100),
    explanation: buildExplanation(explanationParts),
  };
}

function buildFallbackRecommendation(
  renter: RenterProfileRecord,
  listing: RecommendationCandidate,
): RecommendedListingMatch | null {
  const preferredCity = getPreferredListingCity(renter);
  const cityScore = isSameCity(preferredCity, listing.city) ? 30 : 0;
  const budgetScore = getBudgetScore(renter, listing);
  const moveInScore = getMoveInScore(renter.move_in_date, listing.availableFrom);
  const roomTypeScore = getRoomTypeScore(renter.room_preference, listing.type);
  const optionalFeaturesScore = getOptionalFeaturesScore(listing);

  const total = cityScore + Math.min(budgetScore, 15) + Math.min(moveInScore, 10) + roomTypeScore + optionalFeaturesScore;
  if (total < 30) {
    return null;
  }

  const explanationParts: string[] = [];
  if (cityScore > 0) explanationParts.push("Good fit for your target city");
  if (budgetScore > 0) explanationParts.push(budgetScore >= 25 ? "Fits your budget" : "Close to your budget");
  if (roomTypeScore > 0) explanationParts.push(roomTypeScore >= 15 ? "Matches your preferred room type" : "Close to your room preference");
  if (moveInScore > 0) explanationParts.push("Available near your move-in date");
  if (optionalFeaturesScore > 0) explanationParts.push("Includes useful extras");

  return {
    ...listing,
    matchPercentage: Math.min(Math.max(total, 35), 100),
    explanation: buildExplanation(explanationParts),
  };
}

export async function fetchRecommendedListings(renter: RenterProfileRecord, limit = 5): Promise<RecommendedListingMatch[]> {
  const response = await fetch("/api/verification/notify-upload?purpose=listings");
  const payload = (await response.json()) as ListingsPayload;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? "Failed to load listings for recommendations.");
  }

  const candidates = payload.listings ?? [];

  const strictMatches = candidates
    .map((listing) => scoreListing(renter, listing))
    .filter((listing): listing is RecommendedListingMatch => Boolean(listing))
    .sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      return a.price - b.price;
    });

  if (strictMatches.length > 0) {
    return strictMatches.slice(0, limit);
  }

  const preferredCity = getPreferredListingCity(renter);
  const cityScopedCandidates = preferredCity
    ? candidates.filter((listing) => isSameCity(preferredCity, listing.city))
    : candidates;

  return cityScopedCandidates
    .map((listing) => buildFallbackRecommendation(renter, listing))
    .filter((listing): listing is RecommendedListingMatch => Boolean(listing))
    .sort((a, b) => {
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      return a.price - b.price;
    })
    .slice(0, limit);
}
