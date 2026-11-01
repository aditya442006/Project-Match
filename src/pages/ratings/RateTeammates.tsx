import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ratingsApi } from '@/api/ratings.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { Textarea } from '@/components/ui/Textarea';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, CheckCircle2, Star, Award } from 'lucide-react';
import type { TeammateRatingStatus } from '@/types';

export const RateTeammates: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [ratingsForm, setRatingsForm] = useState<Record<string, {
    teamwork: number;
    communication: number;
    skill: number;
    reliability: number;
    comment: string;
  }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['ratings', 'status', projectId],
    queryFn: () => (projectId ? ratingsApi.getProjectRatingStatus(projectId) : Promise.reject('No ID')),
    enabled: Boolean(projectId),
  });

  const submitRatingMutation = useMutation({
    mutationFn: (payload: {
      project_id: string;
      ratee_id: string;
      teamwork: number;
      communication: number;
      skill: number;
      reliability: number;
      comment?: string;
    }) => ratingsApi.createRating(payload),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Rating Submitted',
        message: 'Your peer review has been recorded to compute student reputation.',
      });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'status', projectId] });
    },
    onError: (err: { message?: string }) => {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not record rating.',
      });
    },
  });

  const teammates = data?.data || [];

  const handleScoreChange = (userId: string, category: 'teamwork' | 'communication' | 'skill' | 'reliability', score: number) => {
    setRatingsForm((prev) => {
      const existing = prev[userId] || {
        teamwork: 5,
        communication: 5,
        skill: 5,
        reliability: 5,
        comment: '',
      };
      return {
        ...prev,
        [userId]: {
          ...existing,
          [category]: score,
        },
      };
    });
  };

  const handleCommentChange = (userId: string, comment: string) => {
    setRatingsForm((prev) => {
      const existing = prev[userId] || {
        teamwork: 5,
        communication: 5,
        skill: 5,
        reliability: 5,
        comment: '',
      };
      return {
        ...prev,
        [userId]: {
          ...existing,
          comment,
        },
      };
    });
  };

  const submitTeammateRating = (userId: string) => {
    if (!projectId) return;
    const current = ratingsForm[userId] || {
      teamwork: 5,
      communication: 5,
      skill: 5,
      reliability: 5,
      comment: '',
    };
    submitRatingMutation.mutate({
      project_id: projectId,
      ratee_id: userId,
      teamwork: current.teamwork,
      communication: current.communication,
      skill: current.skill,
      reliability: current.reliability,
      comment: current.comment || undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/teams" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4" />
        Back to teams
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Peer Ratings & Reviews</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Rate your teammates on completed project deliverables to feed our transparent reputation score.
        </p>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : teammates.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          No teammates available to review for this project.
        </Card>
      ) : (
        <div className="space-y-6">
          {teammates.map((item) => {
            const { user, has_rated } = item;
            const currentForm = ratingsForm[user.id] || {
              teamwork: 5,
              communication: 5,
              skill: 5,
              reliability: 5,
              comment: '',
            };

            return (
              <Card key={user.id} className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar_url} name={user.name} size="md" />
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{user.name}</h3>
                      <p className="text-xs text-slate-500">{user.college || 'Teammate'}</p>
                    </div>
                  </div>

                  {has_rated && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      Review Submitted
                    </span>
                  )}
                </div>

                {has_rated ? (
                  <p className="mt-4 text-xs text-slate-500 italic">
                    You have already submitted a peer rating for this student. Thank you for contributing to the community!
                  </p>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-xs font-semibold">Teamwork</span>
                        <StarRating
                          value={currentForm.teamwork}
                          onChange={(v) => handleScoreChange(user.id, 'teamwork', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-xs font-semibold">Communication</span>
                        <StarRating
                          value={currentForm.communication}
                          onChange={(v) => handleScoreChange(user.id, 'communication', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-xs font-semibold">Technical Skill</span>
                        <StarRating
                          value={currentForm.skill}
                          onChange={(v) => handleScoreChange(user.id, 'skill', v)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-xs font-semibold">Reliability</span>
                        <StarRating
                          value={currentForm.reliability}
                          onChange={(v) => handleScoreChange(user.id, 'reliability', v)}
                        />
                      </div>
                    </div>

                    <Textarea
                      label="Optional Feedback"
                      placeholder="Share a few words on what went well or what they excelled at..."
                      rows={2}
                      value={currentForm.comment}
                      onChange={(e) => handleCommentChange(user.id, e.target.value)}
                    />

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => submitTeammateRating(user.id)}
                        isLoading={submitRatingMutation.isPending}
                        leftIcon={<Award className="w-4 h-4" />}
                      >
                        Submit Rating
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
