import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();
const normalize = (value: unknown) => String(value || '').trim().toLowerCase();
const skillsOf = (user: any): string[] => (user?.skills || []).map((s: any) => normalize(s.name || s.skill?.name)).filter(Boolean);
const unique = (items: string[]) => [...new Set(items)];
const ratio = (a: string[], b: string[]) => a.length ? a.filter((x) => b.includes(x)).length / a.length : 0;
const boundedLimit = (value: unknown, fallback: number, max = 50) => Math.max(1, Math.min(max, Number.parseInt(String(value), 10) || fallback));

// Scores are deterministic rule-based estimates, not semantic/LLM scores.
const teammateScore = (candidate: any, seeker: any) => {
  const candidateSkills = unique(skillsOf(candidate));
  const seekerSkills = unique(skillsOf(seeker));
  const matched = candidateSkills.filter((s) => seekerSkills.includes(s));
  const complementary = candidateSkills.filter((s) => !seekerSkills.includes(s));
  const skillSimilarity = seekerSkills.length ? matched.length / seekerSkills.length : 0;
  const complementarity = candidateSkills.length ? complementary.length / candidateSkills.length : 0;
  const candidateHours = Number(candidate.availability?.hours_per_week);
  const seekerHours = Number(seeker?.availability?.hours_per_week);
  const availability = candidateHours > 0 && seekerHours > 0 ? Math.min(candidateHours, seekerHours) / Math.max(candidateHours, seekerHours) : 0;
  const candidateInterests = unique((candidate.interests || []).map(normalize).filter(Boolean));
  const seekerInterests = unique((seeker?.interests || []).map(normalize).filter(Boolean));
  const interest = candidateInterests.length ? ratio(candidateInterests, seekerInterests) : 0;
  const reputation = Number.isFinite(Number(candidate.reputation_avg)) && Number(candidate.reputation_count) > 0 ? Math.max(0, Math.min(1, Number(candidate.reputation_avg) / 5)) : 0;
  const score = 0.35 * skillSimilarity + 0.30 * complementarity + 0.15 * availability + 0.10 * interest + 0.10 * reputation;
  const features = { skill_similarity: +skillSimilarity.toFixed(2), complementarity: +complementarity.toFixed(2), availability: +availability.toFixed(2), interest_overlap: +interest.toFixed(2), reputation: +reputation.toFixed(2) };
  const reasons: string[] = [];
  if (matched.length) reasons.push(`Shares ${matched.slice(0, 4).join(', ')} skills`);
  if (complementary.length) reasons.push(`Adds complementary ${complementary.slice(0, 4).join(', ')} skills`);
  if (availability > 0) reasons.push(`Availability overlap is ${(availability * 100).toFixed(0)}%`);
  if (interest > 0) reasons.push(`Has overlapping interests`);
  return { score: +score.toFixed(4), features, matched_skills: matched, complementary_skills: complementary, explanation: { reason: reasons.length ? reasons.join('. ') + '.' : 'Not enough profile information to explain this match yet.', suggestedRole: complementary[0] ? `${complementary[0]} Contributor` : matched[0] ? `${matched[0]} Contributor` : 'Collaborator', source: 'rules' as const } };
};

const projectScore = (candidate: any, project: any) => {
  const candidateSkills = unique(skillsOf(candidate));
  const required = unique((project.required_skills || []).map(normalize).filter(Boolean));
  const matched = required.filter((s) => candidateSkills.includes(s));
  const missing = required.filter((s) => !candidateSkills.includes(s));
  const coverage = required.length ? matched.length / required.length : 0;
  const interests = unique((candidate.interests || []).map(normalize).filter(Boolean));
  const tags = unique([...(project.tags || []), project.type].map(normalize).filter(Boolean));
  const interest = tags.length ? ratio(tags, interests) : 0;
  const reputation = Number(candidate.reputation_count) > 0 ? Math.max(0, Math.min(1, Number(candidate.reputation_avg || 0) / 5)) : 0;
  const score = 0.75 * coverage + 0.15 * interest + 0.10 * reputation;
  const reasons: string[] = [];
  if (matched.length) reasons.push(`Matches required skills: ${matched.slice(0, 5).join(', ')}`);
  if (missing.length) reasons.push(`Skills still missing: ${missing.slice(0, 5).join(', ')}`);
  if (interest > 0) reasons.push('Profile interests overlap with project tags/type');
  return { score: +score.toFixed(4), features: { required_skill_coverage: +coverage.toFixed(2), interest_overlap: +interest.toFixed(2), reputation: +reputation.toFixed(2) }, matched_skills: matched, missing_skills: missing, explanation: { reason: reasons.length ? reasons.join('. ') + '.' : 'The candidate profile does not contain enough matching information yet.', suggestedRole: project.roles?.find((r: any) => (r.skills || []).some((s: string) => candidateSkills.includes(normalize(s))))?.role || 'Team Member', source: 'rules' as const } };
};

router.get('/teammates', requireAuth, (req: AuthRequest, res: Response) => {
  const limit = boundedLimit(req.query.limit, 10);
  const candidates = db.users.filter((u) => u.id !== req.user.id && u.is_active !== false);
  const ranked = candidates.map((user) => ({ user: { id: user.id, name: user.name, college: user.college, branch: user.branch, year: user.year, avatar_url: user.avatar_url, skills: user.skills, interests: user.interests, reputation_avg: user.reputation_avg, reputation_count: user.reputation_count }, ...teammateScore(user, req.user) })).sort((a, b) => b.score - a.score);
  return res.json({ success: true, data: ranked.slice(0, limit) });
});

router.get('/projects/:id/candidates', requireAuth, (req: AuthRequest, res: Response) => {
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  if (project.owner?.id !== req.user.id) {
    const team = db.teams.find((t) => t.project_id === project.id);
    if (team?.leader_id !== req.user.id) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the project owner or team leader can view candidate recommendations' } });
  }
  const limit = boundedLimit(req.query.limit, 10);
  const ranked = db.users.filter((u) => u.id !== req.user.id && u.is_active !== false).map((user) => ({ user: { id: user.id, name: user.name, college: user.college, branch: user.branch, year: user.year, avatar_url: user.avatar_url, skills: user.skills, interests: user.interests, reputation_avg: user.reputation_avg, reputation_count: user.reputation_count }, ...projectScore(user, project) })).sort((a, b) => b.score - a.score);
  return res.json({ success: true, data: ranked.slice(0, limit) });
});

router.get('/projects', requireAuth, (req: AuthRequest, res: Response) => {
  const limit = boundedLimit(req.query.limit, 6, 30);
  const projects = db.projects.filter((p) => p.status === 'open' && p.owner?.id !== req.user.id).slice(0, limit);
  return res.json({ success: true, data: projects });
});

router.post('/feedback', requireAuth, (req: AuthRequest, res: Response) => {
  // Do not claim to persist feedback until a feedback table is implemented.
  return res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Matching feedback storage is not configured yet' } });
});

export default router;
