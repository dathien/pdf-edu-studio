import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  GradedSubmissionRecord,
  InteractiveDraftRecord,
  TeacherWorksheetRecord,
} from '../../types/interactive';

interface InteractiveDbSchema extends DBSchema {
  teacherWorksheets: {
    key: string;
    value: TeacherWorksheetRecord;
    indexes: { 'by-updated': number };
  };
  studentDrafts: {
    key: string;
    value: InteractiveDraftRecord;
    indexes: { 'by-updated': number; 'by-worksheet': string };
  };
  submissions: {
    key: string;
    value: GradedSubmissionRecord;
    indexes: { 'by-worksheet': string; 'by-imported': number };
  };
}

export interface StorageOperationResult<T = void> {
  ok: boolean;
  data?: T;
  quotaExceeded?: boolean;
  errorMessage?: string;
}

const DB_NAME = 'pdf-edu-interactive-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<InteractiveDbSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<InteractiveDbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<InteractiveDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('teacherWorksheets')) {
          const store = db.createObjectStore('teacherWorksheets', { keyPath: 'worksheetId' });
          store.createIndex('by-updated', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('studentDrafts')) {
          const store = db.createObjectStore('studentDrafts', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
          store.createIndex('by-worksheet', 'worksheetId');
        }
        if (!db.objectStoreNames.contains('submissions')) {
          const store = db.createObjectStore('submissions', { keyPath: 'submissionId' });
          store.createIndex('by-worksheet', 'worksheetId');
          store.createIndex('by-imported', 'importedAt');
        }
      },
    });
  }
  return dbPromise;
}

function classifyStorageError(err: unknown): StorageOperationResult<never> {
  const name = err instanceof Error ? err.name : '';
  const msg = err instanceof Error ? err.message : String(err);
  const isQuota =
    name === 'QuotaExceededError' ||
    /quota|storage.*full|disk.*full|exceeded/i.test(msg);

  if (isQuota) {
    return {
      ok: false,
      quotaExceeded: true,
      errorMessage:
        'Bộ nhớ trình duyệt (IndexedDB) đã đầy. Hãy xuất ngay tệp sao lưu .pdfedu về máy tính hoặc xóa bớt bài đã lưu cũ.',
    };
  }
  return {
    ok: false,
    errorMessage: `Không thể lưu vào bộ nhớ cục bộ: ${msg}`,
  };
}

export const interactiveStorage = {
  // ---- Teacher Master Worksheets (with Answer Keys) ----
  async saveTeacherWorksheet(record: TeacherWorksheetRecord): Promise<StorageOperationResult> {
    try {
      const db = await getDb();
      await db.put('teacherWorksheets', {
        ...record,
        updatedAt: Date.now(),
      });
      return { ok: true };
    } catch (err) {
      return classifyStorageError(err);
    }
  },

  async listTeacherWorksheets(): Promise<TeacherWorksheetRecord[]> {
    try {
      const db = await getDb();
      const all = await db.getAll('teacherWorksheets');
      return all.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  },

  async getTeacherWorksheet(worksheetId: string): Promise<TeacherWorksheetRecord | undefined> {
    try {
      const db = await getDb();
      return await db.get('teacherWorksheets', worksheetId);
    } catch {
      return undefined;
    }
  },

  async deleteTeacherWorksheet(worksheetId: string): Promise<StorageOperationResult> {
    try {
      const db = await getDb();
      await db.delete('teacherWorksheets', worksheetId);
      return { ok: true };
    } catch (err) {
      return classifyStorageError(err);
    }
  },

  // ---- Student Drafts ("Bài đã lưu") ----
  async saveStudentDraft(record: InteractiveDraftRecord): Promise<StorageOperationResult> {
    try {
      const db = await getDb();
      await db.put('studentDrafts', {
        ...record,
        updatedAt: Date.now(),
      });
      return { ok: true };
    } catch (err) {
      return classifyStorageError(err);
    }
  },

  async listStudentDrafts(): Promise<InteractiveDraftRecord[]> {
    try {
      const db = await getDb();
      const all = await db.getAll('studentDrafts');
      return all.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return [];
    }
  },

  async getStudentDraft(id: string): Promise<InteractiveDraftRecord | undefined> {
    try {
      const db = await getDb();
      return await db.get('studentDrafts', id);
    } catch {
      return undefined;
    }
  },

  async renameStudentDraft(id: string, customTitle: string): Promise<StorageOperationResult> {
    try {
      const db = await getDb();
      const existing = await db.get('studentDrafts', id);
      if (!existing) return { ok: false, errorMessage: 'Không tìm thấy bài đã lưu.' };
      await db.put('studentDrafts', {
        ...existing,
        customTitle: customTitle.trim() || existing.worksheet.title,
        updatedAt: Date.now(),
      });
      return { ok: true };
    } catch (err) {
      return classifyStorageError(err);
    }
  },

  async deleteStudentDraft(id: string): Promise<StorageOperationResult> {
    try {
      const db = await getDb();
      await db.delete('studentDrafts', id);
      return { ok: true };
    } catch (err) {
      return classifyStorageError(err);
    }
  },

  // ---- Teacher Imported Student Submissions ("Nhận và chấm bài") ----
  async saveSubmission(record: GradedSubmissionRecord): Promise<StorageOperationResult> {
    try {
      const db = await getDb();
      await db.put('submissions', {
        ...record,
        updatedAt: Date.now(),
      });
      return { ok: true };
    } catch (err) {
      return classifyStorageError(err);
    }
  },

  async listSubmissions(worksheetId?: string): Promise<GradedSubmissionRecord[]> {
    try {
      const db = await getDb();
      const all = worksheetId
        ? await db.getAllFromIndex('submissions', 'by-worksheet', worksheetId)
        : await db.getAll('submissions');
      return all.sort((a, b) => b.importedAt - a.importedAt);
    } catch {
      return [];
    }
  },

  async getSubmission(submissionId: string): Promise<GradedSubmissionRecord | undefined> {
    try {
      const db = await getDb();
      return await db.get('submissions', submissionId);
    } catch {
      return undefined;
    }
  },

  async deleteSubmission(submissionId: string): Promise<StorageOperationResult> {
    try {
      const db = await getDb();
      await db.delete('submissions', submissionId);
      return { ok: true };
    } catch (err) {
      return classifyStorageError(err);
    }
  },

  async estimateStorageUsage(): Promise<{ usedMB: number; quotaMB: number } | null> {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        const usedMB = Math.round(((est.usage || 0) / (1024 * 1024)) * 10) / 10;
        const quotaMB = Math.round(((est.quota || 0) / (1024 * 1024)) * 10) / 10;
        return { usedMB, quotaMB };
      }
      return null;
    } catch {
      return null;
    }
  },
};
