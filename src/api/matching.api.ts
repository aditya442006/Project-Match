import { apiClient } from './client';
import type { ApiResponse, MatchItem, Project } from '@/types';

export const matchingApi = {
  getRecommendedTeammates: async (limit: number = 10) => {
    const res = await apiClient.get<ApiResponse<MatchItem[]>>('/matching/teammates', {
      params: { limit },
    });
    return res.data;
  },

  getProjectCandidates: async (projectId: string, limit: number = 10) => {
    const res = await apiClient.get<ApiResponse<MatchItem[]>>(`/matching/projects/${projectId}/candidates`, {
      params: { limit },
    });
    return res.data;
  },

  getRecommendedProjects: async (limit: number = 10) => {
    const res = await apiClient.get<ApiResponse<Project[]>>('/matching/projects', {
      params: { limit },
    });
    return res.data;
  },

  sendFeedback: async (payload: {
    candidate_id: string;
    project_id?: string;
    action: 'viewed' | 'invited' | 'dismissed';
    score?: number;
    features?: Record<string, number>;
  }) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>('/matching/feedback', payload);
    return res.data;
  },
};
