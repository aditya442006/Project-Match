import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /projects
router.get('/', (req: Request, res: Response) => {
  const { q, type, mode, status, page = '1', limit = '10' } = req.query as Record<string, string>;

  let results = [...db.projects];

  if (q) {
    const query = q.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some((t: string) => t.toLowerCase().includes(query))
    );
  }

  if (type) {
    results = results.filter((p) => p.type === type);
  }

  if (mode) {
    results = results.filter((p) => p.mode === mode);
  }

  if (status) {
    results = results.filter((p) => p.status === status);
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const total = results.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const paginated = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    data: paginated,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
    },
  });
});

// GET /projects/mine
router.get('/mine', requireAuth, (req: AuthRequest, res: Response) => {
  const mine = db.projects.filter((p) => p.owner?.id === req.user.id);
  return res.json({
    success: true,
    data: mine,
  });
});

// GET /projects/:id
router.get('/:id', (req: Request, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  // Find associated team if any
  const team = db.teams.find((t) => t.project_id === project.id);

  return res.json({
    success: true,
    data: {
      ...project,
      team,
      viewer: {
        is_owner: false,
        is_member: false,
        pending_request: null,
      },
    },
  });
});

// POST /projects
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { title, description, type, tags, mode, team_size_min, team_size_max, roles, required_skills } = req.body;

  if (!title || !description || !type) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Title, description, and type are required' },
    });
  }

  const newProject = {
    id: `proj-${Date.now()}`,
    title,
    description,
    type: type || 'project',
    status: 'open',
    mode: mode || 'online',
    tags: tags || [],
    team_size_min: Number(team_size_min) || 2,
    team_size_max: Number(team_size_max) || 4,
    roles: roles || [{ role: 'Developer', slots: 1, filled: 0, skills: [] }],
    required_skills: required_skills || [],
    owner: req.user,
    created_at: new Date().toISOString(),
  };

  db.projects.unshift(newProject);

  // Automatically create a corresponding Team workspace
  const newTeam = {
    id: `team-${Date.now()}`,
    project_id: newProject.id,
    project: newProject,
    name: `${title} Workspace`,
    status: 'forming' as const,
    leader_id: req.user.id,
    leader: req.user,
    members: [{ user: req.user, role: 'Project Lead', joined_at: new Date().toISOString() }],
    conversation_id: `conv-${Date.now()}`,
    task_summary: { total: 0, done: 0 },
    created_at: new Date().toISOString(),
  };

  db.teams.unshift(newTeam);

  return res.status(201).json({
    success: true,
    data: newProject,
  });
});

// PATCH /projects/:id
router.patch('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  Object.assign(project, req.body, { id: project.id, owner: project.owner });

  return res.json({
    success: true,
    data: project,
  });
});

// PATCH /projects/:id/status
router.patch('/:id/status', requireAuth, (req: AuthRequest, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  project.status = req.body.status;

  // Also update corresponding team if completed
  const team = db.teams.find((t) => t.project_id === project.id);
  if (team && req.body.status === 'completed') {
    team.status = 'completed';
  }

  return res.json({
    success: true,
    data: project,
  });
});

// DELETE /projects/:id
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index !== -1) {
    db.projects.splice(index, 1);
  }
  return res.json({
    success: true,
    data: { message: 'Project deleted' },
  });
});

// POST /projects/:id/apply
router.post('/:id/apply', requireAuth, (req: AuthRequest, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const { role, message } = req.body;

  const newRequest = {
    id: `req-${Date.now()}`,
    type: 'application' as const,
    project_id: project.id,
    project,
    team_id: db.teams.find((t) => t.project_id === project.id)?.id,
    from_user: req.user,
    to_user: project.owner,
    role: role || 'Member',
    message,
    status: 'pending' as const,
    created_at: new Date().toISOString(),
  };

  db.requests.unshift(newRequest);

  // Notify owner
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: project.owner.id,
    type: 'application',
    title: 'New Project Application',
    body: `${req.user.name} applied for ${role || 'a role'} on ${project.title}.`,
    data: { project_id: project.id },
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    data: { message: 'Application submitted successfully' },
  });
});

export default router;
