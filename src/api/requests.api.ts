import { apiClient } from './client';
import type { ApiResponse, RequestItem } from '@/types';

export interface RequestQueryParams {
  box?: 'incoming' | 'outgoing' | 'all';
  status?: string;
  type?: string;
  project_id?: string;
}

export const requestsApi = {
  createRequest: async (payload: {
    project_id: string;
    to_user: string;
    role?: string;
    message?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<RequestItem>>('/requests', payload);
    return res.data;
  },

  getRequests: async (params?: RequestQueryParams) => {
    const res = await apiClient.get<ApiResponse<RequestItem[]>>('/requests', { params });
    return res.data;
  },

  getCounts: async () => {
    const res = await apiClient.get<ApiResponse<{ incoming: number; outgoing: number }>>('/requests/counts');
    return res.data;
  },

  getRequestById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<RequestItem>>(`/requests/${id}`);
    return res.data;
  },

  updateRequest: async (id: string, action: 'accept' | 'decline' | 'cancel') => {
    const res = await apiClient.patch<ApiResponse<RequestItem>>(`/requests/${id}`, { action });
    return res.data;
  },
};
