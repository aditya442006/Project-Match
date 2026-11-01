import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '@/api/requests.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { SendHorizontal, Inbox, Check, X, Ban, Clock } from 'lucide-react';
import { timeAgo } from '@/lib/format';
import type { RequestItem } from '@/types';

export const Requests: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'incoming' | 'applications' | 'outgoing'>('incoming');

  const { data, isLoading } = useQuery({
    queryKey: ['requests', 'all'],
    queryFn: () => requestsApi.getRequests({ box: 'all' }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' | 'cancel' }) =>
      requestsApi.updateRequest(id, action),
    onSuccess: (_, vars) => {
      showToast({
        type: 'success',
        title: 'Updated',
        message: `Request ${vars.action}ed successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'my'] });
    },
    onError: (err: { code?: string; message?: string }) => {
      if (err.code === 'ROLE_FULL') {
        showToast({
          type: 'error',
          title: 'Role is Full',
          message: 'All slots for this role have already been filled.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: err.message || 'Could not update request.',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  const allRequests = data?.data || [];

  // Filter based on active tab
  const filtered = allRequests.filter((r) => {
    if (activeTab === 'incoming') return r.type === 'invite';
    if (activeTab === 'applications') return r.type === 'application';
    return r.status !== 'expired'; // outgoing or all
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Requests & Invitations</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review incoming invites to join teams, student applications for your projects, and your sent requests.
        </p>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'incoming', label: 'Invites Received', icon: <Inbox className="w-4 h-4" /> },
          { id: 'applications', label: 'Applications Received', icon: <SendHorizontal className="w-4 h-4" /> },
          { id: 'outgoing', label: 'Sent Requests', icon: <Clock className="w-4 h-4" /> },
        ]}
      />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title="No requests in this category"
          description="When you send or receive team invites and applications, they will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Card key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <Avatar src={req.from_user?.avatar_url} name={req.from_user?.name} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {req.from_user?.name}
                    </span>
                    <Badge variant={req.status === 'pending' ? 'amber' : req.status === 'accepted' ? 'emerald' : 'slate'} size="sm">
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {req.project?.title ? `${req.project.title}` : 'Project'} {req.role ? `· ${req.role}` : ''}
                  </p>
                  {req.message && <p className="text-xs text-slate-400 mt-1 italic">"{req.message}"</p>}
                  <span className="text-[10px] text-slate-400 mt-1 block">{timeAgo(req.created_at)}</span>
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {activeTab !== 'outgoing' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mutation.mutate({ id: req.id, action: 'decline' })}
                        isLoading={mutation.isPending}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => mutation.mutate({ id: req.id, action: 'accept' })}
                        isLoading={mutation.isPending}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Accept
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => mutation.mutate({ id: req.id, action: 'cancel' })}
                      isLoading={mutation.isPending}
                      leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
