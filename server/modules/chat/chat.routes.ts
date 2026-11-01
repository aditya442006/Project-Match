import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

const router = Router();

// GET /conversations
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const convos = db.conversations.filter(
    (c) => c.participants.some((p: any) => p.id === req.user.id)
  );

  return res.json({
    success: true,
    data: convos,
  });
});

// POST /conversations
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { user_id } = req.body;
  const target = db.users.find((u) => u.id === user_id);

  if (!target) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Target user not found' } });
  }

  const existing = db.conversations.find(
    (c) =>
      c.type === 'direct' &&
      c.participants.some((p: any) => p.id === req.user.id) &&
      c.participants.some((p: any) => p.id === target.id)
  );

  if (existing) {
    return res.json({ success: true, data: existing });
  }

  const newConvo = {
    id: `conv-direct-${Date.now()}`,
    type: 'direct' as const,
    participants: [req.user, target],
    last_message_at: new Date().toISOString(),
    unread_count: 0,
  };

  db.conversations.unshift(newConvo);

  return res.status(201).json({
    success: true,
    data: newConvo,
  });
});

// GET /conversations/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const convo = db.conversations.find((c) => c.id === req.params.id);
  if (!convo) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
  }

  return res.json({
    success: true,
    data: convo,
  });
});

// GET /conversations/:id/messages
router.get('/:id/messages', requireAuth, (req: AuthRequest, res: Response) => {
  const messages = db.messages
    .filter((m) => m.conversation_id === req.params.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return res.json({
    success: true,
    data: messages,
    meta: {
      next_before: undefined,
    },
  });
});

// POST /conversations/:id/messages
router.post('/:id/messages', requireAuth, (req: AuthRequest, res: Response) => {
  const { text, attachments } = req.body;

  if (!text || !text.trim()) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Message text cannot be empty' },
    });
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    conversation_id: req.params.id,
    sender_id: req.user.id,
    sender: req.user,
    text: text.trim(),
    attachments: attachments || [],
    read_by: [req.user.id],
    created_at: new Date().toISOString(),
    status: 'delivered' as const,
  };

  db.messages.push(newMsg);

  // Update conversation last message
  const convo = db.conversations.find((c) => c.id === req.params.id);
  if (convo) {
    convo.last_message_at = newMsg.created_at;
    convo.last_message = newMsg.text;
  }

  return res.status(201).json({
    success: true,
    data: newMsg,
  });
});

// PATCH /conversations/:id/read
router.patch('/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
  const convo = db.conversations.find((c) => c.id === req.params.id);
  if (convo) {
    convo.unread_count = 0;
  }
  return res.json({
    success: true,
    data: { success: true },
  });
});

// PATCH /messages/:id
router.patch('/messages/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const msg = db.messages.find((m) => m.id === req.params.id);
  if (msg && msg.sender_id === req.user.id) {
    msg.text = req.body.text;
  }
  return res.json({
    success: true,
    data: msg,
  });
});

// DELETE /messages/:id
router.delete('/messages/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const idx = db.messages.findIndex((m) => m.id === req.params.id);
  if (idx !== -1) {
    db.messages.splice(idx, 1);
  }
  return res.json({
    success: true,
    data: { message: 'Message deleted' },
  });
});

export default router;
