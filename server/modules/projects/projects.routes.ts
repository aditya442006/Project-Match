import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();
const isProjectOwnerOrLeader = (project: any, userId: string) => {
  if (project.owner?.id === userId) return true;
  const team = db.teams.find((t) => t.project_id === project.id);
  return team?.leader_id === userId;
};
const notFound = (res: Response) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
const forbidden = (res: Response) => res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the project owner or team leader can perform this action' } });

router.get('/', (req: Request, res: Response) => {
  const { q, type, mode, status } = req.query as Record<string, string>;
  const pageNum = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, Number.parseInt(req.query.limit as string, 10) || 10));
  let results = [...db.projects];
  if (q) { const query = q.toLowerCase(); results = results.filter((p) => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.tags.some((t: string) => t.toLowerCase().includes(query))); }
  if (type) results = results.filter((p) => p.type === type);
  if (mode) results = results.filter((p) => p.mode === mode);
  if (status) results = results.filter((p) => p.status === status);
  const total = results.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const data = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  return res.json({ success: true, data, meta: { page: pageNum, limit: limitNum, total, totalPages, hasNext: pageNum < totalPages } });
});

router.get('/mine', requireAuth, (req: AuthRequest, res: Response) => res.json({ success: true, data: db.projects.filter((p) => p.owner?.id === req.user.id) }));

router.get('/:id', (req: Request, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return notFound(res);
  const team = db.teams.find((t) => t.project_id === project.id);
  return res.json({ success: true, data: { ...project, team, viewer: { is_owner: false, is_member: false, pending_request: null } } });
});

router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { title, description, type, tags, mode, team_size_min, team_size_max, roles, required_skills } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim() || typeof type !== 'string') return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Title, description and type are required' } });
  const min = Number(team_size_min) || 2; const max = Number(team_size_max) || 4;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 50) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid team size range' } });
  if (tags !== undefined && (!Array.isArray(tags) || tags.some((x: unknown) => typeof x !== 'string'))) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Tags must be strings' } });
  if (required_skills !== undefined && (!Array.isArray(required_skills) || required_skills.some((x: unknown) => typeof x !== 'string'))) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Required skills must be strings' } });
  const now = new Date().toISOString();
  const project = { id: `proj-${Date.now()}`, title: title.trim(), description: description.trim(), type, status: 'open', mode: mode || 'online', tags: tags || [], team_size_min: min, team_size_max: max, roles: Array.isArray(roles) ? roles : [{ role: 'Developer', slots: 1, filled: 0, skills: [] }], required_skills: required_skills || [], owner: req.user, created_at: now };
  const team = { id: `team-${Date.now()}`, project_id: project.id, project, name: `${project.title} Workspace`, status: 'forming' as const, leader_id: req.user.id, leader: req.user, members: [{ user: req.user, role: 'Project Lead', joined_at: now }], conversation_id: `conv-${Date.now()}`, task_summary: { total: 0, done: 0 }, created_at: now };
  db.projects.unshift(project); db.teams.unshift(team);
  return res.status(201).json({ success: true, data: project });
});

router.patch('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return notFound(res);
  if (!isProjectOwnerOrLeader(project, req.user.id)) return forbidden(res);
  const allowed = ['title', 'description', 'type', 'mode', 'tags', 'team_size_min', 'team_size_max', 'roles', 'required_skills'];
  const body = req.body || {};
  if (Object.keys(body).some((key) => !allowed.includes(key))) return res.status(400).json({ success: false, error: { code: 'INVALID_FIELDS', message: 'One or more project fields cannot be changed' } });
  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim())) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Title cannot be empty' } });
  if (body.team_size_min !== undefined || body.team_size_max !== undefined) { const min = Number(body.team_size_min ?? project.team_size_min); const max = Number(body.team_size_max ?? project.team_size_max); if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 50) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid team size range' } }); }
  if (body.title !== undefined) body.title = body.title.trim();
  Object.assign(project, body);
  return res.json({ success: true, data: project });
});

router.patch('/:id/status', requireAuth, (req: AuthRequest, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return notFound(res);
  if (!isProjectOwnerOrLeader(project, req.user.id)) return forbidden(res);
  const allowed = ['open', 'in_progress', 'completed', 'cancelled', 'closed'];
  if (!allowed.includes(req.body?.status)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid project status' } });
  project.status = req.body.status;
  const team = db.teams.find((t) => t.project_id === project.id);
  if (team && project.status === 'completed') team.status = 'completed';
  return res.json({ success: true, data: project });
});

router.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index < 0) return notFound(res);
  const project = db.projects[index];
  if (!isProjectOwnerOrLeader(project, req.user.id)) return forbidden(res);
  db.projects.splice(index, 1);
  // Remove associated in-memory workspace/tasks to avoid orphan records.
  const teamIds = db.teams.filter((t) => t.project_id === project.id).map((t) => t.id);
  db.teams = db.teams.filter((t) => t.project_id !== project.id);
  db.tasks = db.tasks.filter((t) => !teamIds.includes(t.team_id));
  return res.json({ success: true, data: { message: 'Project deleted' } });
});

router.post('/:id/apply', requireAuth, (req: AuthRequest, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return notFound(res);
  if (project.owner?.id === req.user.id) return res.status(409).json({ success: false, error: { code: 'OWNER_CANNOT_APPLY', message: 'You own this project' } });
  if (project.status !== 'open') return res.status(409).json({ success: false, error: { code: 'PROJECT_CLOSED', message: 'This project is not accepting applications' } });
  const alreadyApplied = db.requests.some((r) => r.project_id === project.id && r.from_user?.id === req.user.id && r.status === 'pending');
  if (alreadyApplied) return res.status(409).json({ success: false, error: { code: 'ALREADY_APPLIED', message: 'You already have a pending application' } });
  const role = typeof req.body?.role === 'string' && req.body.role.trim() ? req.body.role.trim() : 'Member';
  const message = typeof req.body?.message === 'string' ? req.body.message.slice(0, 1000) : '';
  const request = { id: `req-${Date.now()}`, type: 'application' as const, project_id: project.id, project, team_id: db.teams.find((t) => t.project_id === project.id)?.id, from_user: req.user, to_user: project.owner, role, message, status: 'pending' as const, created_at: new Date().toISOString() };
  db.requests.unshift(request);
  db.notifications.unshift({ id: `notif-${Date.now()}`, user_id: project.owner.id, type: 'application', title: 'New Project Application', body: `${req.user.name} applied for ${role} on ${project.title}.`, data: { project_id: project.id }, is_read: false, created_at: new Date().toISOString() });
  return res.status(201).json({ success: true, data: { message: 'Application submitted successfully' } });
});

export default router;
