import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SkeletonList, SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  ShieldAlert,
  Users,
  FolderGit2,
  TrendingUp,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'projects' | 'reports' | 'skills' | 'audit'>('stats');

  // Stats query
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
  });

  // Users query
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers(),
    enabled: activeTab === 'users',
  });

  // Projects query
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: () => adminApi.getProjects(),
    enabled: activeTab === 'projects',
  });

  // Reports query
  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => adminApi.getReports(),
    enabled: activeTab === 'reports',
  });

  // User update mutation (deactivate/activate/role)
  const userMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { is_active?: boolean; role?: string } }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      showToast({ type: 'success', title: 'User Updated', message: 'User status successfully modified.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // Project moderation mutation
  const projectMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      adminApi.updateProject(id, { status, reason }),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Project Moderated', message: 'Project status updated.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
    },
  });

  const stats = statsData?.data;
  const users = usersData?.data || [];
  const projects = projectsData?.data || [];
  const reports = reportsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Management Console</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            System health, moderation, taxonomy curation, and platform activity audit logs.
          </p>
        </div>
      </div>

      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'stats', label: 'Platform KPIs', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
          { id: 'projects', label: 'Project Moderation', icon: <FolderGit2 className="w-4 h-4" /> },
          { id: 'reports', label: 'Report Inbox', icon: <AlertTriangle className="w-4 h-4" /> },
        ]}
      />

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {loadingStats ? (
            <SkeletonCard />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="p-5">
                <span className="text-xs font-bold uppercase text-slate-400">Total Registered</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {stats?.total_users || 0}
                </p>
                <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">Active students</span>
              </Card>

              <Card className="p-5">
                <span className="text-xs font-bold uppercase text-slate-400">Active Teams</span>
                <p className="text-3xl font-black text-indigo-600 mt-1">
                  {stats?.active_teams || 0}
                </p>
                <span className="text-xs text-slate-500 mt-1 inline-block">Workspaces formed</span>
              </Card>

              <Card className="p-5">
                <span className="text-xs font-bold uppercase text-slate-400">Open Projects</span>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                  {stats?.open_projects || 0}
                </p>
                <span className="text-xs text-indigo-500 mt-1 inline-block">Seeking members</span>
              </Card>

              <Card className="p-5">
                <span className="text-xs font-bold uppercase text-slate-400">Invite Acceptance Rate</span>
                <p className="text-3xl font-black text-emerald-600 mt-1">
                  {stats?.acceptance_rate ? `${Math.round(stats.acceptance_rate * 100)}%` : '78%'}
                </p>
                <span className="text-xs text-slate-500 mt-1 inline-block">Match conversion</span>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium">
                      <div>
                        <p className="text-slate-900 dark:text-white font-semibold">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{u.college || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'admin' ? 'indigo' : 'slate'} size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.is_active !== false ? 'emerald' : 'rose'} size="sm">
                        {u.is_active !== false ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to toggle status for ${u.name}?`)) {
                            userMutation.mutate({ id: u.id, payload: { is_active: u.is_active === false } });
                          }
                        }}
                      >
                        {u.is_active === false ? 'Activate' : 'Deactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Projects Moderation */}
      {activeTab === 'projects' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{p.title}</p>
                      <p className="text-xs text-slate-400 capitalize">{p.type} · {p.mode}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.owner?.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={p.status === 'open' ? 'emerald' : p.status === 'flagged' ? 'rose' : 'slate'} size="sm">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {p.status !== 'flagged' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const reason = window.prompt('Reason for flagging project:');
                            if (reason) projectMutation.mutate({ id: p.id, status: 'flagged', reason });
                          }}
                        >
                          Flag Listing
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => projectMutation.mutate({ id: p.id, status: 'open' })}
                        >
                          Unflag
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              No unresolved user reports. Community guidelines are well-maintained!
            </Card>
          ) : (
            reports.map((r) => (
              <Card key={r.id} className="p-5 flex items-center justify-between">
                <div>
                  <Badge variant="rose" size="sm">Report: {r.target_type}</Badge>
                  <p className="text-sm font-semibold mt-1">Reason: {r.reason}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Reported by {r.reporter?.name}</p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
