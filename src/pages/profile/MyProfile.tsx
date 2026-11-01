import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Edit3, GraduationCap, MapPin, Clock, Star } from 'lucide-react';

export const MyProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar src={user.avatar_url} name={user.name} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                {user.role === 'admin' && <Badge variant="indigo">Admin</Badge>}
              </div>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                {user.college && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    {user.college} {user.year ? `(Year ${user.year})` : ''}
                  </span>
                )}
                {user.reputation_avg !== undefined && (
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {user.reputation_avg.toFixed(1)} ({user.reputation_count || 0} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link to="/profile/edit">
            <Button variant="outline" leftIcon={<Edit3 className="w-4 h-4" />}>
              Edit Profile
            </Button>
          </Link>
        </div>

        {user.bio && (
          <p className="mt-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
            {user.bio}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Skills & Proficiency</h2>
          {user.skills && user.skills.length > 0 ? (
            <div className="space-y-3">
              {user.skills.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.name || s.skill?.name || 'Skill'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${(s.level / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">Lvl {s.level}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No skills added yet.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Availability & Looking For</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Hours per week</p>
              <p className="text-sm font-medium mt-1">
                {user.availability?.hours_per_week ? `${user.availability.hours_per_week} hrs/week` : 'Flexible'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Looking to join</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {user.looking_for?.map((item) => (
                  <Badge key={item} variant="indigo" size="sm">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
