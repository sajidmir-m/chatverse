import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { CreateMessageInput, Message } from '../types';

export const messageService = {
  async getConversationMessages(username: string, recipient: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(username.eq.${username},recipient_username.eq.${recipient}),and(username.eq.${recipient},recipient_username.eq.${username})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      throw new AppError(`Failed to fetch messages: ${error.message}`, 500);
    }

    return (data ?? []) as Message[];
  },

  async createMessage(input: CreateMessageInput): Promise<Message> {
    const now = new Date().toISOString();
    const messageType = input.messageType || 'text';

    const { data, error } = await supabase
      .from('messages')
      .insert({
        username: input.username,
        recipient_username: input.recipient,
        message: input.message,
        message_type: messageType,
        media_url: input.mediaUrl ?? null,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(`Failed to save message: ${error.message}`, 500);
    }

    return data as Message;
  },
};
