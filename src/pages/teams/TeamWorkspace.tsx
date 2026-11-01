import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/api/teams.api';
import { projectsApi } from '@/api/projects.api';
import { chatApi } from '@/api/chat.api';
import { tasksApi } from '@/api/tasks.api';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  LayoutDashboard,
  MessageSquare,
  Kanban,
  Users,
  ArrowLeft,
  CheckCircle,
  Send,
  Plus,
  Crown,
  Calendar,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { formatDate } from '@/lib/format';
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants';

export const TeamWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'tasks' | 'members'>('overview');

  // Chat message state
  const [chatInput, setChatInput] = useState('');

  // Task creation state
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskPriority, setTaskPriority] = useState('medium');

  // Team Query
  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['team', id],
    queryFn: () => (id ? teamsApi.getTeamById(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
  });

  // Tasks Query
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => (id ? tasksApi.getTasksByTeam(id) : Promise.reject('No ID')),
    enabled: Boolean(id && activeTab === 'tasks'),
  });

  // Chat Messages Query
  const { data: messagesData } = useQuery({
    queryKey: ['messages', teamData?.data?.conversation_id],
    queryFn: () =>
      teamData?.data?.conversation_id
        ? chatApi.getMessages(teamData.data.conversation_id)
        : Promise.resolve({ success: true, data: [] }),
    enabled: Boolean(teamData?.data?.conversation_id && activeTab === 'chat'),
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) => {
      const convId = teamData?.data?.conversation_id;
      if (!convId) throw new Error('No conversation found');
      return chatApi.sendMessage(convId, { text });
    },
    onSuccess: () => {
      setChatInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', teamData?.data?.conversation_id] });
    },
  });

  // Task create mutation
  const createTaskMutation = useMutation({
    mutationFn: () =>
      id
        ? tasksApi.createTask(id, {
            title: taskTitle,
            description: taskDesc,
            assignee_id: taskAssignee || undefined,
            status: taskStatus,
            priority: taskPriority,
          })
        : Promise.reject('No ID'),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Task Created', message: 'Task added to board.' });
      setCreateTaskOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
    },
  });

  // Complete project mutation
  const completeProjectMutation = useMutation({
    mutationFn: () =>
      teamData?.data?.project_id
        ? projectsApi.updateStatus(teamData.data.project_id, 'completed')
        : Promise.reject('No project ID'),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Project Completed!',
        message: 'Project marked as complete. Peer rating window is now open.',
      });
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    },
  });

  const team = teamData?.data;

  if (loadingTeam) return <SkeletonCard />;
  if (!team) return <Card className="p-8 text-center text-slate-500">Team workspace not found.</Card>;

  const isLeader = team.leader_id === user?.id || team.leader?.id === user?.id;
  const tasks = tasksData?.data || [];
  const messages = messagesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link to="/teams" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to my teams
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{team.name}</h1>
            <Badge variant={team.status === 'completed' ? 'emerald' : 'indigo'}>
              {team.status}
            </Badge>
          </div>
        </div>

        {team.status === 'completed' ? (
          <Link to={`/ratings/${team.project_id}`}>
            <Button variant="primary" size="sm" leftIcon={<Award className="w-4 h-4" />}>
              Rate Teammates
            </Button>
          </Link>
        ) : isLeader ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('Mark this project as completed? This will open peer reviews for all teammates.')) {
                completeProjectMutation.mutate();
              }
            }}
            isLoading={completeProjectMutation.isPending}
            leftIcon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
          >
            Mark Complete
          </Button>
        ) : null}
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        tabs={[
          { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'chat', label: 'Team Chat', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'tasks', label: 'Task Board', icon: <Kanban className="w-4 h-4" /> },
          { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
        ]}
      />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Project Brief</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {team.project?.description || 'Collaborative team workspace for ProjectMatch.'}
            </p>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Members</span>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">{team.members?.length || 1}</p>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Tasks Done</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                {team.task_summary?.done || 0} / {team.task_summary?.total || 0}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase">Status</span>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200 mt-1 capitalize">
                {team.status}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Chat */}
      {activeTab === 'chat' && (
        <Card className="flex flex-col h-[550px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No messages yet. Start the conversation with your team!
              </div>
            ) : (
              messages.map((m) => {
                const isOwn = m.sender_id === user?.id || m.sender?.id === user?.id;
                return (
                  <div key={m.id} className={`flex items-start gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <Avatar src={m.sender?.avatar_url} name={m.sender?.name} size="xs" />
                    <div className={`max-w-[75%] rounded-2xl p-3 text-xs ${
                      isOwn
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-tl-none shadow-xs'
                    }`}>
                      {!isOwn && <p className="font-bold text-[10px] text-slate-500 mb-0.5">{m.sender?.name}</p>}
                      <p>{m.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (chatInput.trim()) sendMutation.mutate(chatInput.trim());
            }}
            className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
          >
            <input
              type="text"
              placeholder="Message your team..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button type="submit" variant="primary" size="sm" disabled={!chatInput.trim()} isLoading={sendMutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      )}

      {/* Tab 3: Tasks Kanban */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Task Board</h3>
            <Button variant="primary" size="sm" onClick={() => setCreateTaskOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Task
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TASK_STATUSES.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.value);
              return (
                <div key={col.value} className="bg-slate-100 dark:bg-slate-900/60 p-3.5 rounded-2xl flex flex-col min-h-[350px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {col.label}
                    </span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colTasks.map((t) => (
                      <Card key={t.id} className="p-3.5 shadow-xs">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                            {t.title}
                          </h4>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            t.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                        {t.description && <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>}
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                          {t.assignee && <Avatar src={t.assignee?.avatar_url} name={t.assignee?.name} size="xs" />}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Members */}
      {activeTab === 'members' && (
        <Card className="p-6">
          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {team.members?.map((m, idx) => (
              <div key={idx} className="pt-4 first:pt-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={m.user?.avatar_url} name={m.user?.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{m.user?.name}</span>
                      {m.user?.id === team.leader_id && (
                        <Badge variant="amber" size="sm">
                          Leader
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{m.role || 'Member'}</p>
                  </div>
                </div>

                <Link to={`/profile/${m.user?.id}`}>
                  <Button variant="ghost" size="sm">
                    View Profile
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={createTaskOpen} onClose={() => setCreateTaskOpen(false)} title="Create New Task">
        <div className="space-y-4">
          <Input label="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
          <Textarea label="Description" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} />
          <Select
            label="Priority"
            options={TASK_PRIORITIES}
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => createTaskMutation.mutate()} isLoading={createTaskMutation.isPending}>
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
