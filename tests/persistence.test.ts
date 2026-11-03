import { afterEach, describe, expect, it, vi } from 'vitest';

import { db } from '../server/config/db';
import {
  initializeDatabase,
  persistDatabase,
} from '../server/config/persistence';

describe('Supabase application persistence', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('hydrates empty storage, writes changes, and removes deleted records', async () => {
    vi.stubEnv('SUPABASE_URL', 'https://project.supabase.co');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'test-server-secret');

    const requests: Array<{
      method: string;
      url: string;
      body?: unknown;
    }> = [];
    const storedRecords = new Map<
      string,
      { collection: string; record_id: string; data: Record<string, unknown> }
    >();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const method = init?.method || 'GET';
        const url = String(input);
        const body =
          typeof init?.body === 'string'
            ? JSON.parse(init.body)
            : undefined;
        requests.push({ method, url, body });

        if (method === 'GET') {
          return new Response(JSON.stringify([...storedRecords.values()]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (method === 'POST' && Array.isArray(body)) {
          for (const record of body) {
            storedRecords.set(
              `${record.collection}:${record.record_id}`,
              record
            );
          }
        }

        if (method === 'DELETE') {
          const collection = new URL(url).searchParams
            .get('collection')
            ?.replace(/^eq\./, '');

          for (const [key, record] of storedRecords) {
            if (
              record.collection === collection &&
              url.includes(record.record_id)
            ) {
              storedRecords.delete(key);
            }
          }
        }

        return new Response(null, { status: 204 });
      })
    );

    await initializeDatabase();

    expect(db.projects.length).toBeGreaterThan(0);
    const initialWrites = requests.filter(
      (request) => request.method === 'POST'
    );
    expect(initialWrites.length).toBeGreaterThan(0);
    expect(JSON.stringify(initialWrites)).not.toContain('passwordHash');

    const project = {
      id: 'persistence-test-project',
      title: 'Persistence test',
    };
    db.projects.push(project);
    await persistDatabase();

    expect(
      requests.some(
        (request) =>
          request.method === 'POST' &&
          JSON.stringify(request.body).includes(project.id)
      )
    ).toBe(true);

    vi.resetModules();
    const [{ db: reloadedDb }, { initializeDatabase: reloadDatabase, persistDatabase: persistReloadedDb }] =
      await Promise.all([
        import('../server/config/db'),
        import('../server/config/persistence'),
      ]);
    await reloadDatabase();

    expect(
      reloadedDb.projects.some((item) => item.id === project.id)
    ).toBe(true);
    reloadedDb.projects = reloadedDb.projects.filter(
      (item) => item.id !== project.id
    );
    await persistReloadedDb();

    expect(
      requests.some(
        (request) =>
          request.method === 'DELETE' &&
          request.url.includes('persistence-test-project')
      )
    ).toBe(true);
  });
});
