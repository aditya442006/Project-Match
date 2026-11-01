import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from './socket';
import { useNotificationStore } from '@/store/notificationStore';
import type { ApiResponse, Message, NotificationItem, RequestItem, TaskItem } from '@/types';

export const useSocketEvents = () => {
  const queryClient = useQueryClient();
  const incrementUnread = useNotificationStore((s) => s.incrementUnreadCount);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Chat message received
    const handleMessage = (msg: Message) => {
      queryClient.setQueryData<ApiResponse<Message[]>>(
        ['messages', msg.conversation_id],
        (old) => {
          if (!old) {
            return { success: true, data: [msg] };
          }
          // Dedupe by id
          const exists = old.data.some((m) => m.id === msg.id);
          if (exists) {
            return {
              ...old,
              data: old.data.map((m) => (m.id === msg.id ? msg : m)),
            };
          }
          return {
            ...old,
            data: [...old.data, msg],
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    const handleMessageUpdated = (msg: Message) => {
      queryClient.setQueryData<ApiResponse<Message[]>>(
        ['messages', msg.conversation_id],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((m) => (m.id === msg.id ? msg : m)),
          };
        }
      );
    };

    const handleMessageDeleted = ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      queryClient.setQueryData<ApiResponse<Message[]>>(
        ['messages', conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((m) => m.id !== messageId),
          };
        }
      );
    };

    // Notification received
    const handleNotification = (notif: NotificationItem) => {
      incrementUnread();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    };

    // Requests
    const handleNewRequest = (req: RequestItem) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'counts'] });
    };

    const handleRequestUpdated = (req: RequestItem) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'my'] });
      if (req.team_id) {
        queryClient.invalidateQueries({ queryKey: ['team', req.team_id] });
      }
    };

    // Task events
    const handleTaskUpdated = (task: TaskItem) => {
      if (task.team_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', task.team_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
    };

    // Team membership changes
    const handleTeamMemberChanged = (data: { teamId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['team', data.teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'my'] });
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:message_updated', handleMessageUpdated);
    socket.on('chat:message_deleted', handleMessageDeleted);
    socket.on('notification:new', handleNotification);
    socket.on('request:new', handleNewRequest);
    socket.on('request:updated', handleRequestUpdated);
    socket.on('task:created', handleTaskUpdated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskUpdated);
    socket.on('task:deleted', handleTaskUpdated);
    socket.on('team:member_joined', handleTeamMemberChanged);
    socket.on('team:member_left', handleTeamMemberChanged);
    socket.on('team:removed', handleTeamMemberChanged);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:message_updated', handleMessageUpdated);
      socket.off('chat:message_deleted', handleMessageDeleted);
      socket.off('notification:new', handleNotification);
      socket.off('request:new', handleNewRequest);
      socket.off('request:updated', handleRequestUpdated);
      socket.off('task:created', handleTaskUpdated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskUpdated);
      socket.off('task:deleted', handleTaskUpdated);
      socket.off('team:member_joined', handleTeamMemberChanged);
      socket.off('team:member_left', handleTeamMemberChanged);
      socket.off('team:removed', handleTeamMemberChanged);
    };
  }, [queryClient, incrementUnread]);
};
