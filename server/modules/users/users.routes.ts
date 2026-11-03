import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// Never serialize the complete internal user record (which may contain auth/private fields).
const publicProfile = (user: any) => ({
  id: user.id,
  name: user.name,
  college: user.college,
  branch: user.branch,
  year: user.year,
  bio: user.bio,
  avatar_url: user.avatar_url,
  skills: (user.skills || []).map((s: any) => ({ name: s.name || s.skill?.name, level: s.level, years_exp: s.years_exp })).filter((s: any) => s.name),
  preferred_tech: user.preferred_tech || [],
  interests: user.interests || [],
  looking_for: user.looking_for || [],
  experience: user.experience || [],
  availability: user.availability ? { hours_per_week: user.availability.hours_per_week, timezone: user.availability.timezone, slots: user.availability.slots || [] } : undefined,
  profile_completeness: user.profile_completeness,
  reputation_avg: user.reputation_avg,
  reputation_count: user.reputation_count,
});
const privateProfile = (user: any) => ({ ...publicProfile(user), email: user.email, role: user.role, is_verified: user.is_verified, is_active: user.is_active, created_at: user.created_at, updated_at: user.updated_at });

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => res.json({ success: true, data: privateProfile(req.user) }));

router.patch('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  const allowed = ['name', 'college', 'branch', 'year', 'bio', 'skills', 'preferred_tech', 'interests', 'looking_for', 'experience', 'availability'];
  const body = req.body || {};
  if (Object.keys(body).some((key) => !allowed.includes(key))) return res.status(400).json({ success: false, error: { code: 'INVALID_FIELDS', message: 'One or more profile fields cannot be changed' } });
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be 1–80 characters' } });
  if (body.year !== undefined && (!Number.isInteger(body.year) || body.year < 1 || body.year > 10)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Year must be an integer from 1 to 10' } });
  for (const field of ['skills', 'preferred_tech', 'interests', 'looking_for', 'experience'] as const) {
    if (body[field] !== undefined && !Array.isArray(body[field])) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `${field} must be an array` } });
  }
  Object.assign(user, body, { id: user.id, email: user.email, role: user.role, passwordHash: user.passwordHash });
  return res.json({ success: true, data: privateProfile(user) });
});

router.patch('/me/avatar', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  const { avatar_url } = req.body || {};
  if (avatar_url !== null && (typeof avatar_url !== 'string' || avatar_url.length > 2048 || !/^https:\/\//i.test(avatar_url))) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'avatar_url must be an HTTPS URL or null' } });
  user.avatar_url = avatar_url;
  return res.json({ success: true, data: { avatar_url: user.avatar_url } });
});

router.delete('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  user.is_active = false;
  return res.json({ success: true, data: { message: 'Account deactivated' } });
});

router.get('/:id', (req: Request, res: Response) => {
  const user = db.users.find((u) => u.id === req.params.id && u.is_active !== false);
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  const ratings = db.ratings.filter((r) => r.ratee_id === user.id).map((r) => ({ id: r.id, project_id: r.project_id, teamwork: r.teamwork, communication: r.communication, skill: r.skill, reliability: r.reliability, comment: r.comment, created_at: r.created_at }));
  return res.json({ success: true, data: { ...publicProfile(user), ratings_recent: ratings.slice(-5) } });
});

router.get('/', (req: Request, res: Response) => {
  const { q, college, branch, year } = req.query as Record<string, string>;
  const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page as string, 10) || 1));
  const limit = Math.max(1, Math.min(50, Number.parseInt(req.query.limit as string, 10) || 20));
  let results = db.users.filter((u) => u.is_active !== false);
  if (q) { const query = q.toLowerCase().slice(0, 100); results = results.filter((u) => u.name?.toLowerCase().includes(query) || u.college?.toLowerCase().includes(query) || u.skills?.some((s: any) => s.name?.toLowerCase().includes(query))); }
  if (college) results = results.filter((u) => u.college?.toLowerCase().includes(college.toLowerCase()));
  if (branch) results = results.filter((u) => u.branch?.toLowerCase().includes(branch.toLowerCase()));
  if (year) results = results.filter((u) => String(u.year) === String(year));
  const total = results.length;
  const data = results.slice((page - 1) * limit, page * limit).map(publicProfile);
  return res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

export default router;
