import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /users/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: req.user,
  });
});

// PATCH /users/me
router.patch('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const index = db.users.findIndex((u) => u.id === req.user.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  // Update allowed fields
  const updatedUser = {
    ...db.users[index],
    ...req.body,
    id: db.users[index].id, // Prevent id modification
    email: db.users[index].email, // Prevent email overwrite
    role: db.users[index].role, // Prevent role escalation
  };

  db.users[index] = updatedUser;

  return res.json({
    success: true,
    data: updatedUser,
  });
});

// PATCH /users/me/avatar
router.patch('/me/avatar', requireAuth, (req: AuthRequest, res: Response) => {
  const { avatar_url } = req.body;
  const user = db.users.find((u) => u.id === req.user.id);
  if (user) {
    user.avatar_url = avatar_url;
  }

  return res.json({
    success: true,
    data: { avatar_url },
  });
});

// DELETE /users/me
router.delete('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (user) {
    user.is_active = false;
  }
  return res.json({
    success: true,
    data: { message: 'Account deactivated' },
  });
});

// GET /users/:id
router.get('/:id', (req: Request, res: Response) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  }

  return res.json({
    success: true,
    data: {
      ...user,
      ratings_recent: db.ratings.filter((r) => r.ratee_id === user.id),
    },
  });
});

// GET /users
router.get('/', (req: Request, res: Response) => {
  const { q, college, branch, year } = req.query as Record<string, string>;
  let results = db.users.filter((u) => u.is_active !== false);

  if (q) {
    const query = q.toLowerCase();
    results = results.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.college?.toLowerCase().includes(query) ||
        u.skills?.some((s: any) => s.name?.toLowerCase().includes(query))
    );
  }

  if (college) {
    results = results.filter((u) => u.college?.toLowerCase().includes(college.toLowerCase()));
  }

  if (branch) {
    results = results.filter((u) => u.branch?.toLowerCase().includes(branch.toLowerCase()));
  }

  if (year) {
    results = results.filter((u) => String(u.year) === String(year));
  }

  return res.json({
    success: true,
    data: results,
    meta: {
      total: results.length,
      page: 1,
      limit: results.length,
    },
  });
});

export default router;
