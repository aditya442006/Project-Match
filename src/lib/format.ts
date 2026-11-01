import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export const formatDate = (dateInput?: string | Date | null, formatStr: string = 'MMM d, yyyy'): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return format(date, formatStr);
};

export const timeAgo = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return '';
  return formatDistanceToNow(date, { addSuffix: true });
};

export const getInitials = (name?: string): string => {
  if (!name) return 'PM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatPercent = (value?: number): string => {
  if (value === undefined || value === null) return '0%';
  return `${Math.round(value * 100)}%`;
};
