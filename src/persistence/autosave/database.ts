import Dexie, { type EntityTable } from 'dexie';
import type { RePageDocument } from '../../domain/document/types';

interface RecoveryRecord {
  documentId: string;
  document: RePageDocument;
  savedAt: string;
}

class RePageDatabase extends Dexie {
  recovery!: EntityTable<RecoveryRecord, 'documentId'>;

  constructor() {
    super('RePageFoundation');
    this.version(1).stores({
      recovery: '&documentId, savedAt',
    });
  }
}

function isIndexedDbAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined' && window.indexedDB !== null;
}

export const database = new RePageDatabase();
const inMemoryRecovery = new Map<string, RecoveryRecord>();

export async function saveRecovery(document: RePageDocument): Promise<void> {
  const record: RecoveryRecord = {
    documentId: document.id,
    document,
    savedAt: new Date().toISOString(),
  };

  if (isIndexedDbAvailable()) {
    try {
      await database.recovery.put(record);
      return;
    } catch {
      // Fallback to in-memory store if IndexedDB operation fails
    }
  }

  inMemoryRecovery.set(document.id, record);
}

export async function loadRecovery(documentId: string): Promise<RePageDocument | undefined> {
  if (isIndexedDbAvailable()) {
    try {
      const record = await database.recovery.get(documentId);
      if (record) return record.document;
    } catch {
      // Fallback to in-memory store
    }
  }

  return inMemoryRecovery.get(documentId)?.document;
}

export async function getLatestRecovery(): Promise<{ document: RePageDocument; savedAt: string } | undefined> {
  if (isIndexedDbAvailable()) {
    try {
      const records = await database.recovery.orderBy('savedAt').reverse().toArray();
      const latest = records[0];
      if (latest) return { document: latest.document, savedAt: latest.savedAt };
    } catch {
      // Fallback to in-memory store
    }
  }

  const inMemRecords = Array.from(inMemoryRecovery.values()).sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
  const latestInMem = inMemRecords[0];
  return latestInMem ? { document: latestInMem.document, savedAt: latestInMem.savedAt } : undefined;
}

export async function clearRecovery(): Promise<void> {
  if (isIndexedDbAvailable()) {
    try {
      await database.recovery.clear();
    } catch {
      // ignore
    }
  }
  inMemoryRecovery.clear();
}
