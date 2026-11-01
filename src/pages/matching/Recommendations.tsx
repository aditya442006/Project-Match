import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchingApi } from '@/api/matching.api';
import { projectsApi } from '@/api/projects.api';
import { requestsApi } from '@/api/requests.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import {
  Sparkles,
  RefreshCw,
  SendHorizontal,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import type { MatchItem } from '@/types';

export const Recommendations: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchItem | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [inviteMessage, setInviteMessage] = useState<string>('');

  const { data: matchesData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['matching', 'teammates'],
    queryFn: () => matchingApi.getRecommendedTeammates(12),
  });

  const { data: myProjectsData } = useQuery({
    queryKey: ['projects', 'mine'],
    queryFn: () => projectsApi.getMyProjects(),
  });

  const matches = matchesData?.data || [];
  const myProjects = myProjectsData?.data || [];

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: (payload: { project_id: string; to_user: string; role?: string; message?: string }) =>
      requestsApi.createRequest(payload),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Invitation Sent',
        message: 'Your invitation has been dispatched to the candidate.',
      });
      setInviteModalOpen(false);
      setInviteMessage('');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
    onError: (err: { message?: string }) => {
      showToast({
        type: 'error',
        title: 'Invite Failed',
        message: err.message || 'Could not send invitation.',
      });
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: (candidateId: string) =>
      matchingApi.sendFeedback({ candidate_id: candidateId, action: 'dismissed' }),
    onSuccess: (_, candidateId) => {
      queryClient.setQueryData(['matching', 'teammates'], (old: { data: MatchItem[] } | undefined) => {
        if (!old) return old;
        return { ...old, data: old.data.filter((m) => m.user.id !== candidateId) };
      });
      showToast({
        type: 'info',
        message: 'Candidate dismissed from recommendations.',
      });
    },
  });

  const openInviteModal = (candidate: MatchItem) => {
    setSelectedCandidate(candidate);
    if (myProjects.length > 0) {
      setSelectedProjectId(myProjects[0].id);
      setSelectedRole(myProjects[0].roles?.[0]?.role || '');
    }
    setInviteModalOpen(true);
  };

  const handleSendInvite = () => {
    if (!selectedCandidate || !selectedProjectId) return;
    inviteMutation.mutate({
      project_id: selectedProjectId,
      to_user: selectedCandidate.user.id,
      role: selectedRole || undefined,
      message: inviteMessage || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Teammate Recommendations</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              Hybrid Recommender
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ranked by semantic profile similarity, skill complementarity, availability, and peer reputation.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isRefetching}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Grid of Matches */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-8 h-8" />}
          title="No recommendations found right now"
          description="Try updating your profile with additional skills or wait for more students to join your college community."
          actionLabel="Edit Profile Skills"
          onAction={() => window.location.assign('/profile/edit')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((item) => {
            const { user, score, features, matched_skills, missing_skills, explanation } = item;
            return (
              <Card key={user.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  {/* Top Bar with Avatar & Score Ring */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar_url} name={user.name} size="lg" />
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{user.name}</h3>
                        <p className="text-xs text-slate-500">
                          {user.college || 'Student'} {user.year ? `· Yr ${user.year}` : ''}
                        </p>
                      </div>
                    </div>
                    <ScoreRing score={score} size={50} strokeWidth={5} />
                  </div>

                  {/* Feature Breakdown Bars */}
                  <div className="space-y-1.5 py-3 border-y border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Semantic Fit:</span>
                      <span className="font-medium">{Math.round((features?.semantic || 0) * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Skill Complementarity:</span>
                      <span className="font-medium">{Math.round((features?.complement || 0) * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Availability Overlap:</span>
                      <span className="font-medium">{Math.round((features?.availability || 0) * 100)}%</span>
                    </div>
                  </div>

                  {/* Skills Chips */}
                  <div className="mt-3 space-y-2">
                    {matched_skills && matched_skills.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                          Matched Skills
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {matched_skills.map((skill, idx) => (
                            <Badge key={idx} variant="emerald" size="sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {missing_skills && missing_skills.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Complementary Gaps
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {missing_skills.map((skill, idx) => (
                            <Badge key={idx} variant="slate" size="sm">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Why this match panel */}
                  {explanation && (
                    <div className="mt-4 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                          Why this match?
                        </span>
                        {explanation.source === 'llm' && (
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 font-bold">
                            AI Explanation
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{explanation.reason}</p>
                      {explanation.suggestedRole && (
                        <p className="mt-1 font-medium text-indigo-700 dark:text-indigo-300">
                          Suggested Role: {explanation.suggestedRole}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissMutation.mutate(user.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Dismiss
                  </Button>

                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${user.id}`}>
                      <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openInviteModal(item)}
                      leftIcon={<SendHorizontal className="w-3.5 h-3.5" />}
                    >
                      Invite
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={`Invite ${selectedCandidate?.user.name || 'Candidate'}`}
        description="Select which of your projects you'd like to invite this student to join."
      >
        <div className="space-y-4">
          {myProjects.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 text-xs text-amber-800 dark:text-amber-200 space-y-2">
              <p>You don't have any active projects yet. Create a project before sending invitations.</p>
              <Link to="/projects/new">
                <Button variant="primary" size="sm">
                  Create Project
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Select
                label="Target Project"
                options={myProjects.map((p) => ({ value: p.id, label: p.title }))}
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  const proj = myProjects.find((p) => p.id === e.target.value);
                  setSelectedRole(proj?.roles?.[0]?.role || '');
                }}
              />

              <Input
                label="Proposed Role (Optional)"
                placeholder="e.g. Frontend Developer, ML Engineer"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              />

              <Textarea
                label="Invitation Message"
                placeholder="Introduce your project and explain why their skillset would be a great fit..."
                rows={3}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendInvite}
                  isLoading={inviteMutation.isPending}
                  leftIcon={<SendHorizontal className="w-4 h-4" />}
                >
                  Send Invitation
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
