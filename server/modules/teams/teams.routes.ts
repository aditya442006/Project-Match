import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /teams/my
router.get('/my', requireAuth, (req: AuthRequest, res: Response) => {
  const myTeams = db.teams.filter(
    (t) => t.leader_id === req.user.id || t.members.some((m: any) => m.user?.id === req.user.id)
  );
  return res.json({
    success: true,
    data: myTeams,
  });
});

// GET /teams/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team workspace not found' } });
  }

  // Update task summary count
  const teamTasks = db.tasks.filter((task) => task.team_id === team.id);
  const doneTasks = teamTasks.filter((task) => task.status === 'done');
  team.task_summary = {
    total: teamTasks.length,
    done: doneTasks.length,
  };

  return res.json({
    success: true,
    data: team,
  });
});

// PATCH /teams/:id
router.patch('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
  }

  if (req.body.name) team.name = req.body.name;
  if (req.body.status) team.status = req.body.status;

  return res.json({
    success: true,
    data: team,
  });
});

// PATCH /teams/:id/leader
router.patch('/:id/leader', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
  }

  const { new_leader_id } = req.body;
  const newLeader = db.users.find((u) => u.id === new_leader_id);

  if (newLeader) {
    team.leader_id = new_leader_id;
    team.leader = newLeader;
  }

  return res.json({
    success: true,
    data: team,
  });
});

// DELETE /teams/:id/members/:userId
router.delete('/:id/members/:userId', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
  }

  team.members = team.members.filter((m: any) => m.user?.id !== req.params.userId);

  return res.json({
    success: true,
    data: { message: 'Member removed' },
  });
});

// DELETE /teams/:id/leave
router.delete('/:id/leave', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
  }

  team.members = team.members.filter((m: any) => m.user?.id !== req.user.id);

  return res.json({
    success: true,
    data: { message: 'Left team successfully' },
  });
});

export default router;
