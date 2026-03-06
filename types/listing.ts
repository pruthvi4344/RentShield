export type ListingStatus = "pending" | "active" | "rented" | "inactive";

export type LandlordListingRecord = {
  id: string;
  landlord_id: string;
  title: string;
  property_type: string;
  street_address: string;
  city: string;
  postal_code: string | null;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  furnished_status: "furnished" | "unfurnished" | "partially";
  monthly_rent: number;
  security_deposit: number | null;
  utilities_included: boolean;
  amenities: string[];
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

export type CreateLandlordListingInput = {
  title: string;
  property_type: string;
  street_address: string;
  city: string;
  postal_code?: string | null;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number | null;
  furnished_status: "furnished" | "unfurnished" | "partially";
  monthly_rent: number;
  security_deposit?: number | null;
  utilities_included: boolean;
  amenities: string[];
  available_from?: string | null;
  lease_duration_months?: number | null;
  status?: ListingStatus;
};

export type LandlordListingWithCover = LandlordListingRecord & {
  cover_photo_url: string | null;
  photo_count: number;
};
