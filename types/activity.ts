export type UserActivityType =
  | "listing_saved"
  | "message_received"
  | "verification_approved"
  | "roommate_request_received"
  | "roommate_request_accepted"
  | "roommate_request_rejected"
  | "roommate_request_expired";

export type UserActivityRecord = {
  id: string;
  user_id: string;
  type: UserActivityType;
  title: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
