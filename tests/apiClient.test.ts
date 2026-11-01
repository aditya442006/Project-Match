import { describe, it, expect } from 'vitest';
import { normalizeError } from '../src/api/client';

describe('apiClient error normalization', () => {
  it('normalizes API envelope error objects into { status, code, message, details }', () => {
    const rawError = {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payload submitted',
            details: {
              body: [{ path: ['name'], message: 'Name must be at least 2 characters' }],
            },
          },
        },
      },
    };

    const normalized = normalizeError(rawError);
    expect(normalized.status).toBe(422);
    expect(normalized.code).toBe('VALIDATION_ERROR');
    expect(normalized.message).toBe('Invalid payload submitted');
    expect(normalized.details?.body?.[0].message).toBe('Name must be at least 2 characters');
  });

  it('handles network failure cleanly without crashing', () => {
    const networkError = {
      isAxiosError: true,
      request: {},
    };

    const normalized = normalizeError(networkError);
    expect(normalized.status).toBe(0);
    expect(normalized.code).toBe('NETWORK_ERROR');
    expect(normalized.message).toContain('connect to the server');
  });
});
