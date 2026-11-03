import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();
const ratingFields = ['teamwork', 'communication', 'skill', 'reliability'] as const;
const teamForProject = (projectId: string) => db.teams.find((t) => t.project_id === projectId);
const teamMember = (team: any, id: string) => !!team && (team.leader_id === id || (team.members || []).some((m: any) => m.user?.id === id));

router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { project_id, ratee_id, comment } = req.body || {};
  if (typeof project_id !== 'string' || typeof ratee_id !== 'string') return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'project_id and ratee_id are required' } });
  if (ratee_id === req.user.id) return res.status(422).json({ success: false, error: { code: 'SELF_RATING', message: 'You cannot rate yourself' } });
  const project = db.projects.find((p) => p.id === project_id);
  const ratee = db.users.find((u) => u.id === ratee_id && u.is_active !== false);
  if (!project || !ratee) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project or user not found' } });
  const team = teamForProject(project_id);
  if (!teamMember(team, req.user.id) || !teamMember(team, ratee_id)) return res.status(403).json({ success: false, error: { code: 'NOT_PROJECT_PARTICIPANT', message: 'Both users must have participated in this project team' } });
  if (project.status !== 'completed') return res.status(409).json({ success: false, error: { code: 'PROJECT_NOT_COMPLETED', message: 'Ratings are available after project completion' } });

  const scores: Record<string, number> = {};
  for (const field of ratingFields) {
    const value = req.body[field];
    if (!Number.isInteger(value) || value < 1 || value > 5) return res.status(422).json({ success: false, error: { code: 'INVALID_RATING', message: `${field} must be an integer from 1 to 5` } });
    scores[field] = value;
  }
  if (comment !== undefined && (typeof comment !== 'string' || comment.length > 1000)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Comment must be text up to 1000 characters' } });
  const existing = db.ratings.find((r) => r.project_id === project_id && r.rater_id === req.user.id && r.ratee_id === ratee_id);
  if (existing) return res.status(409).json({ success: false, error: { code: 'ALREADY_RATED', message: 'You have already rated this teammate for this project' } });

  const rating = { id: `rating-${Date.now()}`, project_id, rater_id: req.user.id, ratee_id, ratee, ...scores, comment: comment?.trim() || '', created_at: new Date().toISOString() };
  db.ratings.push(rating);
  const userRatings = db.ratings.filter((r) => r.ratee_id === ratee_id);
  const average = userRatings.reduce((sum, r) => sum + ratingFields.reduce((s, f) => s + Number(r[f]), 0) / ratingFields.length, 0) / userRatings.length;
  ratee.reputation_avg = Number(average.toFixed(2));
  ratee.reputation_count = userRatings.length;
  return res.status(201).json({ success: true, data: rating });
});

router.get('/users/:userId', (req: Request, res: Response) => {
  const data = db.ratings.filter((r) => r.ratee_id === req.params.userId).map(({ id, project_id, rater_id, ratee_id, teamwork, communication, skill, reliability, comment, created_at }) => ({ id, project_id, rater_id, ratee_id, teamwork, communication, skill, reliability, comment, created_at }));
  return res.json({ success: true, data });
});

router.get('/projects/:projectId', (req: Request, res: Response) => {
  const data = db.ratings.filter((r) => r.project_id === req.params.projectId).map(({ id, project_id, rater_id, ratee_id, teamwork, communication, skill, reliability, comment, created_at }) => ({ id, project_id, rater_id, ratee_id, teamwork, communication, skill, reliability, comment, created_at }));
  return res.json({ success: true, data });
});

router.get('/projects/:projectId/status', requireAuth, (req: AuthRequest, res: Response) => {
  const team = teamForProject(req.params.projectId);
  if (!team) return res.status(404).json({ success: false, error: { code: 'TEAM_NOT_FOUND', message: 'Project team not found' } });
  if (!teamMember(team, req.user.id)) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only project participants can view rating status' } });
  const members = (team.members || []).map((m: any) => m.user).filter((u: any) => u && u.id !== req.user.id);
  const teammates = members.map((user: any) => {
    const rating = db.ratings.find((r) => r.project_id === req.params.projectId && r.rater_id === req.user.id && r.ratee_id === user.id);
    return { user: { id: user.id, name: user.name, avatar_url: user.avatar_url }, has_rated: Boolean(rating), rating: rating || null };
  });
  return res.json({ success: true, data: teammates });
});

export default router;
