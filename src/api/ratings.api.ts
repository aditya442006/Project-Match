import { apiClient } from './client';
import type { ApiResponse, Rating, TeammateRatingStatus } from '@/types';

export const ratingsApi = {
  createRating: async (payload: {
    project_id: string;
    ratee_id: string;
    teamwork: number;
    communication: number;
    skill: number;
    reliability: number;
    comment?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Rating>>('/ratings', payload);
    return res.data;
  },

  getUserRatings: async (userId: string) => {
    const res = await apiClient.get<ApiResponse<Rating[]>>(`/ratings/users/${userId}`);
    return res.data;
  },

  getProjectRatings: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<Rating[]>>(`/ratings/projects/${projectId}`);
    return res.data;
  },

  getProjectRatingStatus: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<TeammateRatingStatus[]>>(`/ratings/projects/${projectId}/status`);
    return res.data;
  },
};
