import {
  db,
  getSupabaseAdmin,
  type DbStore,
  type SupabaseJson,
} from './db';

const TABLE_NAME = 'project_match_state';
const PAGE_SIZE = 1000;
const WRITE_BATCH_SIZE = 500;

type CollectionName = keyof DbStore;

interface StoredRecord {
  collection: string;
  record_id: string;
  data: Record<string, unknown>;
}

const collections: CollectionName[] = [
  'users',
  'skills',
  'projects',
  'teams',
  'tasks',
  'conversations',
  'messages',
  'requests',
  'notifications',
  'ratings',
  'feedback',
  'auditLogs',
  'reports',
];

let persistedSnapshots = new Map<CollectionName, Map<string, string>>();
let writeQueue: Promise<void> = Promise.resolve();
let initialized = false;

const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) =>
        key === 'passwordHash' ? [] : [[key, sanitize(item)]]
      )
    );
  }

  return value;
};

const snapshotCollection = (
  collection: CollectionName
): Map<string, string> => {
  const snapshot = new Map<string, string>();

  for (const record of db[collection]) {
    if (!record || typeof record.id !== 'string' || !record.id) {
      throw new Error(
        `Cannot persist ${collection}: every record must have a non-empty string id.`
      );
    }

    if (snapshot.has(record.id)) {
      throw new Error(
        `Cannot persist ${collection}: duplicate record id "${record.id}".`
      );
    }

    const serialized = JSON.stringify(sanitize(record));
    if (serialized === undefined) {
      throw new Error(`Cannot serialize a record in ${collection}.`);
    }

    snapshot.set(record.id, serialized);
  }

  return snapshot;
};

const readStoredRecords = async (): Promise<StoredRecord[]> => {
  const client = getSupabaseAdmin();
  const records: StoredRecord[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client
      .from(TABLE_NAME)
      .select('collection,record_id,data')
      .order('collection', { ascending: true })
      .order('record_id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(
        `Unable to load Supabase application data: ${error.message}`
      );
    }

    const page = (data || []) as StoredRecord[];
    records.push(...page);

    if (page.length < PAGE_SIZE) {
      return records;
    }
  }
};

export const initializeDatabase = async (): Promise<void> => {
  const records = await readStoredRecords();
  const grouped = new Map<CollectionName, Record<string, unknown>[]>();

  for (const collection of collections) {
    grouped.set(collection, []);
  }

  for (const record of records) {
    if (!collections.includes(record.collection as CollectionName)) {
      throw new Error(
        `Supabase contains an unknown application data collection: ${record.collection}`
      );
    }

    if (
      !record.data ||
      typeof record.data !== 'object' ||
      Array.isArray(record.data) ||
      record.data.id !== record.record_id
    ) {
      throw new Error(
        `Supabase contains an invalid ${record.collection} record "${record.record_id}".`
      );
    }

    grouped.get(record.collection as CollectionName)!.push(record.data);
  }

  if (records.length === 0) {
    persistedSnapshots = new Map(
      collections.map((collection) => [collection, new Map()])
    );
    initialized = true;
    await persistDatabase();
    return;
  }

  for (const collection of collections) {
    db[collection] = grouped.get(collection) as DbStore[CollectionName];
  }

  persistedSnapshots = new Map(
    collections.map((collection) => [
      collection,
      snapshotCollection(collection),
    ])
  );
  initialized = true;
};

const persistSnapshot = async (): Promise<void> => {
  if (!initialized) {
    throw new Error(
      'Application data storage has not been initialized from Supabase.'
    );
  }

  const client = getSupabaseAdmin();

  for (const collection of collections) {
    const previous = persistedSnapshots.get(collection) || new Map();
    const current = snapshotCollection(collection);
    const changed = [...current.entries()]
      .filter(([id, serialized]) => previous.get(id) !== serialized)
      .map(([id, serialized]) => ({
        collection,
        record_id: id,
        data: JSON.parse(serialized) as SupabaseJson,
        updated_at: new Date().toISOString(),
      }));
    const removed = [...previous.keys()].filter((id) => !current.has(id));

    for (let offset = 0; offset < changed.length; offset += WRITE_BATCH_SIZE) {
      const { error } = await client
        .from(TABLE_NAME)
        .upsert(changed.slice(offset, offset + WRITE_BATCH_SIZE), {
          onConflict: 'collection,record_id',
        });

      if (error) {
        throw new Error(
          `Unable to save ${collection} to Supabase: ${error.message}`
        );
      }
    }

    for (let offset = 0; offset < removed.length; offset += WRITE_BATCH_SIZE) {
      const { error } = await client
        .from(TABLE_NAME)
        .delete()
        .eq('collection', collection)
        .in('record_id', removed.slice(offset, offset + WRITE_BATCH_SIZE));

      if (error) {
        throw new Error(
          `Unable to delete ${collection} from Supabase: ${error.message}`
        );
      }
    }

    persistedSnapshots.set(collection, current);
  }
};

export const persistDatabase = (): Promise<void> => {
  const write = writeQueue.then(persistSnapshot);
  writeQueue = write.catch(() => undefined);
  return write;
};
