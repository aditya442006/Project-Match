import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// POST /requests
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { project_id, to_user, role, message } = req.body;

  const project = db.projects.find((p) => p.id === project_id);
  const recipient = db.users.find((u) => u.id === to_user);

  if (!project || !recipient) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Project or recipient user not found' },
    });
  }

  const team = db.teams.find((t) => t.project_id === project.id);

  const newRequest = {
    id: `req-${Date.now()}`,
    type: 'invite' as const,
    project_id: project.id,
    project,
    team_id: team?.id,
    from_user: req.user,
    to_user: recipient,
    role: role || 'Teammate',
    message: message || '',
    status: 'pending' as const,
    created_at: new Date().toISOString(),
  };

  db.requests.unshift(newRequest);

  // Send notification to invitee
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: recipient.id,
    type: 'invite',
    title: 'Team Invitation',
    body: `${req.user.name} invited you to join ${project.title} as ${role || 'Teammate'}.`,
    data: { project_id: project.id, team_id: team?.id },
    is_read: false,
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    data: newRequest,
  });
});

// GET /requests
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { box = 'all', status } = req.query as Record<string, string>;

  let list = db.requests.filter(
    (r) => r.to_user?.id === req.user.id || r.from_user?.id === req.user.id
  );

  if (box === 'incoming') {
    list = list.filter((r) => r.to_user?.id === req.user.id);
  } else if (box === 'outgoing') {
    list = list.filter((r) => r.from_user?.id === req.user.id);
  }

  if (status) {
    list = list.filter((r) => r.status === status);
  }

  return res.json({
    success: true,
    data: list,
  });
});

// GET /requests/counts
router.get('/counts', requireAuth, (req: AuthRequest, res: Response) => {
  const incoming = db.requests.filter(
    (r) => r.to_user?.id === req.user.id && r.status === 'pending'
  ).length;

  const outgoing = db.requests.filter(
    (r) => r.from_user?.id === req.user.id && r.status === 'pending'
  ).length;

  return res.json({
    success: true,
    data: { incoming, outgoing },
  });
});

// GET /requests/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const requestItem = db.requests.find((r) => r.id === req.params.id);
  if (!requestItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
  }

  return res.json({
    success: true,
    data: requestItem,
  });
});

// PATCH /requests/:id
router.patch('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { action } = req.body;
  const requestItem = db.requests.find((r) => r.id === req.params.id);

  if (!requestItem) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } });
  }

  if (requestItem.status !== 'pending') {
    return res.status(409).json({
      success: false,
      error: { code: 'REQUEST_NOT_PENDING', message: 'Request is no longer pending' },
    });
  }

  if (action === 'accept') {
    const project = db.projects.find((p) => p.id === requestItem.project_id);
    const team = db.teams.find((t) => t.id === requestItem.team_id || t.project_id === requestItem.project_id);

    // Atomically check role slots
    if (project && requestItem.role) {
      const targetRole = project.roles?.find((r: any) => r.role === requestItem.role);
      if (targetRole && (targetRole.filled || 0) >= targetRole.slots) {
        return res.status(409).json({
          success: false,
          error: { code: 'ROLE_FULL', message: 'No slots left for this role' },
        });
      }
      if (targetRole) {
        targetRole.filled = (targetRole.filled || 0) + 1;
      }
    }

    // Add user to team
    if (team) {
      const memberUser = requestItem.type === 'invite' ? requestItem.to_user : requestItem.from_user;
      const alreadyMember = team.members.some((m: any) => m.user?.id === memberUser.id);
      if (!alreadyMember) {
        team.members.push({
          user: memberUser,
          role: requestItem.role || 'Member',
          joined_at: new Date().toISOString(),
        });
      }
    }

    requestItem.status = 'accepted';
  } else if (action === 'decline') {
    requestItem.status = 'declined';
  } else if (action === 'cancel') {
    requestItem.status = 'cancelled';
  }

  return res.json({
    success: true,
    data: requestItem,
  });
});

export default router;
