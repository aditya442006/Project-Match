import { apiClient } from './client';
import type { ApiResponse, Conversation, Message } from '@/types';

export const chatApi = {
  getConversations: async () => {
    const res = await apiClient.get<ApiResponse<Conversation[]>>('/conversations');
    return res.data;
  },

  createConversation: async (userId: string) => {
    const res = await apiClient.post<ApiResponse<Conversation>>('/conversations', { user_id: userId });
    return res.data;
  },

  getConversationById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Conversation>>(`/conversations/${id}`);
    return res.data;
  },

  getMessages: async (conversationId: string, params?: { before?: string; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<Message[]>>(`/conversations/${conversationId}/messages`, {
      params: { limit: 30, ...params },
    });
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    payload: { text: string; attachments?: { url: string; type: string }[] }
  ) => {
    const res = await apiClient.post<ApiResponse<Message>>(`/conversations/${conversationId}/messages`, payload);
    return res.data;
  },

  markAsRead: async (conversationId: string) => {
    const res = await apiClient.patch<ApiResponse<{ success: boolean }>>(`/conversations/${conversationId}/read`);
    return res.data;
  },

  updateMessage: async (messageId: string, text: string) => {
    const res = await apiClient.patch<ApiResponse<Message>>(`/messages/${messageId}`, { text });
    return res.data;
  },

  deleteMessage: async (messageId: string) => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/messages/${messageId}`);
    return res.data;
  },
};
