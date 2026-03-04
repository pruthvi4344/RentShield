import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserRole } from "@/lib/roleRouting";
import type { AuthIdentity, LandlordProfileRecord, RenterProfileRecord, UserRole } from "@/types/profiles";

function roleFromUnknown(value: unknown): UserRole {
  return value === "landlord" ? "landlord" : "renter";
}

function usernameFromEmail(email: string): string {
  return email.split("@")[0] || "User";
}

export async function getAuthIdentity(): Promise<AuthIdentity | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  const usernameMeta = typeof user.user_metadata?.username === "string" ? user.user_metadata.username : null;
  const roleMeta = roleFromUnknown(user.user_metadata?.role);
  const roleFromProfiles = await getCurrentUserRole();

  return {
    id: user.id,
    email: user.email,
    username: usernameMeta || usernameFromEmail(user.email),
    role: roleFromProfiles ?? roleMeta,
  };
}

export async function getOrCreateRenterProfile(auth: AuthIdentity): Promise<RenterProfileRecord> {
  const { data } = await supabase
    .from("renter_profiles")
    .select("*")
    .eq("id", auth.id)
    .maybeSingle();

  if (data) {
    return data as RenterProfileRecord;
  }

  const { data: inserted, error } = await supabase
    .from("renter_profiles")
    .upsert(
      {
        id: auth.id,
        email: auth.email,
        username: auth.username,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Failed to create renter profile");
  }

  return inserted as RenterProfileRecord;
}

export async function getOrCreateLandlordProfile(auth: AuthIdentity): Promise<LandlordProfileRecord> {
  const { data } = await supabase
    .from("landlord_profiles")
    .select("*")
    .eq("id", auth.id)
    .maybeSingle();

  if (data) {
    return data as LandlordProfileRecord;
  }

  const { data: inserted, error } = await supabase
    .from("landlord_profiles")
    .upsert(
      {
        id: auth.id,
        email: auth.email,
        username: auth.username,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Failed to create landlord profile");
  }

  return inserted as LandlordProfileRecord;
}

export async function saveRenterProfile(
  id: string,
  updates: Partial<Omit<RenterProfileRecord, "id" | "created_at" | "updated_at">>,
): Promise<RenterProfileRecord> {
  const { data, error } = await supabase
    .from("renter_profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save renter profile");
  }

  return data as RenterProfileRecord;
}

export async function saveLandlordProfile(
  id: string,
  updates: Partial<Omit<LandlordProfileRecord, "id" | "created_at" | "updated_at">>,
): Promise<LandlordProfileRecord> {
  const { data, error } = await supabase
    .from("landlord_profiles")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save landlord profile");
  }

  return data as LandlordProfileRecord;
}
