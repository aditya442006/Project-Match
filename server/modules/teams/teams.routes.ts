import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();
const isMember = (team: any, userId: string) => team.leader_id === userId || (team.members || []).some((m: any) => m.user?.id === userId);
const isLeader = (team: any, userId: string) => {
  const project = db.projects.find((p) => p.id === team.project_id);
  return team.leader_id === userId || project?.owner?.id === userId;
};
const notFound = (res: Response) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Team not found' } });
const forbidden = (res: Response) => res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to perform this action' } });

router.get('/my', requireAuth, (req: AuthRequest, res: Response) => res.json({ success: true, data: db.teams.filter((t) => isMember(t, req.user.id)) }));

router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) return notFound(res);
  if (!isMember(team, req.user.id)) return forbidden(res);
  const tasks = db.tasks.filter((task) => task.team_id === team.id);
  team.task_summary = { total: tasks.length, done: tasks.filter((task) => task.status === 'done').length };
  return res.json({ success: true, data: team });
});

router.patch('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) return notFound(res);
  if (!isLeader(team, req.user.id)) return forbidden(res);
  const { name, status } = req.body || {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Team name must be 1–100 characters' } });
    team.name = name.trim();
  }
  if (status !== undefined) {
    if (!['forming', 'active', 'completed', 'archived'].includes(status)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid team status' } });
    team.status = status;
  }
  return res.json({ success: true, data: team });
});

router.patch('/:id/leader', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) return notFound(res);
  if (!isLeader(team, req.user.id)) return forbidden(res);
  const id = req.body?.new_leader_id;
  if (typeof id !== 'string' || !id) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'new_leader_id is required' } });
  const member = (team.members || []).find((m: any) => m.user?.id === id);
  if (!member) return res.status(422).json({ success: false, error: { code: 'INVALID_LEADER', message: 'New leader must already be a team member' } });
  team.leader_id = id;
  team.leader = member.user;
  return res.json({ success: true, data: team });
});

router.delete('/:id/members/:userId', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) return notFound(res);
  if (!isLeader(team, req.user.id)) return forbidden(res);
  if (req.params.userId === team.leader_id) return res.status(409).json({ success: false, error: { code: 'LEADER_TRANSFER_REQUIRED', message: 'Transfer leadership before removing the leader' } });
  const before = team.members.length;
  team.members = team.members.filter((m: any) => m.user?.id !== req.params.userId);
  if (before === team.members.length) return res.status(404).json({ success: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Team member not found' } });
  return res.json({ success: true, data: { message: 'Member removed' } });
});

router.delete('/:id/leave', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.id === req.params.id);
  if (!team) return notFound(res);
  if (team.leader_id === req.user.id) return res.status(409).json({ success: false, error: { code: 'LEADER_TRANSFER_REQUIRED', message: 'Transfer leadership before leaving the team' } });
  const before = team.members.length;
  team.members = team.members.filter((m: any) => m.user?.id !== req.user.id);
  if (before === team.members.length) return res.status(404).json({ success: false, error: { code: 'NOT_TEAM_MEMBER', message: 'You are not a member of this team' } });
  return res.json({ success: true, data: { message: 'Left team successfully' } });
});

export default router;
