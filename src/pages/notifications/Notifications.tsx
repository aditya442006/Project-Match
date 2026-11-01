import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, CheckCheck, Sparkles, MessageSquare, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '@/lib/format';
import { useNotificationStore } from '@/store/notificationStore';
import type { NotificationItem } from '@/types';

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const resetUnread = useNotificationStore((s) => s.resetUnreadCount);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      resetUnread();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.is_read) {
      markReadMutation.mutate(n.id);
    }
    // Deep links
    if (n.data?.team_id) {
      navigate(`/teams/${n.data.team_id}`);
    } else if (n.data?.project_id) {
      navigate(`/projects/${n.data.project_id}`);
    } else if (n.type?.includes('invite') || n.type?.includes('application')) {
      navigate('/requests');
    }
  };

  const notifications = data?.data || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay updated with invitations, team messages, task assignments, and reviews.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            isLoading={markAllMutation.isPending}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="All caught up!"
          description="You don't have any notifications at the moment."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 cursor-pointer transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
                !n.is_read
                  ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60'
                  : 'bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-xl ${
                  !n.is_read ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
