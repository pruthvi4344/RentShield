import { supabase } from "@/lib/supabaseClient";

export type UserRole = "renter" | "landlord";

export function roleToRoute(role: UserRole): string {
  return role === "landlord" ? "/landlord" : "/renter";
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileError && (profileData?.role === "renter" || profileData?.role === "landlord")) {
    return profileData.role;
  }

  if (user.user_metadata?.role === "renter" || user.user_metadata?.role === "landlord") {
    return user.user_metadata.role as UserRole;
  }

  return null;
}
