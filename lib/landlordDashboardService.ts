import { fetchRecentActivities } from "@/lib/activityService";
import { getLandlordListings } from "@/lib/landlordListingService";
import type { UserActivityRecord } from "@/types/activity";
import type { LandlordListingWithCover } from "@/types/listing";

export type LandlordDashboardStat = {
  totalListings: number;
  activeListings: number;
  rentedListings: number;
  totalViews: number;
  totalInquiries: number;
  unreadMessages: number;
};

export type LandlordListingPerformanceItem = Pick<
  LandlordListingWithCover,
  "id" | "title" | "monthly_rent" | "views_count" | "inquiries_count" | "status" | "cover_photo_url"
>;

export type LandlordPricingInsight = {
  city: string;
  minRent: number;
  maxRent: number;
  listingCount: number;
} | null;

export type LandlordDashboardData = {
  stats: LandlordDashboardStat;
  activities: UserActivityRecord[];
  topListings: LandlordListingPerformanceItem[];
  pricingInsight: LandlordPricingInsight;
};

function buildPricingInsight(listings: LandlordListingWithCover[]): LandlordPricingInsight {
  if (listings.length === 0) {
    return null;
  }

  const byCity = new Map<string, LandlordListingWithCover[]>();
  for (const listing of listings) {
    const cityKey = listing.city?.trim() || "Your area";
    const current = byCity.get(cityKey) ?? [];
    current.push(listing);
    byCity.set(cityKey, current);
  }

  const [city, cityListings] =
    [...byCity.entries()].sort((a, b) => {
      if (b[1].length !== a[1].length) {
        return b[1].length - a[1].length;
      }
      const aViews = a[1].reduce((sum, item) => sum + item.views_count, 0);
      const bViews = b[1].reduce((sum, item) => sum + item.views_count, 0);
      return bViews - aViews;
    })[0] ?? [];

  if (!city || !cityListings?.length) {
    return null;
  }

  const rents = cityListings
    .map((listing) => Number(listing.monthly_rent))
    .filter((rent) => Number.isFinite(rent) && rent > 0)
    .sort((a, b) => a - b);

  if (rents.length === 0) {
    return null;
  }

  return {
    city,
    minRent: rents[0],
    maxRent: rents[rents.length - 1],
    listingCount: cityListings.length,
  };
}

export async function fetchLandlordDashboardData(
  landlordId: string,
  unreadMessages: number,
): Promise<LandlordDashboardData> {
  const [listings, activities] = await Promise.all([
    getLandlordListings(landlordId),
    fetchRecentActivities(landlordId, 5).catch(() => [] as UserActivityRecord[]),
  ]);

  const stats: LandlordDashboardStat = {
    totalListings: listings.length,
    activeListings: listings.filter((listing) => listing.status === "active").length,
    rentedListings: listings.filter((listing) => listing.status === "rented").length,
    totalViews: listings.reduce((sum, listing) => sum + Number(listing.views_count || 0), 0),
    totalInquiries: listings.reduce((sum, listing) => sum + Number(listing.inquiries_count || 0), 0),
    unreadMessages,
  };

  const topListings = [...listings]
    .sort((a, b) => {
      if (b.inquiries_count !== a.inquiries_count) {
        return b.inquiries_count - a.inquiries_count;
      }
      return b.views_count - a.views_count;
    })
    .slice(0, 3)
    .map((listing) => ({
      id: listing.id,
      title: listing.title,
      monthly_rent: listing.monthly_rent,
      views_count: listing.views_count,
      inquiries_count: listing.inquiries_count,
      status: listing.status,
      cover_photo_url: listing.cover_photo_url,
    }));

  return {
    stats,
    activities,
    topListings,
    pricingInsight: buildPricingInsight(listings),
  };
}
