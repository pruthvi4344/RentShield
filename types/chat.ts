export type ChatConversation = {
  id: string;
  renter_id: string;
  landlord_id: string;
  listing_id: string | null;
  renter_username: string;
  landlord_username: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
