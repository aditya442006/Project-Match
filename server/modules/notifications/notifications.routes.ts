import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /notifications
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const notifs = db.notifications.filter((n) => n.user_id === req.user.id);
  return res.json({
    success: true,
    data: notifs,
  });
});

// GET /notifications/unread-count
router.get('/unread-count', requireAuth, (req: AuthRequest, res: Response) => {
  const count = db.notifications.filter((n) => n.user_id === req.user.id && !n.is_read).length;
  return res.json({
    success: true,
    data: { count },
  });
});

// PATCH /notifications/:id/read
router.patch('/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.is_read = true;
  }
  return res.json({
    success: true,
    data: notif,
  });
});

// PATCH /notifications/read-all
router.patch('/read-all', requireAuth, (req: AuthRequest, res: Response) => {
  let count = 0;
  db.notifications.forEach((n) => {
    if (n.user_id === req.user.id && !n.is_read) {
      n.is_read = true;
      count++;
    }
  });

  return res.json({
    success: true,
    data: { count },
  });
});

export default router;
