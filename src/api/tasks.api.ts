import { apiClient } from './client';
import type { ApiResponse, TaskComment, TaskItem } from '@/types';

export const tasksApi = {
  getTasksByTeam: async (teamId: string, params?: { status?: string; assignee?: string }) => {
    const res = await apiClient.get<ApiResponse<TaskItem[]>>(`/teams/${teamId}/tasks`, { params });
    return res.data;
  },

  createTask: async (
    teamId: string,
    payload: {
      title: string;
      description?: string;
      assignee_id?: string;
      status?: string;
      priority?: string;
      due_date?: string;
      labels?: string[];
    }
  ) => {
    const res = await apiClient.post<ApiResponse<TaskItem>>(`/teams/${teamId}/tasks`, payload);
    return res.data;
  },

  reorderTasks: async (teamId: string, items: Array<{ id: string; status: string; position: number }>) => {
    const res = await apiClient.patch<ApiResponse<{ success: boolean }>>(`/teams/${teamId}/tasks/reorder`, {
      items,
    });
    return res.data;
  },

  getTaskById: async (taskId: string) => {
    const res = await apiClient.get<ApiResponse<TaskItem & { comments: TaskComment[] }>>(`/tasks/${taskId}`);
    return res.data;
  },

  updateTask: async (taskId: string, payload: Partial<TaskItem>) => {
    const res = await apiClient.patch<ApiResponse<TaskItem>>(`/tasks/${taskId}`, payload);
    return res.data;
  },

  deleteTask: async (taskId: string) => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/tasks/${taskId}`);
    return res.data;
  },

  addComment: async (taskId: string, text: string) => {
    const res = await apiClient.post<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments`, { text });
    return res.data;
  },
};
