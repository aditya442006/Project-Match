import { apiClient } from './client';
import type { ApiResponse, Project, ProjectRoleSlot, Skill } from '@/types';

export interface ProjectQueryParams {
  q?: string;
  type?: string;
  status?: string;
  mode?: string;
  skill?: string;
  tags?: string;
  owner?: string;
  deadline_before?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  type: string;
  tags: string[];
  mode: string;
  start_date?: string;
  deadline?: string;
  team_size_min: number;
  team_size_max: number;
  roles: ProjectRoleSlot[];
  required_skills: (Skill | string)[];
}

export const projectsApi = {
  getProjects: async (params?: ProjectQueryParams) => {
    const res = await apiClient.get<ApiResponse<Project[]>>('/projects', { params });
    return res.data;
  },

  getMyProjects: async () => {
    const res = await apiClient.get<ApiResponse<Project[]>>('/projects/mine');
    return res.data;
  },

  getProjectById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return res.data;
  },

  createProject: async (payload: CreateProjectPayload) => {
    const res = await apiClient.post<ApiResponse<Project>>('/projects', payload);
    return res.data;
  },

  updateProject: async (id: string, payload: Partial<CreateProjectPayload>) => {
    const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, payload);
    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}/status`, { status });
    return res.data;
  },

  deleteProject: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/projects/${id}`);
    return res.data;
  },

  applyForRole: async (id: string, payload: { role?: string; message?: string }) => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(`/projects/${id}/apply`, payload);
    return res.data;
  },
};
