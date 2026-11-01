import { apiClient } from './client';
import type { ApiResponse, NotificationItem } from '@/types';

export const notificationsApi = {
  getNotifications: async (params?: { unread?: boolean; type?: string }) => {
    const res = await apiClient.get<ApiResponse<NotificationItem[]>>('/notifications', { params });
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.patch<ApiResponse<{ count: number }>>('/notifications/read-all');
    return res.data;
  },
};
