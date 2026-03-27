import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserRole } from "@/lib/roleRouting";
import type { AuthIdentity, LandlordProfileRecord, RenterProfileRecord, UserRole } from "@/types/profiles";

function roleFromUnknown(value: unknown): UserRole {
  return value === "landlord" ? "landlord" : "renter";
}

function usernameFromEmail(email: string): string {
  return email.split("@")[0] || "User";
}

function landlordShouldBeVerified(profile: Pick<LandlordProfileRecord, "identity_verification_status" | "property_ownership_status" | "phone_verification_status">): boolean {
  return (
    profile.identity_verification_status === "verified" &&
    profile.property_ownership_status === "verified" &&
    profile.phone_verification_status === "verified"
  );
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
    const profile = data as LandlordProfileRecord;
    const computedVerified = landlordShouldBeVerified(profile);

    if (profile.is_verified !== computedVerified) {
      const { data: synced, error: syncError } = await supabase
        .from("landlord_profiles")
        .update({ is_verified: computedVerified })
        .eq("id", auth.id)
        .select("*")
        .single();

      if (!syncError && synced) {
        return synced as LandlordProfileRecord;
      }
    }

    return profile;
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

export async function resolvePostLoginRoute(nextPath?: string | null): Promise<string> {
  const auth = await getAuthIdentity();
  if (!auth) {
    return "/login";
  }

  if (auth.role === "renter") {
    const renterProfile = await getOrCreateRenterProfile(auth);
    if (!renterProfile.is_verified) {
      return "/renter?tab=verification";
    }
  }

  return nextPath || (auth.role === "landlord" ? "/landlord" : "/renter");
}
