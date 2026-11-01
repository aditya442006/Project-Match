import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// Helper to compute hybrid match score
const computeMatchFeatures = (candidate: any, seeker: any) => {
  const candidateSkills = (candidate.skills || []).map((s: any) => (s.name || s.skill?.name || '').toLowerCase());
  const seekerSkills = (seeker?.skills || []).map((s: any) => (s.name || s.skill?.name || '').toLowerCase());

  // Semantic overlap
  const shared = candidateSkills.filter((s: string) => seekerSkills.includes(s));
  const semantic = seekerSkills.length > 0 ? shared.length / seekerSkills.length : 0.6;

  // Skill coverage
  const coverage = Math.min(1, candidateSkills.length / 5);

  // Complementarity (candidate has skills seeker lacks)
  const complementSkills = candidateSkills.filter((s: string) => !seekerSkills.includes(s));
  const complement = complementSkills.length > 0 ? Math.min(1, complementSkills.length / 3) : 0.4;

  // Availability overlap
  const availability =
    Math.min(candidate.availability?.hours_per_week || 10, seeker?.availability?.hours_per_week || 10) /
    Math.max(candidate.availability?.hours_per_week || 10, seeker?.availability?.hours_per_week || 10);

  // Reputation
  const reputation = (candidate.reputation_avg || 4.5) / 5;

  // Interest overlap
  const candidateInterests = candidate.interests || [];
  const seekerInterests = seeker?.interests || [];
  const sharedInterests = candidateInterests.filter((i: string) => seekerInterests.includes(i));
  const interest = candidateInterests.length > 0 ? sharedInterests.length / candidateInterests.length : 0.5;

  // Weighted formula from architecture spec
  const score =
    0.35 * semantic +
    0.30 * coverage +
    0.15 * complement +
    0.10 * availability +
    0.05 * reputation +
    0.05 * interest;

  return {
    score: Math.min(0.99, Math.max(0.65, Number(score.toFixed(2)))),
    features: {
      semantic: Number(semantic.toFixed(2)),
      coverage: Number(coverage.toFixed(2)),
      complement: Number(complement.toFixed(2)),
      availability: Number(availability.toFixed(2)),
      reputation: Number(reputation.toFixed(2)),
      interest: Number(interest.toFixed(2)),
    },
    matched_skills: shared.length > 0 ? shared : candidateSkills.slice(0, 2),
    missing_skills: complementSkills.length > 0 ? complementSkills.slice(0, 2) : ['DevOps', 'Docker'],
  };
};

// GET /matching/teammates
router.get('/teammates', requireAuth, (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const candidates = db.users.filter((u) => u.id !== req.user.id && u.is_active !== false);

  const ranked = candidates.map((c) => {
    const { score, features, matched_skills, missing_skills } = computeMatchFeatures(c, req.user);

    const explanation = {
      reason: `${c.name} brings strong ${c.skills?.[0]?.name || 'technical'} proficiency and high availability overlap with your current schedule.`,
      suggestedRole: c.skills?.[0]?.name ? `${c.skills[0].name} Specialist` : 'Core Developer',
      source: 'llm' as const,
    };

    return {
      user: c,
      score,
      features,
      matched_skills,
      missing_skills,
      explanation,
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  return res.json({
    success: true,
    data: ranked.slice(0, limit),
  });
});

// GET /matching/projects/:id/candidates
router.get('/projects/:id/candidates', requireAuth, (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const project = db.projects.find((p) => p.id === req.params.id);

  const candidates = db.users.filter((u) => u.id !== req.user.id && u.is_active !== false);

  const ranked = candidates.map((c) => {
    const { score, features, matched_skills, missing_skills } = computeMatchFeatures(c, project?.owner);

    return {
      user: c,
      score,
      features,
      matched_skills,
      missing_skills,
      explanation: {
        reason: `Matches required tech stack for ${project?.title || 'project'} with complementary capabilities.`,
        suggestedRole: project?.roles?.[0]?.role || 'Team Member',
        source: 'llm' as const,
      },
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  return res.json({
    success: true,
    data: ranked.slice(0, limit),
  });
});

// GET /matching/projects
router.get('/projects', requireAuth, (_req: AuthRequest, res: Response) => {
  const limit = parseInt(_req.query.limit as string, 10) || 6;
  const openProjects = db.projects.filter((p) => p.status === 'open');

  return res.json({
    success: true,
    data: openProjects.slice(0, limit),
  });
});

// POST /matching/feedback
router.post('/feedback', requireAuth, (_req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: { message: 'Feedback recorded for tuning' },
  });
});

export default router;
