export type UserRole = "renter" | "landlord";

export type AuthIdentity = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
};

export type RenterProfileRecord = {
  id: string;
  email: string;
  username: string;
  is_verified: boolean;
  is_roommate_profile_public: boolean;
  is_published: boolean;
  university: string | null;
  city: string | null;
  move_in_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  lifestyle: string[] | null;
  bio: string | null;
  room_preference: string | null;
  roommate_preferred_gender: string | null;
  gender: string | null;
  country: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type RoommateRequestStatus = "pending" | "accepted" | "rejected";

export type RoommateRequestRecord = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: RoommateRequestStatus;
  created_at: string;
  updated_at: string;
};

export type RoommateRequestWithProfiles = RoommateRequestRecord & {
  sender_profile: Pick<RenterProfileRecord, "id" | "username" | "email" | "city" | "university" | "gender" | "is_verified"> | null;
  receiver_profile: Pick<RenterProfileRecord, "id" | "username" | "email" | "city" | "university" | "gender" | "is_verified"> | null;
};

export type LandlordProfileRecord = {
  id: string;
  email: string;
  username: string;
  is_verified: boolean;
  identity_verification_status: "not_submitted" | "pending" | "verified";
  property_ownership_status: "not_submitted" | "pending" | "verified";
  phone_verification_status: "not_submitted" | "pending" | "verified";
  identity_document_name: string | null;
  property_document_name: string | null;
  phone_number_for_verification: string | null;
  phone: string | null;
  city: string | null;
  bio: string | null;
  business_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LandlordVerificationRequest = {
  id: string;
  landlord_id: string;
  request_type: "identity" | "property";
  document_name: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
};
