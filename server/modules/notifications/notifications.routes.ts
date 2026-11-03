import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({ success: true, data: db.notifications.filter((n) => n.user_id === req.user.id) });
});

router.get('/unread-count', requireAuth, (req: AuthRequest, res: Response) => {
  const count = db.notifications.filter((n) => n.user_id === req.user.id && !n.is_read).length;
  return res.json({ success: true, data: { count } });
});

// Scope by BOTH resource ID and authenticated owner.
router.patch('/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
  const notification = db.notifications.find((n) => n.id === req.params.id && n.user_id === req.user.id);
  if (!notification) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
  notification.is_read = true;
  return res.json({ success: true, data: notification });
});

router.patch('/read-all', requireAuth, (req: AuthRequest, res: Response) => {
  let count = 0;
  db.notifications.forEach((n) => {
    if (n.user_id === req.user.id && !n.is_read) { n.is_read = true; count += 1; }
  });
  return res.json({ success: true, data: { count } });
});

export default router;
