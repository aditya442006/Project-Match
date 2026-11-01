import { apiClient } from './client';
import type { ApiResponse, Profile, Rating } from '@/types';

export interface UserQueryParams {
  q?: string;
  skill?: string;
  college?: string;
  branch?: string;
  year?: number | string;
  looking_for?: string;
  page?: number;
  limit?: number;
}

export const usersApi = {
  getMe: async () => {
    const res = await apiClient.get<ApiResponse<Profile>>('/users/me');
    return res.data;
  },

  updateMe: async (payload: Partial<Profile>) => {
    const res = await apiClient.patch<ApiResponse<Profile>>('/users/me', payload);
    return res.data;
  },

  updateAvatar: async (avatar_url: string) => {
    const res = await apiClient.patch<ApiResponse<{ avatar_url: string }>>('/users/me/avatar', { avatar_url });
    return res.data;
  },

  deleteMe: async () => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>('/users/me');
    return res.data;
  },

  getUserById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Profile & { ratings_recent?: Rating[] }>>(`/users/${id}`);
    return res.data;
  },

  getUsers: async (params?: UserQueryParams) => {
    const res = await apiClient.get<ApiResponse<Profile[]>>('/users', { params });
    return res.data;
  },
};
