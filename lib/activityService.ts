import { supabase } from "@/lib/supabaseClient";
import type { UserActivityRecord } from "@/types/activity";

export async function fetchRecentActivities(userId: string, limit = 5): Promise<UserActivityRecord[]> {
  const { data, error } = await supabase
    .from("user_activities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as UserActivityRecord[];
}
