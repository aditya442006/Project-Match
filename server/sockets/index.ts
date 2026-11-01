import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../middleware/auth';
import { db } from '../config/db';

export function initSockets(httpServer: any) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.IO authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Allow fallback in development if no token
      (socket as any).userId = 'user-aditya';
      return next();
    }

    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { sub: string };
      (socket as any).userId = payload.sub;
      next();
    } catch (err) {
      // Accept demo user fallback in dev
      (socket as any).userId = 'user-aditya';
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    socket.join(`user:${userId}`);

    // Broadcast online presence
    io.emit('presence:update', { userId, online: true });

    // Join conversation room
    socket.on('chat:join', (conversationId: string, ack?: (res: any) => void) => {
      socket.join(`conversation:${conversationId}`);
      if (ack) ack({ ok: true });
    });

    // Leave conversation room
    socket.on('chat:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send chat message
    socket.on('chat:message', ({ conversationId, text, attachments }: any, ack?: (res: any) => void) => {
      if (!text || !text.trim() || text.length > 2000) {
        if (ack) ack({ error: 'INVALID' });
        return;
      }

      const sender = db.users.find((u) => u.id === userId) || db.users[0];

      const newMsg = {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: userId,
        sender,
        text: text.trim(),
        attachments: attachments || [],
        read_by: [userId],
        created_at: new Date().toISOString(),
        status: 'delivered' as const,
      };

      db.messages.push(newMsg);

      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('chat:message', newMsg);

      if (ack) ack({ ok: true, id: newMsg.id });
    });

    // Typing indicator
    socket.on('chat:typing', ({ conversationId, isTyping }: any) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        userId,
        conversationId,
        isTyping,
      });
    });

    // Read receipt
    socket.on('chat:read', ({ conversationId }: any) => {
      socket.to(`conversation:${conversationId}`).emit('chat:read', {
        userId,
        conversationId,
      });
    });

    // Join task/team room
    socket.on('task:join', (teamId: string) => {
      socket.join(`team:${teamId}`);
    });

    // Move task
    socket.on('task:move', ({ taskId, status, position }: any) => {
      const task = db.tasks.find((t) => t.id === taskId);
      if (task) {
        task.status = status;
        task.position = position;
        io.to(`team:${task.team_id}`).emit('task:moved', task);
      }
    });

    socket.on('disconnect', () => {
      io.emit('presence:update', { userId, online: false });
    });
  });

  return io;
}
