export const PROJECT_TYPES = [
  { value: 'project', label: 'Academic / Personal Project' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'internship', label: 'Student Internship' },
  { value: 'competition', label: 'Competition' },
] as const;

export const PROJECT_STATUSES = [
  { value: 'open', label: 'Open for applications', color: 'emerald' },
  { value: 'in_progress', label: 'In Progress', color: 'indigo' },
  { value: 'completed', label: 'Completed', color: 'blue' },
  { value: 'closed', label: 'Closed', color: 'slate' },
  { value: 'flagged', label: 'Flagged', color: 'rose' },
] as const;

export const PROJECT_MODES = [
  { value: 'online', label: 'Online / Remote' },
  { value: 'offline', label: 'In-Person' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'slate' },
  { value: 'in_progress', label: 'In Progress', color: 'indigo' },
  { value: 'review', label: 'In Review', color: 'amber' },
  { value: 'done', label: 'Done', color: 'emerald' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'slate' },
  { value: 'medium', label: 'Medium', color: 'amber' },
  { value: 'high', label: 'High', color: 'rose' },
] as const;

export const LOOKING_FOR_OPTIONS = [
  { value: 'hackathon', label: 'Hackathons' },
  { value: 'project', label: 'Side Projects' },
  { value: 'internship', label: 'Internships' },
  { value: 'competition', label: 'Competitions' },
] as const;

export const TIME_SLOTS = [
  'Weekday Mornings',
  'Weekday Afternoons',
  'Weekday Evenings',
  'Weekend Mornings',
  'Weekend Afternoons',
  'Weekend Evenings',
] as const;
