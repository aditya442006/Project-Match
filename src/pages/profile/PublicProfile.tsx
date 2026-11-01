import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { GraduationCap, ArrowLeft, SendHorizontal, Star } from 'lucide-react';

export const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => (id ? usersApi.getUserById(id) : Promise.reject('No ID')),
    enabled: Boolean(id),
  });

  const profile = data?.data;

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (!profile) {
    return (
      <Card className="p-8 text-center text-slate-500">
        Profile not found.
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/matching" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4" />
        Back to matches
      </Link>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar src={profile.avatar_url} name={profile.name} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile.college} {profile.branch ? `· ${profile.branch}` : ''} {profile.year ? `(Yr ${profile.year})` : ''}
              </p>
              {profile.reputation_avg !== undefined && (
                <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{profile.reputation_avg.toFixed(1)} reputation</span>
                </div>
              )}
            </div>
          </div>

          <Link to={`/matching?invite=${profile.id}`}>
            <Button variant="primary" leftIcon={<SendHorizontal className="w-4 h-4" />}>
              Invite to Team
            </Button>
          </Link>
        </div>

        {profile.bio && (
          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-4">
            {profile.bio}
          </p>
        )}
      </Card>
    </div>
  );
};
