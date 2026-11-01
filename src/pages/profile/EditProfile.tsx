import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/api/users.api';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EditProfile: React.FC = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [college, setCollege] = useState(user?.college || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [hours, setHours] = useState(user?.availability?.hours_per_week || 10);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await usersApi.updateMe({
        name,
        bio,
        college,
        branch,
        availability: {
          hours_per_week: Number(hours),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          slots: user?.availability?.slots || [],
        },
      });
      if (res.data) {
        setUser(res.data);
        showToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile changes have been saved.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not update your profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/profile/me" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell teammates about your experience and what you want to build..." rows={3} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="College / University" value={college} onChange={(e) => setCollege(e.target.value)} />
            <Input label="Branch / Major" value={branch} onChange={(e) => setBranch(e.target.value)} />
          </div>
          <Input label="Hours Available per Week" type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} min={0} max={80} />

          <div className="pt-3 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
