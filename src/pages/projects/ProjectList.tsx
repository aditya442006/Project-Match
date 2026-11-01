import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi, type ProjectQueryParams } from '@/api/projects.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Search, PlusCircle, Filter, Users, Calendar, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDate } from '@/lib/format';
import { PROJECT_TYPES, PROJECT_MODES } from '@/lib/constants';

export const ProjectList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [mode, setMode] = useState(searchParams.get('mode') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const queryParams: ProjectQueryParams = {
    q: search || undefined,
    type: type || undefined,
    mode: mode || undefined,
    page,
    limit: 9,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects', queryParams],
    queryFn: () => projectsApi.getProjects(queryParams),
  });

  const projects = data?.data || [];
  const meta = data?.meta || { totalPages: 1, total: 0 };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const newParams = new URLSearchParams();
    if (search) newParams.set('q', search);
    if (type) newParams.set('type', type);
    if (mode) newParams.set('mode', mode);
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Explore Projects & Hackathons</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover student projects looking for team members and apply for open role slots.
          </p>
        </div>

        <Link to="/projects/new">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Post a Project
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search by project title, keyword, or tech..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Select
            options={[{ value: '', label: 'All Types' }, ...PROJECT_TYPES]}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />

          <Select
            options={[{ value: '', label: 'All Modes' }, ...PROJECT_MODES]}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          />
        </form>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <Card className="p-8 text-center space-y-4">
          <p className="text-sm text-rose-500">Could not load projects at this time.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Filter className="w-8 h-8" />}
          title="No projects matched your criteria"
          description="Try broadening your search keywords or removing selected filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setType('');
            setMode('');
            setSearchParams({});
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <Card key={proj.id} hoverable className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="indigo" size="sm">
                    {proj.type}
                  </Badge>
                  <span className="text-xs text-slate-400 capitalize">{proj.mode}</span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                  {proj.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                  {proj.description}
                </p>

                {/* Role slots overview */}
                {proj.roles && proj.roles.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Open Role Slots
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {proj.roles.map((r, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {r.role} ({r.filled || 0}/{r.slots})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={proj.owner?.avatar_url} name={proj.owner?.name} size="xs" />
                  <span className="text-xs text-slate-500 truncate max-w-[100px]">
                    {proj.owner?.name}
                  </span>
                </div>

                <Link to={`/projects/${proj.id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={meta.totalPages || 1}
        onPageChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
