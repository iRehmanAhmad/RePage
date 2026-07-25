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

export const database = new RePageDatabase();

export async function saveRecovery(document: RePageDocument): Promise<void> {
  await database.recovery.put({
    documentId: document.id,
    document,
    savedAt: new Date().toISOString(),
  });
}

export async function loadRecovery(documentId: string): Promise<RePageDocument | undefined> {
  return (await database.recovery.get(documentId))?.document;
}

export async function getLatestRecovery(): Promise<{ document: RePageDocument; savedAt: string } | undefined> {
  const records = await database.recovery.orderBy('savedAt').reverse().toArray();
  const latest = records[0];
  return latest ? { document: latest.document, savedAt: latest.savedAt } : undefined;
}

export async function clearRecovery(): Promise<void> {
  await database.recovery.clear();
}

