
import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

// Router for team-specific tasks
export const teamTasksRouter = Router();

// Router for individual task operations
export const directTasksRouter = Router();

// ======================================
// TEAM TASK ROUTES
// ======================================

// GET /api/v1/teams/:id/tasks
teamTasksRouter.get(
  '/:id/tasks',
  requireAuth,
  (req: AuthRequest, res: Response) => {
    const { status, assignee } = req.query as Record<string, string>;

    let teamTasks = db.tasks.filter(
      (task) => task.team_id === req.params.id
    );

    if (status) {
      teamTasks = teamTasks.filter(
        (task) => task.status === status
      );
    }

    if (assignee === 'me') {
      teamTasks = teamTasks.filter(
        (task) => task.assignee_id === req.user!.id
      );
    }

    return res.status(200).json({
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
  }
);

// POST /api/v1/teams/:id/tasks
teamTasksRouter.post(
  '/:id/tasks',
  requireAuth,
  (req: AuthRequest, res: Response) => {
    const {
      title,
      description,
      assignee_id,
      status,
      priority,
      due_date,
      labels,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Task title is required',
        },
      });
    }

    const assignee = assignee_id
      ? db.users.find((user) => user.id === assignee_id)
      : undefined;

    const newTask = {
      id: `task-${Date.now()}`,
      team_id: req.params.id,
      title: title.trim(),
      description: description || '',
      assignee_id: assignee_id || undefined,
      assignee: assignee || undefined,
      created_by: req.user!.id,
      status: status || 'todo',
      priority: priority || 'medium',
      due_date: due_date || undefined,
      labels: Array.isArray(labels) ? labels : [],
      comments: [] as Array<{
        id: string;
        user: typeof req.user;
        text: string;
        created_at: string;
      }>,
      position: 0,
      created_at: new Date().toISOString(),
    };

    db.tasks.unshift(newTask);

    return res.status(201).json({
      success: true,
      data: newTask,
    });
  }
);

// PATCH /api/v1/teams/:id/tasks/reorder
teamTasksRouter.patch(
  '/:id/tasks/reorder',
  requireAuth,
  (req: AuthRequest, res: Response) => {
    const { items } = req.body as {
      items: Array<{
        id: string;
        status: string;
        position: number;
      }>;
    };

    if (!Array.isArray(items)) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A valid items array is required',
        },
      });
    }

    items.forEach((item) => {
      const task = db.tasks.find(
        (task) =>
          task.id === item.id &&
          task.team_id === req.params.id
      );

      if (task) {
        task.status = item.status;
        task.position = item.position;
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        success: true,
      },
    });
  }
);

// ======================================
// DIRECT TASK ROUTES
// ======================================

// GET /api/v1/tasks/:taskId
directTasksRouter.get(
  '/:taskId',
  requireAuth,
  (req: AuthRequest, res: Response) => {
    const task = db.tasks.find(
      (task) => task.id === req.params.taskId
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  }
);

// PATCH /api/v1/tasks/:taskId
directTasksRouter.patch(
  '/:taskId',
  requireAuth,
  (req: AuthRequest, res: Response) => {
    const task = db.tasks.find(
      (task) => task.id === req.params.taskId
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    Object.assign(task, req.body, {
      id: task.id,
      team_id: task.team_id,
    });

    return res.status(200).json({
      success: true,
      data: task,
    });
  }
);

// DELETE /api/v1/tasks/:taskId
directTasksRouter.delete(
  '/:taskId',
  requireAuth,
  (req: AuthRequest, res: Response) => {
    const index = db.tasks.findIndex(
      (task) => task.id === req.params.taskId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    db.tasks.splice(index, 1);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Task deleted',
      },
    });
  }
);

// POST /api/v1/tasks/:taskId/comments
directTasksRouter.post(
  '/:taskId/comments',
  requireAuth,
  (req: AuthRequest, res: Response) => {
    const task = db.tasks.find(
      (task) => task.id === req.params.taskId
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Comment text is required',
        },
      });
    }

    const comment = {
      id: `comm-${Date.now()}`,
      user: req.user,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };

    task.comments = task.comments || [];
    task.comments.push(comment);

    return res.status(201).json({
      success: true,
      data: comment,
    });
  }
);
