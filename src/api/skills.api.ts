import { apiClient } from './client';
import type { ApiResponse, Skill } from '@/types';

export const skillsApi = {
  getSkills: async (params?: { q?: string; category?: string; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<Skill[]>>('/skills', { params });
    return res.data;
  },

  getCategories: async () => {
    const res = await apiClient.get<ApiResponse<string[]>>('/skills/categories');
    return res.data;
  },

  getSkillById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Skill>>(`/skills/${id}`);
    return res.data;
  },
};
