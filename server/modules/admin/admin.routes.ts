import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth';

const router = Router();

// Guard entire admin router
router.use(requireAuth, requireRole('admin'));

// GET /admin/stats
router.get('/stats', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      total_users: db.users.length,
      active_teams: db.teams.filter((t) => t.status === 'active').length,
      open_projects: db.projects.filter((p) => p.status === 'open').length,
      acceptance_rate: 0.82,
      signups_last_7_days: [
        { date: 'Oct 26', count: 12 },
        { date: 'Oct 27', count: 18 },
        { date: 'Oct 28', count: 24 },
        { date: 'Oct 29', count: 19 },
        { date: 'Oct 30', count: 31 },
        { date: 'Oct 31', count: 28 },
        { date: 'Nov 01', count: 35 },
      ],
      requests_trend: [
        { date: 'Oct 26', accepted: 8, total: 10 },
        { date: 'Oct 27', accepted: 14, total: 17 },
        { date: 'Oct 28', accepted: 18, total: 22 },
        { date: 'Oct 29', accepted: 15, total: 19 },
        { date: 'Oct 30', accepted: 25, total: 30 },
        { date: 'Oct 31', accepted: 22, total: 27 },
        { date: 'Nov 01', accepted: 29, total: 34 },
      ],
    },
  });
});

// GET /admin/users
router.get('/users', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: db.users,
  });
});

// PATCH /admin/users/:id
router.patch('/users/:id', (req: AuthRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  if (req.body.is_active !== undefined) user.is_active = req.body.is_active;
  if (req.body.role) user.role = req.body.role;

  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    admin: req.user,
    action: 'USER_UPDATED',
    target_type: 'user',
    target_id: user.id,
    details: req.body,
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    data: user,
  });
});

// GET /admin/projects
router.get('/projects', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: db.projects,
  });
});

// PATCH /admin/projects/:id
router.patch('/projects/:id', (req: AuthRequest, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  if (req.body.status) project.status = req.body.status;

  db.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    admin: req.user,
    action: 'PROJECT_MODERATED',
    target_type: 'project',
    target_id: project.id,
    details: req.body,
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    data: project,
  });
});

// GET /admin/reports
router.get('/reports', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: db.reports,
  });
});

// PATCH /admin/reports/:id
router.patch('/reports/:id', (req: AuthRequest, res: Response) => {
  const report = db.reports.find((r) => r.id === req.params.id);
  if (report) {
    report.status = req.body.status;
  }
  return res.json({
    success: true,
    data: report,
  });
});

// GET /admin/audit-log
router.get('/audit-log', (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: db.auditLogs,
  });
});

export default router;
