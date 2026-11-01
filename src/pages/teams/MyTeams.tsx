import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '@/api/teams.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users, ArrowRight, FolderGit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyTeams: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['teams', 'my'],
    queryFn: () => teamsApi.getMyTeams(),
  });

  const teams = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Teams</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your team workspaces, chats, Kanban boards, and project deliverables.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="You have no active teams"
          description="Form a project team by posting an opportunity or applying to open projects."
          actionLabel="Explore Projects"
          onAction={() => window.location.assign('/projects')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} hoverable className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={team.status === 'active' ? 'emerald' : 'indigo'} size="sm">
                    {team.status}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">
                    {team.members?.length || 1} members
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">{team.name}</h3>
                {team.project && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>{team.project.title}</span>
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    Teammates
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {team.members?.map((m, i) => (
                        <Avatar key={i} src={m.user?.avatar_url} name={m.user?.name} size="sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link to={`/teams/${team.id}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Enter Workspace
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
