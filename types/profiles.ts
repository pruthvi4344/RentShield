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
  university: string | null;
  city: string | null;
  move_in_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  lifestyle: string[] | null;
  bio: string | null;
  room_preference: string | null;
  gender: string | null;
  country: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LandlordProfileRecord = {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  city: string | null;
  bio: string | null;
  business_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};
