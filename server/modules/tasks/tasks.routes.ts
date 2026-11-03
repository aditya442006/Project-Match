import { Router, Response } from 'express';
import { db } from '../../config/db';
import { requireAuth, AuthRequest } from '../../middleware/auth';

export const teamTasksRouter = Router();
export const directTasksRouter = Router();
const statuses = ['todo', 'in_progress', 'review', 'done'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const getTeam = (teamId: string) => db.teams.find((t) => t.id === teamId);
const isMember = (team: any, userId: string) => !!team && (team.leader_id === userId || (team.members || []).some((m: any) => m.user?.id === userId));
const isLeader = (team: any, userId: string) => {
  const project = db.projects.find((p) => p.id === team?.project_id);
  return !!team && (team.leader_id === userId || project?.owner?.id === userId);
};
const taskError = (res: Response, status: number, code: string, message: string) => res.status(status).json({ success: false, error: { code, message } });
const findTask = (id: string) => db.tasks.find((t) => t.id === id);
const canEditTask = (task: any, userId: string) => {
  const team = getTeam(task.team_id);
  return isLeader(team, userId) || task.created_by === userId;
};

// Team task listing is restricted to team members.
teamTasksRouter.get('/:id/tasks', requireAuth, (req: AuthRequest, res: Response) => {
  const team = getTeam(req.params.id);
  if (!team) return taskError(res, 404, 'TEAM_NOT_FOUND', 'Team not found');
  if (!isMember(team, req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'You are not a member of this team');
  const { status, assignee } = req.query as Record<string, string>;
  if (status && !statuses.includes(status)) return taskError(res, 422, 'VALIDATION_ERROR', 'Invalid task status');
  let tasks = db.tasks.filter((t) => t.team_id === team.id);
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (assignee === 'me') tasks = tasks.filter((t) => t.assignee_id === req.user.id);
  return res.json({ success: true, data: tasks, meta: { columns: { todo: 'To Do', in_progress: 'In Progress', review: 'In Review', done: 'Done' } } });
});

teamTasksRouter.post('/:id/tasks', requireAuth, (req: AuthRequest, res: Response) => {
  const team = getTeam(req.params.id);
  if (!team) return taskError(res, 404, 'TEAM_NOT_FOUND', 'Team not found');
  if (!isMember(team, req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'Only team members can create tasks');
  const { title, description = '', assignee_id, status = 'todo', priority = 'medium', due_date, labels = [] } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 160) return taskError(res, 422, 'VALIDATION_ERROR', 'Title must be 1–160 characters');
  if (!statuses.includes(status)) return taskError(res, 422, 'VALIDATION_ERROR', 'Invalid task status');
  if (!priorities.includes(priority)) return taskError(res, 422, 'VALIDATION_ERROR', 'Invalid task priority');
  if (!Array.isArray(labels) || labels.some((x: unknown) => typeof x !== 'string')) return taskError(res, 422, 'VALIDATION_ERROR', 'Labels must be an array of strings');
  const assignee = assignee_id ? db.users.find((u) => u.id === assignee_id) : undefined;
  if (assignee_id && (!assignee || !isMember(team, assignee_id))) return taskError(res, 422, 'INVALID_ASSIGNEE', 'Assignee must be an existing team member');
  const task = { id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, team_id: team.id, title: title.trim(), description: typeof description === 'string' ? description : '', assignee_id: assignee_id || undefined, assignee, created_by: req.user.id, status, priority, due_date: due_date || undefined, labels, comments: [] as any[], position: 0, created_at: new Date().toISOString() };
  db.tasks.unshift(task);
  return res.status(201).json({ success: true, data: task });
});

teamTasksRouter.patch('/:id/tasks/reorder', requireAuth, (req: AuthRequest, res: Response) => {
  const team = getTeam(req.params.id);
  if (!team) return taskError(res, 404, 'TEAM_NOT_FOUND', 'Team not found');
  if (!isLeader(team, req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'Only the team leader or project owner can reorder tasks');
  const items = req.body?.items;
  if (!Array.isArray(items) || items.length > 200) return taskError(res, 422, 'VALIDATION_ERROR', 'A valid items array is required (maximum 200)');
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !statuses.includes(item.status) || !Number.isInteger(item.position) || item.position < 0) return taskError(res, 422, 'VALIDATION_ERROR', 'Each item needs a valid id, status and non-negative position');
    const task = db.tasks.find((t) => t.id === item.id && t.team_id === team.id);
    if (!task) return taskError(res, 404, 'TASK_NOT_FOUND', `Task ${item.id} was not found in this team`);
  }
  items.forEach((item: any) => { const task = db.tasks.find((t) => t.id === item.id && t.team_id === team.id)!; task.status = item.status; task.position = item.position; });
  return res.json({ success: true, data: { success: true } });
});

directTasksRouter.get('/:taskId', requireAuth, (req: AuthRequest, res: Response) => {
  const task = findTask(req.params.taskId);
  if (!task) return taskError(res, 404, 'NOT_FOUND', 'Task not found');
  if (!isMember(getTeam(task.team_id), req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'You are not a member of this task team');
  return res.json({ success: true, data: task });
});

directTasksRouter.patch('/:taskId', requireAuth, (req: AuthRequest, res: Response) => {
  const task = findTask(req.params.taskId);
  if (!task) return taskError(res, 404, 'NOT_FOUND', 'Task not found');
  const team = getTeam(task.team_id);
  if (!isMember(team, req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'You are not a member of this task team');
  const body = req.body || {};
  const allowed = new Set(['title', 'description', 'assignee_id', 'status', 'priority', 'due_date', 'labels', 'position']);
  if (Object.keys(body).some((key) => !allowed.has(key))) return taskError(res, 422, 'VALIDATION_ERROR', 'One or more fields cannot be updated');
  const editing = Object.keys(body).some((key) => key !== 'status');
  if (editing && !canEditTask(task, req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'Only the task creator, team leader or project owner can edit task details');
  if (body.status !== undefined && !statuses.includes(body.status)) return taskError(res, 422, 'VALIDATION_ERROR', 'Invalid task status');
  if (body.priority !== undefined && !priorities.includes(body.priority)) return taskError(res, 422, 'VALIDATION_ERROR', 'Invalid task priority');
  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 160)) return taskError(res, 422, 'VALIDATION_ERROR', 'Invalid task title');
  if (body.assignee_id !== undefined) {
    const assignee = body.assignee_id ? db.users.find((u) => u.id === body.assignee_id) : undefined;
    if (body.assignee_id && (!assignee || !isMember(team, body.assignee_id))) return taskError(res, 422, 'INVALID_ASSIGNEE', 'Assignee must be a team member');
    task.assignee_id = body.assignee_id || undefined; task.assignee = assignee;
  }
  if (body.title !== undefined) task.title = body.title.trim();
  if (body.description !== undefined) { if (typeof body.description !== 'string') return taskError(res, 422, 'VALIDATION_ERROR', 'Description must be text'); task.description = body.description; }
  if (body.status !== undefined) task.status = body.status;
  if (body.priority !== undefined) task.priority = body.priority;
  if (body.due_date !== undefined) task.due_date = body.due_date || undefined;
  if (body.labels !== undefined) { if (!Array.isArray(body.labels) || body.labels.some((x: unknown) => typeof x !== 'string')) return taskError(res, 422, 'VALIDATION_ERROR', 'Labels must be strings'); task.labels = body.labels; }
  if (body.position !== undefined) { if (!Number.isInteger(body.position) || body.position < 0 || !isLeader(team, req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'Only leaders can set task position'); task.position = body.position; }
  return res.json({ success: true, data: task });
});

directTasksRouter.delete('/:taskId', requireAuth, (req: AuthRequest, res: Response) => {
  const index = db.tasks.findIndex((t) => t.id === req.params.taskId);
  if (index < 0) return taskError(res, 404, 'NOT_FOUND', 'Task not found');
  const task = db.tasks[index];
  if (!isMember(getTeam(task.team_id), req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'You are not a member of this task team');
  if (!canEditTask(task, req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'Only the task creator, team leader or project owner can delete this task');
  db.tasks.splice(index, 1);
  return res.json({ success: true, data: { message: 'Task deleted' } });
});

directTasksRouter.post('/:taskId/comments', requireAuth, (req: AuthRequest, res: Response) => {
  const task = findTask(req.params.taskId);
  if (!task) return taskError(res, 404, 'NOT_FOUND', 'Task not found');
  if (!isMember(getTeam(task.team_id), req.user.id)) return taskError(res, 403, 'FORBIDDEN', 'Only team members can comment');
  const text = req.body?.text;
  if (typeof text !== 'string' || !text.trim() || text.trim().length > 2000) return taskError(res, 422, 'VALIDATION_ERROR', 'Comment must be 1–2000 characters');
  const comment = { id: `comm-${Date.now()}`, user: req.user, text: text.trim(), created_at: new Date().toISOString() };
  task.comments = task.comments || [];
  task.comments.push(comment);
  return res.status(201).json({ success: true, data: comment });
});
