import { apiClient } from './client';
import type { ApiResponse, Team } from '@/types';

export const teamsApi = {
  getMyTeams: async () => {
    const res = await apiClient.get<ApiResponse<Team[]>>('/teams/my');
    return res.data;
  },

  getTeamById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Team>>(`/teams/${id}`);
    return res.data;
  },

  updateTeam: async (id: string, payload: { name?: string; status?: string }) => {
    const res = await apiClient.patch<ApiResponse<Team>>(`/teams/${id}`, payload);
    return res.data;
  },

  transferLeader: async (id: string, new_leader_id: string) => {
    const res = await apiClient.patch<ApiResponse<Team>>(`/teams/${id}/leader`, { new_leader_id });
    return res.data;
  },

  removeMember: async (id: string, userId: string) => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/teams/${id}/members/${userId}`);
    return res.data;
  },

  leaveTeam: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/teams/${id}/leave`);
    return res.data;
  },
};
