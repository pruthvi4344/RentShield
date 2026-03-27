export type ListingStatus = "pending" | "active" | "rented" | "inactive";
export type ListingMediaType = "image" | "video" | "panorama";

export type LandlordListingRecord = {
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
  postal_code: string | null;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  furnished_status: "furnished" | "unfurnished" | "partially";
  monthly_rent: number;
  security_deposit: number | null;
  utilities_included: boolean;
  internet_included: boolean;
  parking_included: boolean;
  amenities: string[];
  discount_percentage: number | null;
  discount_duration_months: number | null;
  limited_time_offer_title: string | null;
  limited_time_offer_description: string | null;
  limited_time_offer_expires_at: string | null;
  featured_listing: boolean;
  matterport_url: string | null;
  matterport_embed: string | null;
  tour_360_storage_path: string | null;
  available_from: string | null;
  lease_duration_months: number | null;
  status: ListingStatus;
  views_count: number;
  inquiries_count: number;
  created_at: string;
  updated_at: string;
};

export type ListingPhotoRecord = {
  id: string;
  listing_id: string;
  landlord_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
};

export type ListingMediaRecord = {
  id: string;
  listing_id: string;
  landlord_id: string;
  storage_path: string;
  media_type: ListingMediaType;
  sort_order: number;
  created_at: string;
};

export type CreateLandlordListingInput = {
  title: string;
  property_type: string;
  street_address: string;
  formatted_address?: string | null;
  place_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city: string;
  postal_code?: string | null;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number | null;
  furnished_status: "furnished" | "unfurnished" | "partially";
  monthly_rent: number;
  security_deposit?: number | null;
  utilities_included: boolean;
  internet_included: boolean;
  parking_included: boolean;
  amenities: string[];
  discount_percentage?: number | null;
  discount_duration_months?: number | null;
  limited_time_offer_title?: string | null;
  limited_time_offer_description?: string | null;
  limited_time_offer_expires_at?: string | null;
  featured_listing: boolean;
  matterport_url?: string | null;
  matterport_embed?: string | null;
  tour_360_storage_path?: string | null;
  available_from?: string | null;
  lease_duration_months?: number | null;
  status?: ListingStatus;
};

export type LandlordListingWithCover = LandlordListingRecord & {
  cover_photo_url: string | null;
  photo_count: number;
  video_count: number;
  media_count: number;
  tour_360_url: string | null;
  special_offer_badge: string | null;
};
