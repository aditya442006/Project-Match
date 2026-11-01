import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects.api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  Users,
  Calendar,
  Sparkles,
  ArrowLeft,
  Edit,
  SendHorizontal,
  FolderGit2,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [applyMessage, setApplyMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => (id ? projectsApi.getProjectById(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
  });

  const applyMutation = useMutation({
    mutationFn: (payload: { role?: string; message?: string }) =>
      id ? projectsApi.applyForRole(id, payload) : Promise.reject('No ID'),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Application Submitted',
        message: 'The project owner has been notified.',
      });
      setApplyModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (err: { message?: string }) => {
      showToast({
        type: 'error',
        title: 'Application Failed',
        message: err.message || 'Could not submit application.',
      });
    },
  });

  const project = data?.data;

  if (isLoading) return <SkeletonCard />;
  if (!project) return <Card className="p-8 text-center text-slate-500">Project not found.</Card>;

  const isOwner = project.viewer?.is_owner || project.owner?.id === user?.id;
  const isMember = project.viewer?.is_member;
  const hasPending = Boolean(project.viewer?.pending_request);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="indigo">{project.type}</Badge>
              <Badge variant="slate" className="capitalize">
                {project.mode}
              </Badge>
              <Badge variant={project.status === 'open' ? 'emerald' : 'slate'} className="capitalize">
                {project.status}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {project.title}
            </h1>
          </div>

          {/* Contextual Action Button */}
          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <Link to={`/matching?project=${project.id}`}>
                  <Button variant="subtle" leftIcon={<Sparkles className="w-4 h-4 text-indigo-600" />}>
                    Find Candidates
                  </Button>
                </Link>
                <Link to={`/projects/${project.id}/edit`}>
                  <Button variant="outline" leftIcon={<Edit className="w-4 h-4" />}>
                    Edit
                  </Button>
                </Link>
              </>
            ) : isMember ? (
              <Link to={`/teams/${project.team?.id || ''}`}>
                <Button variant="primary">Open Team Workspace</Button>
              </Link>
            ) : hasPending ? (
              <Badge variant="amber" size="md">
                Application Pending
              </Badge>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedRole(project.roles?.[0]?.role || '');
                  setApplyModalOpen(true);
                }}
                leftIcon={<SendHorizontal className="w-4 h-4" />}
              >
                Apply for Role
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="py-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About the Project</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            {project.tags?.map((t, i) => (
              <Badge key={i} variant="slate">
                #{t}
              </Badge>
            ))}
          </div>
        </div>

        {/* Role Slots Breakdown */}
        <div className="py-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Open Role Slots</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.roles?.map((r, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm">{r.role}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {r.filled || 0} / {r.slots} filled
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((r.filled || 0) / r.slots) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Apply Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply to join this project"
        description="Select which role you're applying for and write a short pitch to the team leader."
      >
        <div className="space-y-4">
          <Select
            label="Role to apply for"
            options={project.roles?.map((r) => ({ value: r.role, label: r.role })) || []}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          />

          <Textarea
            label="Pitch / Message to Owner"
            placeholder="Share why you'd be a great match for this role, relevant projects, or hours available..."
            rows={4}
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => applyMutation.mutate({ role: selectedRole, message: applyMessage })}
              isLoading={applyMutation.isPending}
            >
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
