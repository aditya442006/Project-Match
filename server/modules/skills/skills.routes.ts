import { Router, Request, Response } from 'express';
import { db } from '../../config/db';

const router = Router();

// GET /skills
router.get('/', (req: Request, res: Response) => {
  const { q, category } = req.query as Record<string, string>;
  let results = db.skills.filter((s) => s.is_active !== false);

  if (q) {
    const query = q.toLowerCase();
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.aliases?.some((a: string) => a.toLowerCase().includes(query))
    );
  }

  if (category) {
    results = results.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  }

  return res.json({
    success: true,
    data: results,
  });
});

// GET /skills/categories
router.get('/categories', (_req: Request, res: Response) => {
  const categories = Array.from(new Set(db.skills.map((s) => s.category)));
  return res.json({
    success: true,
    data: categories,
  });
});

// GET /skills/:id
router.get('/:id', (req: Request, res: Response) => {
  const skill = db.skills.find((s) => s.id === req.params.id);
  if (!skill) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Skill not found' } });
  }
  return res.json({
    success: true,
    data: skill,
  });
});

export default router;
