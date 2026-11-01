import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects.api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { PROJECT_TYPES, PROJECT_MODES } from '@/lib/constants';

interface RoleRow {
  role: string;
  slots: number;
}

export const ProjectForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('project');
  const [mode, setMode] = useState('online');
  const [tagsInput, setTagsInput] = useState('');
  const [teamMin, setTeamMin] = useState(2);
  const [teamMax, setTeamMax] = useState(4);
  const [roles, setRoles] = useState<RoleRow[]>([
    { role: 'Frontend Engineer', slots: 1 },
    { role: 'Backend Engineer', slots: 1 },
  ]);

  const addRole = () => {
    if (roles.length < 15) {
      setRoles([...roles, { role: '', slots: 1 }]);
    }
  };

  const removeRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, field: keyof RoleRow, value: string | number) => {
    setRoles(
      roles.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      isEditing && id ? projectsApi.updateProject(id, payload) : projectsApi.createProject(payload),
    onSuccess: (res) => {
      showToast({
        type: 'success',
        title: isEditing ? 'Project Updated' : 'Project Created',
        message: 'Your project is now published for students to explore!',
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(res.data ? `/projects/${res.data.id}` : '/projects');
    },
    onError: (err: { message?: string }) => {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not save project.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    mutation.mutate({
      title,
      description,
      type,
      mode,
      tags,
      team_size_min: Number(teamMin),
      team_size_max: Number(teamMax),
      roles: roles.map((r) => ({ role: r.role, slots: Number(r.slots), skills: [] })),
      required_skills: [],
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4" />
        Cancel and return
      </Link>

      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          {isEditing ? 'Edit Project' : 'Post a New Project or Hackathon'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Project Title"
            placeholder="e.g. AI-Powered Campus Shuttle Tracker"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Project Description"
            placeholder="Describe what you plan to build, goals, target users, and what makes it exciting..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Project Type"
              options={PROJECT_TYPES}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />

            <Select
              label="Collaboration Mode"
              options={PROJECT_MODES}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            />
          </div>

          <Input
            label="Tags (comma-separated)"
            placeholder="React, Python, FastAPI, UI/UX"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Team Size"
              type="number"
              value={teamMin}
              onChange={(e) => setTeamMin(Number(e.target.value))}
              min={1}
            />
            <Input
              label="Max Team Size"
              type="number"
              value={teamMax}
              onChange={(e) => setTeamMax(Number(e.target.value))}
              min={1}
            />
          </div>

          {/* Dynamic Role Slots */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Required Roles & Slots</h3>
                <p className="text-xs text-slate-500">Define the teammates you need to recruit</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addRole} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Role
              </Button>
            </div>

            <div className="space-y-3">
              {roles.map((r, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Input
                    placeholder="e.g. Backend Developer"
                    value={r.role}
                    onChange={(e) => updateRole(idx, 'role', e.target.value)}
                    required
                  />
                  <div className="w-24">
                    <Input
                      type="number"
                      min={1}
                      value={r.slots}
                      onChange={(e) => updateRole(idx, 'slots', Number(e.target.value))}
                    />
                  </div>
                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRole(idx)}
                      className="p-2 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" size="lg" isLoading={mutation.isPending} leftIcon={<Save className="w-4 h-4" />}>
              {isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
