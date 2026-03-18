import { supabase } from "@/lib/supabaseClient";
import type { ChatConversation } from "@/types/chat";
import type {
  RoommateRequestStatus,
  RoommateRequestWithProfiles,
  RenterProfileRecord,
} from "@/types/profiles";

type CompactProfile = Pick<
  RenterProfileRecord,
  "id" | "username" | "email" | "city" | "university" | "gender" | "is_verified"
>;

export async function fetchPublishedRoommateProfiles(currentUserId: string): Promise<RenterProfileRecord[]> {
  const { data, error } = await supabase
    .from("renter_profiles")
    .select("*")
    .eq("is_published", true)
    .neq("id", currentUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RenterProfileRecord[];
}

export async function fetchRoommateRequests(currentUserId: string): Promise<RoommateRequestWithProfiles[]> {
  await supabase.rpc("expire_roommate_requests");

  const { data, error } = await supabase
    .from("roommate_requests")
    .select(`
      *,
      sender_profile:renter_profiles!roommate_requests_sender_id_fkey (id, username, email, city, university, gender, is_verified),
      receiver_profile:renter_profiles!roommate_requests_receiver_id_fkey (id, username, email, city, university, gender, is_verified)
    `)
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{
    id: string;
    sender_id: string;
    receiver_id: string;
    status: RoommateRequestStatus;
    created_at: string;
    updated_at: string;
    rejected_at: string | null;
    expires_at: string | null;
    sender_profile: CompactProfile | CompactProfile[] | null;
    receiver_profile: CompactProfile | CompactProfile[] | null;
  }>).map((row) => ({
    ...row,
    sender_profile: Array.isArray(row.sender_profile) ? row.sender_profile[0] ?? null : row.sender_profile,
    receiver_profile: Array.isArray(row.receiver_profile) ? row.receiver_profile[0] ?? null : row.receiver_profile,
  }));
}

export async function sendRoommateRequest(receiverId: string): Promise<void> {
  const { error } = await supabase.rpc("send_roommate_request", {
    p_receiver_id: receiverId,
  });

  if (error) {
    throw error;
  }
}

export async function updateRoommateRequestStatus(
  requestId: string,
  status: Extract<RoommateRequestStatus, "accepted" | "rejected">,
): Promise<void> {
  const { error } = await supabase.rpc("respond_roommate_request", {
    p_request_id: requestId,
    p_status: status,
  });

  if (error) {
    throw error;
  }
}

export async function createOrGetRoommateConversation(otherRenterId: string): Promise<ChatConversation> {
  const { data, error } = await supabase.rpc("create_or_get_roommate_conversation", {
    p_other_renter_id: otherRenterId,
  });

  if (error) {
    throw error;
  }

  return data as ChatConversation;
}
