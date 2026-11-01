import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { requestsApi } from '@/api/requests.api';
import { teamsApi } from '@/api/teams.api';
import { matchingApi } from '@/api/matching.api';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import {
  Sparkles,
  Users,
  FolderGit2,
  Check,
  X,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '@/lib/format';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Queries
  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['requests', 'incoming-pending'],
    queryFn: () => requestsApi.getRequests({ box: 'incoming', status: 'pending' }),
  });

  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams', 'my'],
    queryFn: () => teamsApi.getMyTeams(),
  });

  const { data: matchesData, isLoading: loadingMatches } = useQuery({
    queryKey: ['matching', 'teammates', 3],
    queryFn: () => matchingApi.getRecommendedTeammates(3),
  });

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['matching', 'projects', 4],
    queryFn: () => matchingApi.getRecommendedProjects(4),
  });

  // Request mutation (Accept / Decline)
  const requestMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) =>
      requestsApi.updateRequest(id, action),
    onSuccess: (_, variables) => {
      showToast({
        type: 'success',
        title: variables.action === 'accept' ? 'Request Accepted' : 'Request Declined',
        message:
          variables.action === 'accept'
            ? 'You have joined the team workspace!'
            : 'The request has been declined.',
      });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['teams', 'my'] });
    },
    onError: (err: { message?: string }) => {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not process the request.',
      });
    },
  });

  const pendingRequests = requestsData?.data || [];
  const myTeams = teamsData?.data || [];
  const recommendedTeammates = matchesData?.data || [];
  const recommendedProjects = projectsData?.data || [];

  const completeness = user?.profile_completeness ?? 65;

  return (
    <div className="space-y-8">
      {/* Top Welcome & Profile Completeness Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white shadow-md">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>AI Team Formation Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hi, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
          </h1>
          <p className="text-sm text-indigo-200">
            {user?.college ? `${user.college} · ` : ''}
            Ready to build something impactful? Check your match feed or join an ongoing project.
          </p>
        </div>

        {/* Profile Completeness Gauge */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full sm:w-auto">
          <ScoreRing score={completeness} size={60} strokeWidth={6} />
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Profile Completeness</p>
            <p className="text-xs text-white/80 mt-0.5">
              {completeness >= 80 ? 'Profile in great shape!' : 'Add skills to boost matching rank'}
            </p>
            {completeness < 100 && (
              <Link
                to="/profile/edit"
                className="inline-block mt-1 text-xs font-semibold text-white underline hover:text-indigo-200"
              >
                Complete profile &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Pending Invites & Applications Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold">
                {pendingRequests.length}
              </span>
            )}
          </h2>
          <Link to="/requests" className="text-xs font-semibold text-indigo-600 hover:underline">
            View all requests &rarr;
          </Link>
        </div>

        {loadingRequests ? (
          <SkeletonCard />
        ) : pendingRequests.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No pending invitations or applications right now.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={req.from_user?.avatar_url} name={req.from_user?.name} size="md" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {req.from_user?.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {req.type === 'invite' ? 'invited you to join' : 'applied for'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={req.type === 'invite' ? 'indigo' : 'emerald'} size="sm">
                    {req.type}
                  </Badge>
                </div>

                {req.project && (
                  <p className="mt-3 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Project</span>
                    {req.project.title} {req.role ? `· Role: ${req.role}` : ''}
                  </p>
                )}

                {req.message && (
                  <p className="mt-2 text-xs text-slate-500 italic">"{req.message}"</p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestMutation.mutate({ id: req.id, action: 'decline' })}
                    isLoading={requestMutation.isPending}
                    leftIcon={<X className="w-3.5 h-3.5" />}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => requestMutation.mutate({ id: req.id, action: 'accept' })}
                    isLoading={requestMutation.isPending}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Accept
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Your Teams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Your Teams & Workspaces</span>
          </h2>
          <Link to="/teams" className="text-xs font-semibold text-indigo-600 hover:underline">
            Manage teams &rarr;
          </Link>
        </div>

        {loadingTeams ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : myTeams.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="You haven't joined any teams yet"
            description="Explore open projects looking for teammates with your skills, or form a new team."
            actionLabel="Explore Projects"
            onAction={() => window.location.assign('/projects')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myTeams.map((team) => (
              <Card key={team.id} hoverable className="flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={team.status === 'active' ? 'emerald' : 'indigo'} size="sm">
                      {team.status}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {team.members?.length || 1} members
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {team.name}
                  </h3>
                  {team.project && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {team.project.title}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {team.members?.slice(0, 3).map((m, idx) => (
                      <Avatar key={idx} src={m.user?.avatar_url} name={m.user?.name} size="xs" />
                    ))}
                  </div>

                  <Link to={`/teams/${team.id}`}>
                    <Button variant="subtle" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Open Workspace
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Top 3 AI Recommended Teammates Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Recommended Teammates</h2>
          </div>
          <Link to="/matching" className="text-xs font-semibold text-indigo-600 hover:underline">
            View full match feed &rarr;
          </Link>
        </div>

        {loadingMatches ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recommendedTeammates.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            No peer recommendations found. Updating your profile skills will generate new matches.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommendedTeammates.map((match) => (
              <Card key={match.user.id} hoverable className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Avatar src={match.user.avatar_url} name={match.user.name} size="md" />
                    <ScoreRing score={match.score} size={46} strokeWidth={4} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {match.user.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {match.user.college ? `${match.user.college}` : 'Student'}
                    {match.user.year ? ` · Yr ${match.user.year}` : ''}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {match.user.skills?.slice(0, 3).map((s, idx) => (
                      <Badge key={idx} variant="slate" size="sm">
                        {s.name || s.skill?.name || 'Skill'}
                      </Badge>
                    ))}
                  </div>

                  {match.explanation?.reason && (
                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-indigo-50/50 dark:bg-indigo-950/20 p-2 rounded-lg">
                      {match.explanation.reason}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Link to={`/profile/${match.user.id}`}>
                    <Button variant="ghost" size="sm">
                      View Profile
                    </Button>
                  </Link>
                  <Link to={`/matching?invite=${match.user.id}`}>
                    <Button variant="primary" size="sm">
                      Invite
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Projects Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Featured Projects Seeking Members</h2>
          </div>
          <Link to="/projects" className="text-xs font-semibold text-indigo-600 hover:underline">
            Explore all &rarr;
          </Link>
        </div>

        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recommendedProjects.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            No projects available right now.{' '}
            <Link to="/projects/new" className="text-indigo-600 underline font-medium">
              Create the first one!
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendedProjects.map((project) => (
              <Card key={project.id} hoverable className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="indigo" size="sm">
                      {project.type}
                    </Badge>
                    <span className="text-xs text-slate-400 capitalize">{project.mode}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{project.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.tags?.slice(0, 4).map((tag, idx) => (
                      <span key={idx} className="text-[11px] text-slate-500 dark:text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {project.team_size_min}-{project.team_size_max} members
                    </span>
                  </div>
                  <Link to={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
