import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// POST /ratings
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { project_id, ratee_id, teamwork, communication, skill, reliability, comment } = req.body;

  const project = db.projects.find((p) => p.id === project_id);
  const ratee = db.users.find((u) => u.id === ratee_id);

  if (!project || !ratee) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Project or ratee student not found' },
    });
  }

  // Check unique per (project, rater, ratee)
  const existing = db.ratings.find(
    (r) => r.project_id === project_id && r.rater_id === req.user.id && r.ratee_id === ratee_id
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: 'ALREADY_RATED', message: 'You have already rated this teammate for this project' },
    });
  }

  const newRating = {
    id: `rating-${Date.now()}`,
    project_id,
    rater_id: req.user.id,
    ratee_id,
    ratee,
    teamwork: Number(teamwork) || 5,
    communication: Number(communication) || 5,
    skill: Number(skill) || 5,
    reliability: Number(reliability) || 5,
    comment: comment || '',
    created_at: new Date().toISOString(),
  };

  db.ratings.push(newRating);

  // Recalculate ratee reputation
  const userRatings = db.ratings.filter((r) => r.ratee_id === ratee_id);
  const avg =
    userRatings.reduce((sum, r) => sum + (r.teamwork + r.communication + r.skill + r.reliability) / 4, 0) /
    userRatings.length;

  ratee.reputation_avg = Number(avg.toFixed(1));
  ratee.reputation_count = userRatings.length;

  return res.status(201).json({
    success: true,
    data: newRating,
  });
});

// GET /ratings/users/:userId
router.get('/users/:userId', (req: Request, res: Response) => {
  const userRatings = db.ratings.filter((r) => r.ratee_id === req.params.userId);
  return res.json({
    success: true,
    data: userRatings,
  });
});

// GET /ratings/projects/:projectId
router.get('/projects/:projectId', (req: Request, res: Response) => {
  const projRatings = db.ratings.filter((r) => r.project_id === req.params.projectId);
  return res.json({
    success: true,
    data: projRatings,
  });
});

// GET /ratings/projects/:projectId/status
router.get('/projects/:projectId/status', requireAuth, (req: AuthRequest, res: Response) => {
  const team = db.teams.find((t) => t.project_id === req.params.projectId);
  const teammates = (team?.members || [])
    .filter((m: any) => m.user?.id !== req.user.id)
    .map((m: any) => {
      const existingRating = db.ratings.find(
        (r) => r.project_id === req.params.projectId && r.rater_id === req.user.id && r.ratee_id === m.user?.id
      );
      return {
        user: m.user,
        has_rated: Boolean(existingRating),
        rating: existingRating,
      };
    });

  return res.json({
    success: true,
    data: teammates,
  });
});

export default router;
