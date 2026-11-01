import { Router, Request, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

export const teamTasksRouter = Router({ mergeParams: true });
export const directTasksRouter = Router();

// GET /teams/:id/tasks
teamTasksRouter.get('/:id/tasks', requireAuth, (req: AuthRequest, res: Response) => {
  const { status, assignee } = req.query as Record<string, string>;
  let teamTasks = db.tasks.filter((t) => t.team_id === req.params.id);

  if (status) {
    teamTasks = teamTasks.filter((t) => t.status === status);
  }

  if (assignee === 'me') {
    teamTasks = teamTasks.filter((t) => t.assignee_id === req.user.id);
  }

  return res.json({
    success: true,
    data: teamTasks,
    meta: {
      columns: {
        todo: 'To Do',
        in_progress: 'In Progress',
        review: 'In Review',
        done: 'Done',
      },
    },
  });
});

// POST /teams/:id/tasks
teamTasksRouter.post('/:id/tasks', requireAuth, (req: AuthRequest, res: Response) => {
  const { title, description, assignee_id, status, priority, due_date, labels } = req.body;

  if (!title) {
    return res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Task title is required' },
    });
  }

  const assignee = db.users.find((u) => u.id === assignee_id);

  const newTask = {
    id: `task-${Date.now()}`,
    team_id: req.params.id,
    title,
    description: description || '',
    assignee_id: assignee_id || undefined,
    assignee: assignee || undefined,
    created_by: req.user.id,
    status: status || 'todo',
    priority: priority || 'medium',
    due_date: due_date || undefined,
    labels: labels || [],
    comments: [],
    position: 0,
    created_at: new Date().toISOString(),
  };

  db.tasks.unshift(newTask);

  return res.status(201).json({
    success: true,
    data: newTask,
  });
});

// PATCH /teams/:id/tasks/reorder
teamTasksRouter.patch('/:id/tasks/reorder', requireAuth, (req: AuthRequest, res: Response) => {
  const { items } = req.body as { items: Array<{ id: string; status: string; position: number }> };

  if (Array.isArray(items)) {
    items.forEach((item) => {
      const task = db.tasks.find((t) => t.id === item.id);
      if (task) {
        task.status = item.status;
        task.position = item.position;
      }
    });
  }

  return res.json({
    success: true,
    data: { success: true },
  });
});

// GET /tasks/:taskId
directTasksRouter.get('/:taskId', requireAuth, (req: AuthRequest, res: Response) => {
  const task = db.tasks.find((t) => t.id === req.params.taskId);
  if (!task) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
  }

  return res.json({
    success: true,
    data: task,
  });
});

// PATCH /tasks/:taskId
directTasksRouter.patch('/:taskId', requireAuth, (req: AuthRequest, res: Response) => {
  const task = db.tasks.find((t) => t.id === req.params.taskId);
  if (!task) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
  }

  Object.assign(task, req.body, { id: task.id, team_id: task.team_id });

  return res.json({
    success: true,
    data: task,
  });
});

// DELETE /tasks/:taskId
directTasksRouter.delete('/:taskId', requireAuth, (_req: AuthRequest, res: Response) => {
  const index = db.tasks.findIndex((t) => t.id === _req.params.taskId);
  if (index !== -1) {
    db.tasks.splice(index, 1);
  }
  return res.json({
    success: true,
    data: { message: 'Task deleted' },
  });
});

// POST /tasks/:taskId/comments
directTasksRouter.post('/:taskId/comments', requireAuth, (req: AuthRequest, res: Response) => {
  const task = db.tasks.find((t) => t.id === req.params.taskId);
  if (!task) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
  }

  const comment = {
    id: `comm-${Date.now()}`,
    user: req.user,
    text: req.body.text,
    created_at: new Date().toISOString(),
  };

  task.comments = task.comments || [];
  task.comments.push(comment);

  return res.status(201).json({
    success: true,
    data: comment,
  });
});
