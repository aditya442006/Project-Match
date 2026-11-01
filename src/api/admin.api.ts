import { apiClient } from './client';
import type { AdminAuditLog, AdminReport, AdminStats, ApiResponse, Profile, Project, Skill } from '@/types';

export const adminApi = {
  getStats: async () => {
    const res = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
    return res.data;
  },

  getUsers: async (params?: { q?: string; role?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<Profile[]>>('/admin/users', { params });
    return res.data;
  },

  updateUser: async (id: string, payload: { is_active?: boolean; role?: string }) => {
    const res = await apiClient.patch<ApiResponse<Profile>>(`/admin/users/${id}`, payload);
    return res.data;
  },

  getProjects: async (params?: { q?: string; status?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<Project[]>>('/admin/projects', { params });
    return res.data;
  },

  updateProject: async (id: string, payload: { status?: string; reason?: string }) => {
    const res = await apiClient.patch<ApiResponse<Project>>(`/admin/projects/${id}`, payload);
    return res.data;
  },

  getReports: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<AdminReport[]>>('/admin/reports', { params });
    return res.data;
  },

  updateReport: async (id: string, payload: { status: 'resolved' | 'dismissed'; resolution_notes?: string }) => {
    const res = await apiClient.patch<ApiResponse<AdminReport>>(`/admin/reports/${id}`, payload);
    return res.data;
  },

  createSkill: async (payload: { name: string; category: string; aliases?: string[] }) => {
    const res = await apiClient.post<ApiResponse<Skill>>('/admin/skills', payload);
    return res.data;
  },

  updateSkill: async (id: string, payload: Partial<Skill>) => {
    const res = await apiClient.patch<ApiResponse<Skill>>(`/admin/skills/${id}`, payload);
    return res.data;
  },

  deleteSkill: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/admin/skills/${id}`);
    return res.data;
  },

  getAuditLog: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<AdminAuditLog[]>>('/admin/audit-log', { params });
    return res.data;
  },
};
