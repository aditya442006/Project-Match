
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { db } from '../config/db';
import { persistDatabase } from '../config/persistence';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function initSockets(httpServer: any) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Verify Socket.IO connections using Supabase Auth.
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return next(new Error('Invalid authentication token'));
      }

      (socket as any).userId = data.user.id;
      next();
    } catch {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;

    socket.join(`user:${userId}`);

    io.emit('presence:update', {
      userId,
      online: true,
    });

    socket.on('chat:join', (conversationId: string, ack?: (res: any) => void) => {
      socket.join(`conversation:${conversationId}`);
      if (ack) ack({ ok: true });
    });

    socket.on('chat:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('chat:message', async ({ conversationId, text, attachments }: any, ack?: (res: any) => void) => {
      if (!text || !text.trim() || text.length > 2000) {
        if (ack) ack({ error: 'INVALID' });
        return;
      }

      const sender = db.users.find((u) => u.id === userId);

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

      try {
        await persistDatabase();
      } catch (error) {
        console.error('[Socket Message Persistence Error]:', error);
        if (ack) ack({ error: 'PERSISTENCE_FAILED' });
        return;
      }

      io.to(`conversation:${conversationId}`).emit(
        'chat:message',
        newMsg
      );

      if (ack) ack({ ok: true, id: newMsg.id });
    });

    socket.on('chat:typing', ({ conversationId, isTyping }: any) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        userId,
        conversationId,
        isTyping,
      });
    });

    socket.on('chat:read', ({ conversationId }: any) => {
      socket.to(`conversation:${conversationId}`).emit('chat:read', {
        userId,
        conversationId,
      });
    });

    socket.on('task:join', (teamId: string) => {
      socket.join(`team:${teamId}`);
    });

    socket.on('task:move', async ({ taskId, status, position }: any) => {
      const task = db.tasks.find((t) => t.id === taskId);

      if (task) {
        task.status = status;
        task.position = position;

        try {
          await persistDatabase();
        } catch (error) {
          console.error('[Socket Task Persistence Error]:', error);
          socket.emit('task:error', {
            code: 'PERSISTENCE_FAILED',
            message: 'Unable to save the task update. Please retry.',
          });
          return;
        }

        io.to(`team:${task.team_id}`).emit('task:moved', task);
      }
    });

    socket.on('disconnect', () => {
      io.emit('presence:update', {
        userId,
        online: false,
      });
    });
  });

  return io;
}
