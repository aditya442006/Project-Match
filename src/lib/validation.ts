import { z } from 'zod';
import type { UseFormSetError } from 'react-hook-form';
import type { NormalizedError } from '@/types';

export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name must be 80 characters or fewer'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordRegex, 'Password must contain at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    college: z.string().trim().optional(),
    branch: z.string().trim().optional(),
    year: z.coerce.number().int().min(1, 'Year must be between 1 and 6').max(6, 'Year must be between 1 and 6').optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordRegex, 'Password must contain at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(passwordRegex, 'Password must contain at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const projectSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(160, 'Title must be 160 characters or fewer'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['project', 'hackathon', 'internship', 'competition']),
  mode: z.enum(['online', 'offline', 'hybrid']),
  tags: z.array(z.string()).default([]),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  team_size_min: z.coerce.number().min(1, 'Min team size must be at least 1'),
  team_size_max: z.coerce.number().min(1, 'Max team size must be at least 1'),
  roles: z
    .array(
      z.object({
        role: z.string().trim().min(1, 'Role name is required'),
        slots: z.coerce.number().min(1, 'At least 1 slot is required'),
        skills: z.array(z.any()).default([]),
      })
    )
    .max(15, 'Maximum 15 roles allowed'),
  required_skills: z.array(z.any()).default([]),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'Task title must be at least 2 characters').max(200),
  description: z.string().trim().optional(),
  assignee_id: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const ratingSchema = z.object({
  teamwork: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  skill: z.number().int().min(1).max(5),
  reliability: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type RatingFormData = z.infer<typeof ratingSchema>;

/**
 * Maps server-side 422 validation errors to react-hook-form field errors
 */
// eslint-disable-next-line @any
export const mapServerErrorsToForm = <T extends Record<string, unknown>>(
  error: NormalizedError,
  setError: UseFormSetError<T>
) => {
  if (error.status === 422 && error.details?.body && Array.isArray(error.details.body)) {
    error.details.body.forEach((item) => {
      const fieldPath = item.path.join('.') as unknown as Parameters<typeof setError>[0];
      if (fieldPath) {
        setError(fieldPath, {
          type: 'server',
          message: item.message,
        });
      }
    });
  }
};
