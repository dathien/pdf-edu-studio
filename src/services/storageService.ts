import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  CustomShapeItem,
  GradedPaperRecord,
  RecentDocumentMeta,
  SavedCommentTemplate,
  SavedSignature,
  StudioDocument,
} from '../types/studio';

interface DraftRecord {
  id: string;
  title: string;
  fileName: string;
  originalPdfBytes: Uint8Array;
  currentPdfBytes: Uint8Array;
  pages: StudioDocument['pages'];
  objects: StudioDocument['objects'];
  grading: StudioDocument['grading'];
  watermark: StudioDocument['watermark'];
  pageNumbers: StudioDocument['pageNumbers'];
  subjectHint: StudioDocument['subjectHint'];
  updatedAt: number;
}

interface PdfEduStudioDB extends DBSchema {
  recentDocs: {
    key: string;
    value: RecentDocumentMeta;
    indexes: { 'by-date': number };
  };
  drafts: {
    key: string;
    value: DraftRecord;
  };
  signatures: {
    key: string;
    value: SavedSignature;
  };
  customShapes: {
    key: string;
    value: CustomShapeItem;
  };
  commentTemplates: {
    key: string;
    value: SavedCommentTemplate;
  };
  gradedPapers: {
    key: string;
    value: GradedPaperRecord;
    indexes: { 'by-date': number };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = 'pdf-edu-studio-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PdfEduStudioDB>> | null = null;

function getDb(): Promise<IDBPDatabase<PdfEduStudioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PdfEduStudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('recentDocs')) {
          const store = db.createObjectStore('recentDocs', { keyPath: 'id' });
          store.createIndex('by-date', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('signatures')) {
          db.createObjectStore('signatures', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customShapes')) {
          db.createObjectStore('customShapes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('commentTemplates')) {
          db.createObjectStore('commentTemplates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('gradedPapers')) {
          const store = db.createObjectStore('gradedPapers', { keyPath: 'id' });
          store.createIndex('by-date', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export const DEFAULT_COMMENT_TEMPLATES: SavedCommentTemplate[] = [
  { id: 'c1', category: 'Khen ngợi', text: 'Hoàn thành tốt bài làm, nắm vững kiến thức trọng tâm.' },
  { id: 'c2', category: 'Khen ngợi', text: 'Kiến thức chính xác, vận dụng công thức linh hoạt.' },
  { id: 'c3', category: 'Khen ngợi', text: 'Trình bày rõ ràng, khoa học, sạch đẹp.' },
  { id: 'c4', category: 'Động viên', text: 'Có tiến bộ rõ rệt so với bài kiểm tra trước.' },
  { id: 'c5', category: 'Cần lưu ý', text: 'Cần củng cố lại kiến thức cơ bản và ôn tập kỹ hơn.' },
  { id: 'c6', category: 'Cần lưu ý', text: 'Cần rèn thêm kỹ năng tính toán cẩn thận, tránh nhầm dấu.' },
  { id: 'c7', category: 'Cần lưu ý', text: 'Cần đọc kỹ yêu cầu đề bài trước khi trả lời.' },
  { id: 'c8', category: 'Cần lưu ý', text: 'Cần bổ sung bước lập luận và giải thích chặt chẽ hơn.' },
  { id: 'c9', category: 'Cần lưu ý', text: 'Cần kiểm tra đơn vị đo và điều kiện xác định của bài toán.' },
];

export const storageService = {
  async saveDraft(doc: StudioDocument): Promise<void> {
    // Respect confidential mode: never persist confidential documents
    if (doc.isConfidential) return;
    const db = await getDb();
    const now = Date.now();
    const draft: DraftRecord = {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      originalPdfBytes: doc.originalPdfBytes,
      currentPdfBytes: doc.currentPdfBytes,
      pages: doc.pages,
      objects: doc.objects,
      grading: doc.grading,
      watermark: doc.watermark,
      pageNumbers: doc.pageNumbers,
      subjectHint: doc.subjectHint,
      updatedAt: now,
    };
    await db.put('drafts', draft);
    await db.put('recentDocs', {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      pageCount: doc.pages.length,
      updatedAt: now,
      subjectHint: doc.subjectHint,
    });
  },

  async loadDraft(id: string): Promise<DraftRecord | undefined> {
    const db = await getDb();
    return db.get('drafts', id);
  },

  async listRecentDocs(): Promise<RecentDocumentMeta[]> {
    const db = await getDb();
    const all = await db.getAllFromIndex('recentDocs', 'by-date');
    return all.reverse().slice(0, 20);
  },

  async deleteRecentDoc(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('recentDocs', id);
    await db.delete('drafts', id);
  },

  async listSignatures(): Promise<SavedSignature[]> {
    const db = await getDb();
    return db.getAll('signatures');
  },

  async saveSignature(sig: SavedSignature): Promise<void> {
    const db = await getDb();
    await db.put('signatures', sig);
  },

  async deleteSignature(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('signatures', id);
  },

  async listCustomShapes(): Promise<CustomShapeItem[]> {
    const db = await getDb();
    return db.getAll('customShapes');
  },

  async saveCustomShape(item: CustomShapeItem): Promise<void> {
    const db = await getDb();
    await db.put('customShapes', item);
  },

  async deleteCustomShape(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('customShapes', id);
  },

  async listComments(): Promise<SavedCommentTemplate[]> {
    const db = await getDb();
    const existing = await db.getAll('commentTemplates');
    if (existing.length === 0) {
      for (const item of DEFAULT_COMMENT_TEMPLATES) {
        await db.put('commentTemplates', item);
      }
      return DEFAULT_COMMENT_TEMPLATES;
    }
    return existing;
  },

  async saveComment(item: SavedCommentTemplate): Promise<void> {
    const db = await getDb();
    await db.put('commentTemplates', item);
  },

  async deleteComment(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('commentTemplates', id);
  },

  async listGradedPapers(): Promise<GradedPaperRecord[]> {
    const db = await getDb();
    const all = await db.getAllFromIndex('gradedPapers', 'by-date');
    return all.reverse();
  },

  async saveGradedPaper(record: GradedPaperRecord): Promise<void> {
    const db = await getDb();
    await db.put('gradedPapers', record);
  },

  async deleteGradedPaper(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('gradedPapers', id);
  },

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const db = await getDb();
    const rec = await db.get('settings', key);
    return rec ? (rec.value as T) : fallback;
  },

  async setSetting(key: string, value: unknown): Promise<void> {
    const db = await getDb();
    await db.put('settings', { key, value });
  },

  async clearAllPersonalData(): Promise<void> {
    const db = await getDb();
    await Promise.all([
      db.clear('recentDocs'),
      db.clear('drafts'),
      db.clear('signatures'),
      db.clear('customShapes'),
      db.clear('gradedPapers'),
    ]);
  },
};
