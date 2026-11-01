import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, projectSchema } from '../src/lib/validation';

describe('Zod Validation Schemas', () => {
  it('validates registration schema with password rules', () => {
    const invalidShortPassword = {
      name: 'Bob',
      email: 'bob@college.edu',
      password: 'short',
      confirmPassword: 'short',
    };
    expect(registerSchema.safeParse(invalidShortPassword).success).toBe(false);

    const validUser = {
      name: 'Bob Jones',
      email: 'bob@college.edu',
      password: 'Password123',
      confirmPassword: 'Password123',
      year: 2,
    };
    expect(registerSchema.safeParse(validUser).success).toBe(true);
  });

  it('ensures passwords match on registration', () => {
    const mismatched = {
      name: 'Bob Jones',
      email: 'bob@college.edu',
      password: 'Password123',
      confirmPassword: 'Password999',
    };
    expect(registerSchema.safeParse(mismatched).success).toBe(false);
  });

  it('validates login schema', () => {
    expect(loginSchema.safeParse({ email: 'bad-email', password: '123' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'valid@edu.com', password: '123' }).success).toBe(true);
  });

  it('validates project schema role constraints', () => {
    const validProject = {
      title: 'Real-time Autonomous Quadcopter',
      description: 'Building an autonomous indoor drone navigating with ROS2 and computer vision.',
      type: 'project',
      mode: 'hybrid',
      tags: ['ROS2', 'Python', 'Robotics'],
      team_size_min: 2,
      team_size_max: 5,
      roles: [{ role: 'ROS2 Engineer', slots: 1, skills: [] }],
      required_skills: [],
    };
    expect(projectSchema.safeParse(validProject).success).toBe(true);
  });
});
