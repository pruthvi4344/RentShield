import { supabase } from "@/lib/supabaseClient";
import type { ChatConversation, ChatMessage } from "@/types/chat";

export async function createOrGetConversation(landlordId: string, listingId?: string | null): Promise<ChatConversation> {
  const { data, error } = await supabase.rpc("create_or_get_conversation", {
    p_landlord_id: landlordId,
    p_listing_id: listingId ?? null,
  });

  if (error) {
    throw error;
  }

  return data as ChatConversation;
}

export async function fetchMyConversations(userId: string): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`renter_id.eq.${userId},landlord_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatConversation[];
}

export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatMessage[];
}

export async function sendConversationMessage(conversationId: string, senderId: string, body: string): Promise<void> {
  const message = body.trim();
  if (!message) {
    return;
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body: message,
  });

  if (error) {
    throw error;
  }
}

export async function fetchUnreadCountsByConversation(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("get_unread_counts");
  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{ conversation_id: string; unread_count: number | string }>;
  const unreadMap: Record<string, number> = {};
  for (const row of rows) {
    unreadMap[row.conversation_id] = Number(row.unread_count) || 0;
  }
  return unreadMap;
}

export async function markConversationAsRead(conversationId: string): Promise<number> {
  const { data, error } = await supabase.rpc("mark_conversation_as_read", {
    p_conversation_id: conversationId,
  });

  if (error) {
    throw error;
  }

  return Number(data ?? 0);
}
