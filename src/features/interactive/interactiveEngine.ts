import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { embedStudioFonts } from '../../engines/pdf/pdfEngine';
import {
  PDF_EMBED_NAMES,
  attachEmbeddedFilesToPdf,
  readPdfEmbeddedFiles,
  stripEmbeddedFilesFromPdfBytes,
  validatePdfHeaderBytes,
  type PdfEmbeddedEntry,
} from '../../engines/pdf/pdfEmbeddedData';
import type {
  GradedSubmissionRecord,
  InteractivePackageIntegrity,
  InteractiveQuestion,
  InteractiveWorksheet,
  MatchingPair,
  QuestionGradingDetail,
  StudentAnswerMap,
  StudentAttachmentMeta,
  StudentProfileInfo,
  StudentSubmissionPayload,
  TeacherAnswerKeyMap,
} from '../../types/interactive';

export const MAX_PDF_PACKAGE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8 MB per attachment
export const MAX_ATTACHMENTS_PER_QUESTION = 5;

const BLOCKED_EXTENSIONS = new Set([
  'js',
  'mjs',
  'cjs',
  'html',
  'htm',
  'xhtml',
  'svg',
  'exe',
  'dll',
  'bat',
  'cmd',
  'sh',
  'bash',
  'ps1',
  'vbs',
  'php',
  'jsp',
  'jar',
  'msi',
  'app',
  'dmg',
  'scr',
]);

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'pdf',
  'txt',
  'md',
  'csv',
  'py',
  'sql',
  'cpp',
  'c',
  'java',
  'pas',
  'docx',
  'xlsx',
  'pptx',
  'zip',
  'json',
]);

export function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
    .replace(/\.\.+/g, '.')
    .trim();
  return cleaned.slice(0, 120) || 'tep_dinh_kem';
}

export function validateAttachmentFile(file: {
  name: string;
  size: number;
  type?: string;
}): { ok: boolean; error?: string } {
  if (!file.name || file.size <= 0) {
    return { ok: false, error: 'Tệp đính kèm trống hoặc không hợp lệ.' };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: `Tệp "${file.name}" vượt quá giới hạn ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB.`,
    };
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ext || BLOCKED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `Không cho phép đính kèm tệp thực thi hoặc mã kịch bản (.${ext || 'unknown'}) để đảm bảo an toàn.`,
    };
  }
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `Định dạng .${ext} chưa nằm trong danh sách tệp bài làm cho phép (ảnh, PDF, txt, csv, py, sql, docx, xlsx...).`,
    };
  }
  return { ok: true };
}

/**
 * Computes SHA-256 hex digest using Web Crypto API (with FNV-1a fallback if subtle is unavailable).
 */
export async function computeIntegrityDigest(
  chunks: Uint8Array[]
): Promise<{ algorithm: InteractivePackageIntegrity['algorithm']; digest: string }> {
  let totalLen = 0;
  for (const c of chunks) totalLen += c.byteLength;
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    combined.set(c, offset);
    offset += c.byteLength;
  }

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle?.digest) {
      const hashBuf = await crypto.subtle.digest('SHA-256', combined.buffer);
      const hex = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return { algorithm: 'SHA-256', digest: hex };
    }
  } catch {
    // Fall through to deterministic fallback hash
  }

  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < combined.length; i++) {
    h1 ^= combined[i];
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= combined[combined.length - 1 - i];
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return {
    algorithm: 'FNV1A-FALLBACK',
    digest: `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`,
  };
}

/**
 * Strips any accidental teacher-only keys from a worksheet before packaging for students.
 */
export function sanitizeWorksheetForStudent(worksheet: InteractiveWorksheet): InteractiveWorksheet {
  const cleanQuestions: InteractiveQuestion[] = worksheet.questions.map((q) => ({
    id: q.id,
    code: q.code,
    title: q.title,
    prompt: q.prompt,
    type: q.type,
    maxPoints: q.maxPoints,
    required: q.required,
    region: { ...q.region },
    mcqOptions: q.mcqOptions ? q.mcqOptions.map((o) => ({ ...o })) : undefined,
    tfStatements: q.tfStatements ? q.tfStatements.map((s) => ({ ...s })) : undefined,
    shortPlaceholder: q.shortPlaceholder,
    shortUnit: q.shortUnit,
    numberUnit: q.numberUnit,
    numberPlaceholder: q.numberPlaceholder,
    fillBlanks: q.fillBlanks ? q.fillBlanks.map((b) => ({ ...b })) : undefined,
    essayPlaceholder: q.essayPlaceholder,
    matching: q.matching
      ? {
          mode: q.matching.mode,
          allowManyToOne: q.matching.allowManyToOne,
          shuffleB: q.matching.shuffleB,
          practiceFeedback: worksheet.examMode === 'practice' ? Boolean(q.matching.practiceFeedback) : false,
          columnATitle: q.matching.columnATitle,
          columnBTitle: q.matching.columnBTitle,
          itemsA: q.matching.itemsA.map((item) => ({ ...item })),
          itemsB: q.matching.itemsB.map((item) => ({ ...item })),
        }
      : undefined,
    orderingItems: q.orderingItems ? q.orderingItems.map((it) => ({ ...it })) : undefined,
    readingPassage: q.readingPassage,
    readingSubQuestions: q.readingSubQuestions
      ? q.readingSubQuestions.map((sq) => ({
          id: sq.id,
          prompt: sq.prompt,
          kind: sq.kind,
          options: sq.options ? [...sq.options] : undefined,
        }))
      : undefined,
    formulaPlaceholder: q.formulaPlaceholder,
    diagramPins: q.diagramPins ? q.diagramPins.map((p) => ({ ...p })) : undefined,
    attachmentAcceptHint: q.attachmentAcceptHint,
    sourcePdfPageNumber: q.sourcePdfPageNumber,
    printedPageLabel: q.printedPageLabel,
    teacherApproved: q.teacherApproved,
  }));

  return {
    worksheetId: worksheet.worksheetId,
    schemaVersion: 2,
    title: worksheet.title,
    subject: worksheet.subject,
    subjectLabel: worksheet.subjectLabel,
    grade: worksheet.grade,
    className: worksheet.className,
    description: worksheet.description,
    instructions: worksheet.instructions,
    teacherName: worksheet.teacherName,
    durationMinutes: worksheet.durationMinutes,
    dueDate: worksheet.dueDate,
    examMode: worksheet.examMode,
    pageMapping: worksheet.pageMapping ? { ...worksheet.pageMapping } : undefined,
    createdAt: worksheet.createdAt,
    updatedAt: worksheet.updatedAt,
    questions: cleanQuestions,
  };
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const b64 = parts[1] || '';
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType: string): string {
  if (typeof btoa === 'function') {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return `data:${mimeType};base64,${btoa(bin)}`;
  }
  return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`;
}

/**
 * Exports a Student Interactive Worksheet as a 100% standard PDF (.pdf, application/pdf).
 * - Visible pages: clean original PDF pages (readable in Zalo, Preview, Chrome, Adobe, Foxit).
 * - Standard PDF /Names/EmbeddedFiles: sanitized worksheet JSON (ZERO teacher keys!) + clean source + SHA-256.
 */
export async function exportStudentWorksheetPackage(
  worksheet: InteractiveWorksheet,
  pdfBytes: Uint8Array
): Promise<Uint8Array> {
  const cleanPdfBytes = await stripEmbeddedFilesFromPdfBytes(pdfBytes);
  const safeWorksheet = sanitizeWorksheetForStudent(worksheet);
  const payload = {
    packageKind: 'interactive-worksheet' as const,
    schemaVersion: 2 as const,
    worksheet: safeWorksheet,
  };
  const jsonBytes = encodeUtf8(JSON.stringify(payload, null, 2));
  const { algorithm, digest } = await computeIntegrityDigest([cleanPdfBytes, jsonBytes]);
  const integrity: InteractivePackageIntegrity = {
    algorithm,
    digest,
    generatedAt: Date.now(),
    entries: [PDF_EMBED_NAMES.CLEAN_SOURCE_PDF, PDF_EMBED_NAMES.WORKSHEET],
  };

  return attachEmbeddedFilesToPdf(cleanPdfBytes, [
    {
      name: PDF_EMBED_NAMES.CLEAN_SOURCE_PDF,
      bytes: cleanPdfBytes,
      mimeType: 'application/pdf',
      description: 'Clean base PDF pages for PDF EDU STUDIO',
    },
    {
      name: PDF_EMBED_NAMES.WORKSHEET,
      bytes: jsonBytes,
      mimeType: 'application/json',
      description: 'PDF EDU STUDIO interactive worksheet metadata (student-safe)',
    },
    {
      name: PDF_EMBED_NAMES.INTEGRITY,
      bytes: encodeUtf8(JSON.stringify(integrity, null, 2)),
      mimeType: 'application/json',
      description: 'SHA-256 integrity manifest',
    },
  ]);
}

/**
 * Exports a Teacher Master Backup as a 100% standard PDF (.pdf) containing clean PDF pages
 * plus embedded worksheet structure & teacher answer keys inside /Names/EmbeddedFiles.
 */
export async function exportTeacherMasterPackage(
  worksheet: InteractiveWorksheet,
  answerKeys: TeacherAnswerKeyMap,
  pdfBytes: Uint8Array
): Promise<Uint8Array> {
  const cleanPdfBytes = await stripEmbeddedFilesFromPdfBytes(pdfBytes);
  const payload = {
    packageKind: 'interactive-teacher-master' as const,
    schemaVersion: 2 as const,
    worksheet,
    answerKeys,
  };
  const jsonBytes = encodeUtf8(JSON.stringify(payload, null, 2));
  const { algorithm, digest } = await computeIntegrityDigest([cleanPdfBytes, jsonBytes]);
  const integrity: InteractivePackageIntegrity = {
    algorithm,
    digest,
    generatedAt: Date.now(),
    entries: [PDF_EMBED_NAMES.CLEAN_SOURCE_PDF, PDF_EMBED_NAMES.TEACHER_MASTER],
  };

  return attachEmbeddedFilesToPdf(cleanPdfBytes, [
    {
      name: PDF_EMBED_NAMES.CLEAN_SOURCE_PDF,
      bytes: cleanPdfBytes,
      mimeType: 'application/pdf',
      description: 'Clean base PDF pages for PDF EDU STUDIO',
    },
    {
      name: PDF_EMBED_NAMES.TEACHER_MASTER,
      bytes: jsonBytes,
      mimeType: 'application/json',
      description: 'PDF EDU STUDIO teacher master worksheet and answer keys',
    },
    {
      name: PDF_EMBED_NAMES.INTEGRITY,
      bytes: encodeUtf8(JSON.stringify(integrity, null, 2)),
      mimeType: 'application/json',
      description: 'SHA-256 integrity manifest',
    },
  ]);
}

/**
 * Exports a Student Saved / Submitted PDF (.pdf, application/pdf):
 * 1. Visible PDF pages: ALWAYS visually renders all answers, selection marks, matching lines,
 *    drag-drop cards, fill-in-the-blank values, formulas, handwriting strokes & student info
 *    so any standard PDF reader (Chrome, Preview, Adobe, Zalo) displays the full completed work.
 * 2. Standard PDF /Names/EmbeddedFiles: stores clean un-flattened base PDF + structured answers +
 *    safe binary attachments + SHA-256 integrity so reopening in PDF EDU STUDIO restores all
 *    interactive controls cleanly for further editing or teacher grading.
 * STRICT SECURITY: Never embeds any trusted score field; blocks unsafe attachment extensions.
 */
export async function exportStudentSubmissionPackage(params: {
  worksheet: InteractiveWorksheet;
  student: StudentProfileInfo;
  answers: StudentAnswerMap;
  pdfBytes: Uint8Array;
  startedAt: number;
  submissionId?: string;
  includeRenderedPdf?: boolean;
}): Promise<{ bytes: Uint8Array; submissionId: string }> {
  const submissionId =
    params.submissionId || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const cleanBasePdf = await stripEmbeddedFilesFromPdfBytes(params.pdfBytes);
  const attachmentEntries: Array<{ name: string; bytes: Uint8Array; mimeType: string }> = [];
  const sanitizedAnswers: StudentAnswerMap = {};

  for (const [qId, ans] of Object.entries(params.answers)) {
    const cleanAttachments: StudentAttachmentMeta[] = [];
    if (ans.attachments && ans.attachments.length > 0) {
      for (const att of ans.attachments.slice(0, MAX_ATTACHMENTS_PER_QUESTION)) {
        const check = validateAttachmentFile({ name: att.fileName, size: att.size, type: att.mimeType });
        if (!check.ok) continue;
        const safeName = sanitizeFileName(att.fileName);
        const embedName = `${PDF_EMBED_NAMES.ATTACHMENT_PREFIX}${att.id}_${safeName}`;
        const rawBytes = dataUrlToUint8Array(att.dataUrl);
        attachmentEntries.push({
          name: embedName,
          bytes: rawBytes,
          mimeType: att.mimeType || 'application/octet-stream',
        });
        cleanAttachments.push({
          id: att.id,
          fileName: safeName,
          mimeType: att.mimeType || 'application/octet-stream',
          size: rawBytes.byteLength,
          dataUrl: '', // stored in binary embedded file, not bloated in JSON
          addedAt: att.addedAt,
        });
      }
    }

    sanitizedAnswers[qId] = {
      questionId: qId,
      updatedAt: ans.updatedAt || Date.now(),
      mcqSelectedId: ans.mcqSelectedId,
      mcqMultiSelectedIds: Array.isArray(ans.mcqMultiSelectedIds)
        ? ans.mcqMultiSelectedIds.map(String)
        : undefined,
      tfAnswers: ans.tfAnswers ? { ...ans.tfAnswers } : undefined,
      shortText: ans.shortText,
      numberValue: ans.numberValue,
      fillBlankAnswers: ans.fillBlankAnswers ? { ...ans.fillBlankAnswers } : undefined,
      essayText: ans.essayText,
      matchingPairs: ans.matchingPairs
        ? ans.matchingPairs.map((p) => ({ fromId: String(p.fromId), toId: String(p.toId) }))
        : undefined,
      orderingIds: ans.orderingIds ? ans.orderingIds.map(String) : undefined,
      readingAnswers: ans.readingAnswers ? { ...ans.readingAnswers } : undefined,
      formulaLatex: ans.formulaLatex,
      drawingStrokes: ans.drawingStrokes,
      diagramLabels: ans.diagramLabels ? { ...ans.diagramLabels } : undefined,
      attachments: cleanAttachments.length > 0 ? cleanAttachments : undefined,
    };
  }

  const submissionPayload: StudentSubmissionPayload = {
    packageKind: 'interactive-submission',
    schemaVersion: 2,
    submissionId,
    worksheetId: params.worksheet.worksheetId,
    worksheetTitle: params.worksheet.title,
    student: {
      studentName: params.student.studentName.trim(),
      className: params.student.className.trim(),
      studentCode: params.student.studentCode.trim(),
    },
    startedAt: params.startedAt,
    submittedAt: Date.now(),
    answers: sanitizedAnswers,
  };

  const safeSnapshot = sanitizeWorksheetForStudent(params.worksheet);
  const subBytes = encodeUtf8(JSON.stringify(submissionPayload, null, 2));
  const snapBytes = encodeUtf8(JSON.stringify(safeSnapshot, null, 2));

  // Render visible PDF pages with all visual answers, marks, connector lines & strokes
  const visualPdfBytes = await renderInteractiveAnswersToPdf({
    pdfBytes: cleanBasePdf,
    worksheet: safeSnapshot,
    student: submissionPayload.student,
    answers: params.answers,
  });

  const digestChunks: Uint8Array[] = [cleanBasePdf, subBytes, snapBytes];
  const integrityEntries: string[] = [
    PDF_EMBED_NAMES.CLEAN_SOURCE_PDF,
    PDF_EMBED_NAMES.SUBMISSION,
    PDF_EMBED_NAMES.WORKSHEET_SNAPSHOT,
  ];
  const embedEntries: PdfEmbeddedEntry[] = [
    {
      name: PDF_EMBED_NAMES.CLEAN_SOURCE_PDF,
      bytes: cleanBasePdf,
      mimeType: 'application/pdf',
      description: 'Clean base PDF pages for re-editing in PDF EDU STUDIO',
    },
    {
      name: PDF_EMBED_NAMES.SUBMISSION,
      bytes: subBytes,
      mimeType: 'application/json',
      description: 'PDF EDU STUDIO student interactive submission data',
    },
    {
      name: PDF_EMBED_NAMES.WORKSHEET_SNAPSHOT,
      bytes: snapBytes,
      mimeType: 'application/json',
      description: 'PDF EDU STUDIO student-safe worksheet schema snapshot',
    },
  ];

  for (const att of attachmentEntries) {
    digestChunks.push(att.bytes);
    integrityEntries.push(att.name);
    embedEntries.push({
      name: att.name,
      bytes: att.bytes,
      mimeType: att.mimeType,
      description: 'Student attachment file',
    });
  }

  const { algorithm, digest } = await computeIntegrityDigest(digestChunks);
  const integrity: InteractivePackageIntegrity = {
    algorithm,
    digest,
    generatedAt: Date.now(),
    entries: integrityEntries,
  };
  embedEntries.push({
    name: PDF_EMBED_NAMES.INTEGRITY,
    bytes: encodeUtf8(JSON.stringify(integrity, null, 2)),
    mimeType: 'application/json',
    description: 'SHA-256 integrity manifest',
  });

  const finalPdfBytes = await attachEmbeddedFilesToPdf(visualPdfBytes, embedEntries);
  return { bytes: finalPdfBytes, submissionId };
}

export type ParsedInteractivePackage =
  | {
      kind: 'worksheet';
      worksheet: InteractiveWorksheet;
      pdfBytes: Uint8Array;
      integrityValid: boolean;
      warning?: string;
    }
  | {
      kind: 'teacher-master';
      worksheet: InteractiveWorksheet;
      answerKeys: TeacherAnswerKeyMap;
      pdfBytes: Uint8Array;
      integrityValid: boolean;
      warning?: string;
    }
  | {
      kind: 'submission';
      submission: StudentSubmissionPayload;
      worksheetSnapshot?: InteractiveWorksheet;
      /** Clean un-flattened PDF bytes for re-editing or overlay rendering */
      pdfBytes: Uint8Array;
      /** Full visible PDF bytes as received */
      visualPdfBytes: Uint8Array;
      integrityValid: boolean;
      warning?: string;
    }
  | {
      kind: 'plain-pdf';
      pdfBytes: Uint8Array;
      integrityValid: false;
      warning: string;
    };

/**
 * Peeks inside a standard .pdf file's /Names/EmbeddedFiles to classify what kind of
 * PDF EDU STUDIO data (if any) it carries.
 */
export async function peekPdfInteractiveKind(
  input: File | Uint8Array
): Promise<'studio-project' | 'worksheet' | 'teacher-master' | 'submission' | 'plain-pdf' | 'unknown'> {
  try {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(await input.arrayBuffer());
    if (!validatePdfHeaderBytes(bytes)) return 'unknown';
    const embedded = await readPdfEmbeddedFiles(bytes);
    if (embedded[PDF_EMBED_NAMES.WORKSHEET]) return 'worksheet';
    if (embedded[PDF_EMBED_NAMES.SUBMISSION]) return 'submission';
    if (embedded[PDF_EMBED_NAMES.TEACHER_MASTER]) return 'teacher-master';
    if (embedded[PDF_EMBED_NAMES.STUDIO_STATE]) return 'studio-project';
    return 'plain-pdf';
  } catch {
    return 'unknown';
  }
}

/**
 * Strictly validates and parses any PDF (.pdf) opened in the interactive worksheet subsystem.
 * Reads ISO 32000-1 /Names/EmbeddedFiles when present; honestly returns kind='plain-pdf'
 * when a standard PDF has no embedded interactive metadata (never fabricates recovery).
 */
export async function parseInteractivePackage(
  input: File | Uint8Array,
  fileName = 'document.pdf'
): Promise<ParsedInteractivePackage> {
  const rawBytes = input instanceof Uint8Array ? input : new Uint8Array(await input.arrayBuffer());
  if (rawBytes.byteLength === 0) {
    throw new Error(`Tệp "${fileName}" rỗng hoặc không đọc được.`);
  }
  if (rawBytes.byteLength > MAX_PDF_PACKAGE_BYTES) {
    throw new Error(
      `Tệp "${fileName}" vượt quá giới hạn dung lượng cho phép (${Math.round(MAX_PDF_PACKAGE_BYTES / (1024 * 1024))} MB).`
    );
  }
  if (!validatePdfHeaderBytes(rawBytes)) {
    throw new Error(`Tệp "${fileName}" không phải tài liệu PDF hợp lệ (.pdf).`);
  }

  let embedded: Record<string, Uint8Array>;
  try {
    embedded = await readPdfEmbeddedFiles(rawBytes);
  } catch (err) {
    if (err instanceof Error && err.message.includes('không an toàn')) {
      throw err;
    }
    throw new Error(`Không thể đọc cấu trúc tệp PDF "${fileName}" (tệp có thể bị hỏng).`);
  }

  let integrityManifest: InteractivePackageIntegrity | null = null;
  const intBytes = embedded[PDF_EMBED_NAMES.INTEGRITY];
  if (intBytes) {
    try {
      integrityManifest = JSON.parse(new TextDecoder().decode(intBytes)) as InteractivePackageIntegrity;
    } catch {
      throw new Error(`Tệp PDF "${fileName}" có mã kiểm tra toàn vẹn bị lỗi.`);
    }
  }

  const embeddedCleanPdf = embedded[PDF_EMBED_NAMES.CLEAN_SOURCE_PDF];
  const basePdfBytes =
    embeddedCleanPdf && validatePdfHeaderBytes(embeddedCleanPdf)
      ? embeddedCleanPdf
      : await stripEmbeddedFilesFromPdfBytes(rawBytes);

  // Case 1: Student Interactive Worksheet PDF
  const wsBytes = embedded[PDF_EMBED_NAMES.WORKSHEET];
  if (wsBytes) {
    let parsed: { packageKind?: string; worksheet?: InteractiveWorksheet };
    try {
      parsed = JSON.parse(new TextDecoder().decode(wsBytes));
    } catch {
      throw new Error(`Dữ liệu bài tập nhúng trong "${fileName}" không phải JSON hợp lệ.`);
    }
    if (parsed.packageKind !== 'interactive-worksheet' || !parsed.worksheet?.worksheetId) {
      throw new Error(`Tệp PDF "${fileName}" có dữ liệu bài tập không đúng cấu trúc.`);
    }
    let integrityValid = true;
    if (integrityManifest) {
      const computed = await computeIntegrityDigest([basePdfBytes, wsBytes]);
      if (computed.algorithm === integrityManifest.algorithm && computed.digest !== integrityManifest.digest) {
        throw new Error(
          `Tệp PDF "${fileName}" không khớp mã toàn vẹn dữ liệu (có thể bị hỏng hoặc chỉnh sửa trái phép).`
        );
      }
      integrityValid = computed.digest === integrityManifest.digest;
    }
    return {
      kind: 'worksheet',
      worksheet: sanitizeWorksheetForStudent(parsed.worksheet),
      pdfBytes: basePdfBytes,
      integrityValid,
    };
  }

  // Case 2: Teacher Master PDF
  const mBytes = embedded[PDF_EMBED_NAMES.TEACHER_MASTER];
  if (mBytes) {
    let parsed: {
      packageKind?: string;
      worksheet?: InteractiveWorksheet;
      answerKeys?: TeacherAnswerKeyMap;
    };
    try {
      parsed = JSON.parse(new TextDecoder().decode(mBytes));
    } catch {
      throw new Error(`Dữ liệu bản gốc giáo viên nhúng trong "${fileName}" bị lỗi.`);
    }
    if (parsed.packageKind !== 'interactive-teacher-master' || !parsed.worksheet?.worksheetId) {
      throw new Error(`Tệp PDF "${fileName}" không đúng cấu trúc bản gốc giáo viên.`);
    }
    let integrityValid = true;
    if (integrityManifest) {
      const computed = await computeIntegrityDigest([basePdfBytes, mBytes]);
      if (computed.algorithm === integrityManifest.algorithm && computed.digest !== integrityManifest.digest) {
        throw new Error(`Bản gốc giáo viên "${fileName}" không khớp mã toàn vẹn dữ liệu.`);
      }
      integrityValid = computed.digest === integrityManifest.digest;
    }
    return {
      kind: 'teacher-master',
      worksheet: parsed.worksheet,
      answerKeys: parsed.answerKeys || {},
      pdfBytes: basePdfBytes,
      integrityValid,
    };
  }

  // Case 3: Student Saved / Submitted Interactive PDF
  const subBytes = embedded[PDF_EMBED_NAMES.SUBMISSION];
  if (subBytes) {
    let parsedSub: StudentSubmissionPayload;
    try {
      parsedSub = JSON.parse(new TextDecoder().decode(subBytes)) as StudentSubmissionPayload;
    } catch {
      throw new Error(`Dữ liệu bài làm nhúng trong "${fileName}" không phải JSON hợp lệ.`);
    }
    if (
      parsedSub.packageKind !== 'interactive-submission' ||
      !parsedSub.submissionId ||
      !parsedSub.worksheetId ||
      typeof parsedSub.answers !== 'object'
    ) {
      throw new Error(`Tệp PDF "${fileName}" có dữ liệu bài làm học sinh không hợp lệ.`);
    }

    const snapBytes = embedded[PDF_EMBED_NAMES.WORKSHEET_SNAPSHOT] || null;
    let worksheetSnapshot: InteractiveWorksheet | undefined;
    if (snapBytes) {
      try {
        worksheetSnapshot = sanitizeWorksheetForStudent(
          JSON.parse(new TextDecoder().decode(snapBytes)) as InteractiveWorksheet
        );
      } catch {
        // Optional snapshot fallback
      }
    }

    const digestChunks: Uint8Array[] = [basePdfBytes, subBytes];
    if (snapBytes) digestChunks.push(snapBytes);

    const cleanAnswers: StudentAnswerMap = {};
    for (const [qId, rawAns] of Object.entries(parsedSub.answers || {})) {
      if (!rawAns || typeof rawAns !== 'object') continue;
      // Pick ONLY allowed student answer fields (NEVER trust any injected score fields)
      const rehydratedAttachments: StudentAttachmentMeta[] = [];
      if (Array.isArray(rawAns.attachments)) {
        for (const att of rawAns.attachments.slice(0, MAX_ATTACHMENTS_PER_QUESTION)) {
          const safeName = sanitizeFileName(String(att.fileName || 'file'));
          const embedName = `${PDF_EMBED_NAMES.ATTACHMENT_PREFIX}${att.id}_${safeName}`;
          const attBytes = embedded[embedName];
          if (!attBytes) continue;
          const check = validateAttachmentFile({
            name: safeName,
            size: attBytes.byteLength,
            type: att.mimeType,
          });
          if (!check.ok) continue;
          digestChunks.push(attBytes);
          rehydratedAttachments.push({
            id: String(att.id),
            fileName: safeName,
            mimeType: String(att.mimeType || 'application/octet-stream'),
            size: attBytes.byteLength,
            dataUrl: uint8ArrayToDataUrl(attBytes, String(att.mimeType || 'application/octet-stream')),
            addedAt: Number(att.addedAt || Date.now()),
          });
        }
      }

      cleanAnswers[qId] = {
        questionId: qId,
        updatedAt: Number(rawAns.updatedAt || Date.now()),
        mcqSelectedId: typeof rawAns.mcqSelectedId === 'string' ? rawAns.mcqSelectedId : undefined,
        mcqMultiSelectedIds: Array.isArray(rawAns.mcqMultiSelectedIds)
          ? rawAns.mcqMultiSelectedIds.map(String)
          : undefined,
        tfAnswers: rawAns.tfAnswers && typeof rawAns.tfAnswers === 'object' ? { ...rawAns.tfAnswers } : undefined,
        shortText: typeof rawAns.shortText === 'string' ? rawAns.shortText.slice(0, 500) : undefined,
        numberValue: typeof rawAns.numberValue === 'string' ? rawAns.numberValue.slice(0, 60) : undefined,
        fillBlankAnswers:
          rawAns.fillBlankAnswers && typeof rawAns.fillBlankAnswers === 'object'
            ? { ...rawAns.fillBlankAnswers }
            : undefined,
        essayText: typeof rawAns.essayText === 'string' ? rawAns.essayText.slice(0, 12000) : undefined,
        matchingPairs: Array.isArray(rawAns.matchingPairs)
          ? rawAns.matchingPairs
              .filter((p) => p && typeof p.fromId === 'string' && typeof p.toId === 'string')
              .map((p) => ({ fromId: p.fromId, toId: p.toId }))
          : undefined,
        orderingIds: Array.isArray(rawAns.orderingIds) ? rawAns.orderingIds.map(String) : undefined,
        readingAnswers:
          rawAns.readingAnswers && typeof rawAns.readingAnswers === 'object'
            ? { ...rawAns.readingAnswers }
            : undefined,
        formulaLatex: typeof rawAns.formulaLatex === 'string' ? rawAns.formulaLatex.slice(0, 1500) : undefined,
        drawingStrokes: Array.isArray(rawAns.drawingStrokes) ? rawAns.drawingStrokes.slice(0, 500) : undefined,
        diagramLabels:
          rawAns.diagramLabels && typeof rawAns.diagramLabels === 'object'
            ? { ...rawAns.diagramLabels }
            : undefined,
        attachments: rehydratedAttachments.length > 0 ? rehydratedAttachments : undefined,
      };
    }

    let integrityValid = true;
    if (integrityManifest) {
      const computed = await computeIntegrityDigest(digestChunks);
      if (computed.algorithm === integrityManifest.algorithm && computed.digest !== integrityManifest.digest) {
        throw new Error(
          `Bài nộp PDF "${fileName}" không khớp mã toàn vẹn (dữ liệu nhúng có thể đã bị sửa hoặc lỗi truyền tải).`
        );
      }
      integrityValid = computed.digest === integrityManifest.digest;
    }

    return {
      kind: 'submission',
      submission: {
        packageKind: 'interactive-submission',
        schemaVersion: 2,
        submissionId: String(parsedSub.submissionId),
        worksheetId: String(parsedSub.worksheetId),
        worksheetTitle: String(parsedSub.worksheetTitle || 'Bài tập PDF'),
        student: {
          studentName: String(parsedSub.student?.studentName || 'Học sinh chưa ghi tên').slice(0, 120),
          className: String(parsedSub.student?.className || '').slice(0, 60),
          studentCode: String(parsedSub.student?.studentCode || '').slice(0, 40),
        },
        startedAt: Number(parsedSub.startedAt || Date.now()),
        submittedAt: Number(parsedSub.submittedAt || Date.now()),
        answers: cleanAnswers,
      },
      worksheetSnapshot,
      pdfBytes: basePdfBytes,
      visualPdfBytes: rawBytes,
      integrityValid,
    };
  }

  // Case 4: Standard plain PDF without PDF EDU STUDIO embedded interactive metadata
  return {
    kind: 'plain-pdf',
    pdfBytes: rawBytes,
    integrityValid: false,
    warning:
      `Tệp "${fileName}" là PDF thông thường (không có dữ liệu tương tác nhúng hoặc dữ liệu nhúng đã bị công cụ ngoài lược bỏ). Không thể tự động khôi phục các vùng câu hỏi tương tác.`,
  };
}

/**
 * Safely fetches an online .pdf interactive worksheet from a valid HTTPS or same-origin URL.
 */
export async function fetchWorksheetFromUrl(rawUrl: string): Promise<ParsedInteractivePackage> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('Vui lòng nhập đường dẫn tệp bài tập PDF (.pdf).');
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'https://localhost');
  } catch {
    throw new Error('Đường dẫn URL không hợp lệ.');
  }
  const isSameOrigin =
    typeof window !== 'undefined' && parsedUrl.origin === window.location.origin;
  if (parsedUrl.protocol !== 'https:' && !isSameOrigin) {
    throw new Error('Chỉ cho phép tải bài tập từ đường dẫn HTTPS an toàn hoặc cùng tên miền.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const resp = await fetch(parsedUrl.toString(), { signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`Không thể tải tệp bài tập PDF (mã HTTP ${resp.status}).`);
    }
    const buf = new Uint8Array(await resp.arrayBuffer());
    return await parseInteractivePackage(buf, parsedUrl.pathname.split('/').pop() || 'bai_tap.pdf');
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Quá thời gian tải tệp bài tập PDF từ liên kết trực tuyến.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Checks whether a real online grading/submission backend endpoint has been configured via env.
 * STRICT RULE: Never fabricates backend reception when no real backend URL is configured.
 */
export function getOnlineBackendConfig(): {
  configured: boolean;
  endpointUrl: string | null;
} {
  const envUrl =
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_INTERACTIVE_BACKEND_URL;
  const trimmed = (envUrl || '').trim();
  if (!trimmed) return { configured: false, endpointUrl: null };
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.hostname === 'localhost') {
      return { configured: true, endpointUrl: parsed.toString().replace(/\/+$/, '') };
    }
  } catch {
    // invalid url
  }
  return { configured: false, endpointUrl: null };
}

/**
 * Builds a real, functional shareable link to open a hosted interactive .pdf worksheet directly inside PDF EDU STUDIO.
 * Rejects non-HTTPS external URLs and refuses to generate fake links without an actual hosted URL.
 */
export function buildShareableWorksheetLink(
  hostedPackageUrl: string,
  assignmentCode: string
): string {
  const trimmed = hostedPackageUrl.trim();
  if (!trimmed) {
    throw new Error('Cần cung cấp đường dẫn HTTPS (hoặc cùng tên miền) trỏ tới tệp bài tập .pdf thật để tạo liên kết chia sẻ.');
  }
  const baseOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://localhost';
  const basePath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const parsed = new URL(trimmed, baseOrigin);
  if (parsed.protocol !== 'https:' && parsed.origin !== baseOrigin) {
    throw new Error('Đường dẫn tệp bài tập phải dùng giao thức HTTPS an toàn hoặc cùng tên miền.');
  }
  const link = new URL(basePath, baseOrigin);
  link.searchParams.set('worksheetUrl', parsed.toString());
  if (assignmentCode.trim()) {
    link.searchParams.set('code', assignmentCode.trim());
  }
  return link.toString();
}

// ============================================================================
// TRUSTED TEACHER AUTO-GRADING ENGINE (NEVER TRUSTS STUDENT-CLAIMED SCORES)
// ============================================================================

export function normalizeTextAnswer(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ');
}

function roundScore(val: number): number {
  return Math.round(val * 100) / 100;
}

export function gradeSingleQuestion(
  question: InteractiveQuestion,
  key: TeacherAnswerKeyMap[string] | undefined,
  answer: StudentAnswerMap[string] | undefined,
  existingManual?: QuestionGradingDetail
): QuestionGradingDetail {
  const maxPoints = question.maxPoints;

  // Manual-only question types (never claim automatic essay/drawing/complex-formula grading)
  if (
    question.type === 'essay' ||
    question.type === 'drawing' ||
    question.type === 'diagram_label' ||
    question.type === 'attachment' ||
    question.type === 'formula'
  ) {
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: null,
      earnedPoints: existingManual?.earnedPoints ?? null,
      mode: 'manual',
      teacherNote: existingManual?.teacherNote,
    };
  }

  if (!key) {
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: null,
      earnedPoints: existingManual?.earnedPoints ?? null,
      mode: 'manual',
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 1. MCQ (Single Choice)
  if (question.type === 'mcq') {
    const correct =
      Boolean(key.mcqCorrectId) &&
      Boolean(answer?.mcqSelectedId) &&
      answer?.mcqSelectedId === key.mcqCorrectId;
    const pts = correct ? maxPoints : 0;
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      markStatus: correct ? 'correct' : 'wrong',
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 1b. MCQ Multiple Choice (Checkboxes — exact or partial scoring)
  if (question.type === 'mcq_multi') {
    const expected = new Set((key.mcqMultiCorrectIds || []).filter(Boolean));
    const selected = new Set((answer?.mcqMultiSelectedIds || []).filter(Boolean));
    let pts = 0;
    if (expected.size > 0) {
      let rightHits = 0;
      let wrongHits = 0;
      for (const s of selected) {
        if (expected.has(s)) rightHits++;
        else wrongHits++;
      }
      if (key.mcqMultiScoring === 'partial') {
        const net = Math.max(0, rightHits - wrongHits);
        pts = roundScore((maxPoints * net) / expected.size);
      } else {
        pts = rightHits === expected.size && wrongHits === 0 ? maxPoints : 0;
      }
    }
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      markStatus: pts === maxPoints ? 'correct' : pts > 0 ? 'partial' : 'wrong',
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 2. True / False per item (Configurable rubric: THPT 4-item, Equal per item, or Custom item points)
  if (question.type === 'tf') {
    const keyMap = key.tfCorrectMap || {};
    const ids = Object.keys(keyMap);
    const ansMap = answer?.tfAnswers || {};
    const scoringMode = key.tfScoringMode || (ids.length === 4 ? 'thpt_4' : 'equal');

    let pts = 0;
    if (scoringMode === 'custom' && key.tfItemPoints) {
      for (const id of ids) {
        if (ansMap[id] && ansMap[id] === keyMap[id]) {
          pts += Number(key.tfItemPoints[id] || 0);
        }
      }
      pts = roundScore(Math.min(maxPoints, pts));
    } else {
      let correctCount = 0;
      for (const id of ids) {
        if (ansMap[id] && ansMap[id] === keyMap[id]) correctCount++;
      }
      let ratio = 0;
      if (scoringMode === 'thpt_4' && ids.length === 4) {
        const thptRatios = [0, 0.1, 0.25, 0.5, 1];
        ratio = thptRatios[correctCount] ?? 0;
      } else if (ids.length > 0) {
        ratio = correctCount / ids.length;
      }
      pts = roundScore(maxPoints * ratio);
    }
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      markStatus: pts === maxPoints ? 'correct' : pts > 0 ? 'partial' : 'wrong',
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 3. Short Answer
  if (question.type === 'short') {
    const accepted = (key.shortAccepted || []).map(normalizeTextAnswer).filter(Boolean);
    const stu = normalizeTextAnswer(answer?.shortText || '');
    const correct = stu.length > 0 && accepted.includes(stu);
    const pts = correct ? maxPoints : 0;
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      markStatus: correct ? 'correct' : 'wrong',
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 3b. Numeric Input (with configurable tolerance)
  if (question.type === 'number') {
    const raw = (answer?.numberValue || '').trim().replace(/,/g, '.');
    const parsed = raw.length > 0 ? Number(raw) : Number.NaN;
    const tol = typeof key.numberTolerance === 'number' ? Math.abs(key.numberTolerance) : 0.01;
    const correct =
      typeof key.numberTarget === 'number' &&
      !Number.isNaN(parsed) &&
      Math.abs(parsed - key.numberTarget) <= tol;
    const pts = correct ? maxPoints : 0;
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      markStatus: correct ? 'correct' : 'wrong',
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 4. Fill in the Blank
  if (question.type === 'fill_blank') {
    const acceptedMap = key.fillBlankAccepted || {};
    const slotIds = Object.keys(acceptedMap);
    const stuMap = answer?.fillBlankAnswers || {};
    let correctCount = 0;
    for (const slotId of slotIds) {
      const accepted = (acceptedMap[slotId] || []).map(normalizeTextAnswer).filter(Boolean);
      const stuVal = normalizeTextAnswer(stuMap[slotId] || '');
      if (stuVal && accepted.includes(stuVal)) correctCount++;
    }
    const pts = slotIds.length > 0 ? roundScore((maxPoints * correctCount) / slotIds.length) : 0;
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      markStatus: pts === maxPoints ? 'correct' : pts > 0 ? 'partial' : 'wrong',
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 5. Matching (STRICTLY BY STABLE ITEM IDs — supports custom per-pair points & teacher overrides)
  if (question.type === 'matching') {
    const expected = key.matchingCorrectPairs || [];
    const expectedSet = new Set(expected.map((p) => `${p.fromId}->${p.toId}`));
    const studentPairs = answer?.matchingPairs || [];
    const seen = new Set<string>();
    let matched = 0;
    for (const p of studentPairs) {
      const pairKey = `${p.fromId}->${p.toId}`;
      if (!seen.has(pairKey) && expectedSet.has(pairKey)) {
        seen.add(pairKey);
        matched++;
      }
    }
    const defaultPerPair = expected.length > 0 ? maxPoints / expected.length : 0;
    let pts = 0;
    if (key.matchingPairPoints && Object.keys(key.matchingPairPoints).length > 0) {
      for (const exp of expected) {
        const pairKey = `${exp.fromId}->${exp.toId}`;
        if (seen.has(pairKey)) {
          pts += Number(key.matchingPairPoints[pairKey] ?? defaultPerPair);
        }
      }
      pts = roundScore(Math.min(maxPoints, pts));
    } else {
      pts = expected.length > 0 ? roundScore((maxPoints * matched) / expected.length) : 0;
    }

    if (existingManual?.pairOverrides && Object.keys(existingManual.pairOverrides).length > 0) {
      let sum = 0;
      for (const exp of expected) {
        const pairKey = `${exp.fromId}->${exp.toId}`;
        if (typeof existingManual.pairOverrides[pairKey] === 'number') {
          sum += existingManual.pairOverrides[pairKey];
        } else if (seen.has(pairKey)) {
          sum += Number(key.matchingPairPoints?.[pairKey] ?? defaultPerPair);
        }
      }
      pts = roundScore(Math.min(maxPoints, Math.max(0, sum)));
    }
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      markStatus: pts === maxPoints ? 'correct' : pts > 0 ? 'partial' : 'wrong',
      matchedPairsCount: matched,
      totalExpectedPairs: expected.length,
      pairOverrides: existingManual?.pairOverrides,
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 6. Ordering (by stable item IDs)
  if (question.type === 'ordering') {
    const expectedIds = key.orderingCorrectIds || [];
    const stuIds = answer?.orderingIds || [];
    let exactPositions = 0;
    for (let i = 0; i < expectedIds.length; i++) {
      if (stuIds[i] === expectedIds[i]) exactPositions++;
    }
    const pts =
      expectedIds.length > 0 ? roundScore((maxPoints * exactPositions) / expectedIds.length) : 0;
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      teacherNote: existingManual?.teacherNote,
    };
  }

  // 7. Reading Comprehension (sub-questions)
  if (question.type === 'reading') {
    const subKeys = key.readingSubKeys || {};
    const subIds = Object.keys(subKeys);
    const stuMap = answer?.readingAnswers || {};
    let correct = 0;
    for (const subId of subIds) {
      const accepted = (subKeys[subId] || []).map(normalizeTextAnswer).filter(Boolean);
      const stuVal = normalizeTextAnswer(stuMap[subId] || '');
      if (stuVal && accepted.includes(stuVal)) correct++;
    }
    const pts = subIds.length > 0 ? roundScore((maxPoints * correct) / subIds.length) : 0;
    return {
      questionId: question.id,
      maxPoints,
      autoPoints: pts,
      earnedPoints: existingManual?.earnedPoints ?? pts,
      mode: 'auto',
      teacherNote: existingManual?.teacherNote,
    };
  }

  return {
    questionId: question.id,
    maxPoints,
    autoPoints: null,
    earnedPoints: existingManual?.earnedPoints ?? null,
    mode: 'manual',
  };
}

export function autoGradeSubmission(
  worksheet: InteractiveWorksheet,
  answerKeys: TeacherAnswerKeyMap,
  answers: StudentAnswerMap,
  previousDetails?: Record<string, QuestionGradingDetail>
): {
  gradingDetails: Record<string, QuestionGradingDetail>;
  totalScore: number;
  maxScore: number;
  hasManualPending: boolean;
} {
  const gradingDetails: Record<string, QuestionGradingDetail> = {};
  let totalScore = 0;
  let maxScore = 0;
  let hasManualPending = false;

  for (const q of worksheet.questions) {
    const detail = gradeSingleQuestion(q, answerKeys[q.id], answers[q.id], previousDetails?.[q.id]);
    gradingDetails[q.id] = detail;
    maxScore += q.maxPoints;
    if (typeof detail.earnedPoints === 'number') {
      totalScore += detail.earnedPoints;
    } else if (detail.mode === 'manual') {
      hasManualPending = true;
    }
  }

  return {
    gradingDetails,
    totalScore: roundScore(totalScore),
    maxScore: roundScore(maxScore),
    hasManualPending,
  };
}

// ============================================================================
// VISUAL PDF RENDERER (DRAWS ANSWERS, SVG MATCHING LINES, DRAG CARDS, STROKES & GRADES)
// ============================================================================

function toAsciiVietnameseFallback(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, ' ');
}

function safePdfText(font: PDFFont, text: string): string {
  const normalized = (text || '').replace(/\r?\n/g, ' ');
  try {
    font.encodeText(normalized);
    return normalized;
  } catch {
    return toAsciiVietnameseFallback(normalized);
  }
}

function wrapTextLines(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const safe = safePdfText(font, text);
  if (!safe.trim()) return [];
  const words = safe.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    let width = cand.length * size * 0.55;
    try {
      width = font.widthOfTextAtSize(cand, size);
    } catch {
      // fallback width estimate
    }
    if (width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cand;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawSafeLine(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  size: number,
  color = rgb(0.08, 0.25, 0.35)
) {
  const safe = safePdfText(font, text);
  if (!safe) return;
  page.drawText(safe, { x, y, size, font, color });
}

const MATCH_LINE_COLORS = [
  rgb(0.03, 0.5, 0.44), // teal
  rgb(0.11, 0.38, 0.72), // blue
  rgb(0.75, 0.36, 0.06), // amber
  rgb(0.58, 0.16, 0.58), // purple
  rgb(0.78, 0.16, 0.22), // crimson
  rgb(0.14, 0.52, 0.24), // green
];

/**
 * Renders student interactive answers (including actual vector matching lines, placed drag-drop cards,
 * freehand drawing strokes, labels, and optional teacher grades/comments) directly onto PDF pages.
 */
export async function renderInteractiveAnswersToPdf(params: {
  pdfBytes: Uint8Array;
  worksheet: InteractiveWorksheet;
  student: StudentProfileInfo;
  answers: StudentAnswerMap;
  grading?: {
    gradingDetails: Record<string, QuestionGradingDetail>;
    totalScore: number;
    maxScore: number;
    teacherComment: string;
    answerKeys?: TeacherAnswerKeyMap;
  };
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(params.pdfBytes, { ignoreEncryption: true });
  const fonts = await embedStudioFonts(pdfDoc);
  const pages = pdfDoc.getPages();

  // Header Student Info & Optional Teacher Total Score Box on Page 1
  if (pages[0]) {
    const p0 = pages[0];
    const { width: pw, height: ph } = p0.getSize();
    const infoBarH = params.grading ? 46 : 26;
    p0.drawRectangle({
      x: 24,
      y: ph - infoBarH - 12,
      width: pw - 48,
      height: infoBarH,
      color: params.grading ? rgb(0.99, 0.96, 0.96) : rgb(0.94, 0.98, 0.97),
      borderColor: params.grading ? rgb(0.84, 0.16, 0.16) : rgb(0.03, 0.5, 0.44),
      borderWidth: 1,
    });
    const studentLine = `Học sinh: ${params.student.studentName || 'Chưa ghi tên'}   |   Lớp: ${params.student.className || '—'}   |   Mã HS: ${params.student.studentCode || '—'}`;
    drawSafeLine(p0, fonts.sansBold, studentLine, 32, ph - 28, 9.5, rgb(0.09, 0.3, 0.39));

    if (params.grading) {
      const scoreText = `TỔNG ĐIỂM: ${params.grading.totalScore} / ${params.grading.maxScore}`;
      drawSafeLine(p0, fonts.sansBold, scoreText, pw - 170, ph - 28, 11, rgb(0.82, 0.12, 0.12));
      const commentLine = `Nhận xét GV: ${params.grading.teacherComment || 'Đã chấm bài.'}`;
      drawSafeLine(p0, fonts.sans, commentLine.slice(0, 115), 32, ph - 48, 8.8, rgb(0.55, 0.1, 0.1));
    }
  }

  for (const q of params.worksheet.questions) {
    const page = pages[q.region.pageIndex] || pages[0];
    if (!page) continue;
    const { height: pageHeight } = page.getSize();
    const rx = q.region.x;
    const rw = q.region.width;
    const rh = q.region.height;
    // Convert top-left PDF-point region to pdf-lib bottom-left coordinates
    const bottomY = Math.max(12, pageHeight - (q.region.y + rh));
    const topY = bottomY + rh;
    const ans = params.answers[q.id];
    const grade = params.grading?.gradingDetails[q.id];

    // Subtle answer frame
    page.drawRectangle({
      x: rx,
      y: bottomY,
      width: rw,
      height: rh,
      color: rgb(0.985, 0.995, 0.994),
      borderColor: grade ? rgb(0.84, 0.18, 0.18) : rgb(0.03, 0.5, 0.44),
      borderWidth: 0.9,
      opacity: 0.94,
    });

    // Region header bar
    drawSafeLine(
      page,
      fonts.sansBold,
      `${q.code}: ${q.title}`.slice(0, 62),
      rx + 6,
      topY - 12,
      8.2,
      rgb(0.09, 0.31, 0.39)
    );

    if (grade) {
      const ptsLabel =
        typeof grade.earnedPoints === 'number'
          ? `${grade.earnedPoints}/${grade.maxPoints}đ`
          : `Chưa chấm / ${grade.maxPoints}đ`;
      drawSafeLine(page, fonts.sansBold, ptsLabel, rx + rw - 72, topY - 12, 8.5, rgb(0.82, 0.12, 0.12));
    }

    const bodyTop = topY - 24;

    // Type-specific visual rendering
    if (q.type === 'mcq') {
      let curY = bodyTop - 2;
      const opts = q.mcqOptions || [];
      if (opts.length > 0) {
        for (const opt of opts) {
          if (curY < bottomY + 10) break;
          const isSel = ans?.mcqSelectedId === opt.id;
          page.drawCircle({
            x: rx + 13,
            y: curY + 3,
            size: 4.2,
            color: isSel ? rgb(0.03, 0.5, 0.44) : rgb(1, 1, 1),
            borderColor: isSel ? rgb(0.03, 0.5, 0.44) : rgb(0.45, 0.52, 0.6),
            borderWidth: 0.9,
          });
          drawSafeLine(
            page,
            isSel ? fonts.sansBold : fonts.sans,
            `${opt.label}. ${opt.text}${isSel ? '  [ĐÃ CHỌN]' : ''}`.slice(0, 68),
            rx + 22,
            curY,
            8.2,
            isSel ? rgb(0.03, 0.42, 0.36) : rgb(0.25, 0.3, 0.36)
          );
          curY -= 14;
        }
      } else {
        drawSafeLine(page, fonts.sans, 'HS chưa chọn đáp án.', rx + 8, bodyTop - 6, 8.5, rgb(0.45, 0.5, 0.56));
      }
    } else if (q.type === 'mcq_multi') {
      const selIds = new Set(ans?.mcqMultiSelectedIds || []);
      let curY = bodyTop - 2;
      for (const opt of q.mcqOptions || []) {
        if (curY < bottomY + 10) break;
        const isSel = selIds.has(opt.id);
        page.drawRectangle({
          x: rx + 9,
          y: curY - 1,
          width: 8.5,
          height: 8.5,
          color: isSel ? rgb(0.03, 0.5, 0.44) : rgb(1, 1, 1),
          borderColor: isSel ? rgb(0.03, 0.5, 0.44) : rgb(0.45, 0.52, 0.6),
          borderWidth: 0.9,
        });
        if (isSel) {
          drawSafeLine(page, fonts.sansBold, 'X', rx + 10.6, curY + 0.5, 7, rgb(1, 1, 1));
        }
        drawSafeLine(
          page,
          isSel ? fonts.sansBold : fonts.sans,
          `${opt.label}. ${opt.text}`.slice(0, 68),
          rx + 22,
          curY,
          8.2,
          isSel ? rgb(0.03, 0.42, 0.36) : rgb(0.25, 0.3, 0.36)
        );
        curY -= 14;
      }
    } else if (q.type === 'tf') {
      let curY = bodyTop - 2;
      for (const st of q.tfStatements || []) {
        const val = ans?.tfAnswers?.[st.id];
        const badge = val === 'T' ? '[ĐÚNG]' : val === 'F' ? '[SAI]' : '[Chưa chọn]';
        drawSafeLine(
          page,
          fonts.sans,
          `${st.label} ${badge} ${st.text}`.slice(0, 68),
          rx + 8,
          curY,
          8,
          rgb(0.12, 0.2, 0.28)
        );
        curY -= 14;
        if (curY < bottomY + 8) break;
      }
    } else if (q.type === 'short') {
      const txt = `Trả lời: ${ans?.shortText || '(Chưa nhập)'}${q.shortUnit ? ` ${q.shortUnit}` : ''}`;
      drawSafeLine(page, fonts.sansBold, txt.slice(0, 74), rx + 8, bodyTop - 6, 9.2, rgb(0.03, 0.45, 0.39));
    } else if (q.type === 'number') {
      const txt = `Giá trị số: ${ans?.numberValue || '(Chưa nhập)'}${q.numberUnit ? ` ${q.numberUnit}` : ''}`;
      drawSafeLine(page, fonts.sansBold, txt.slice(0, 74), rx + 8, bodyTop - 6, 9.2, rgb(0.03, 0.45, 0.39));
    } else if (q.type === 'fill_blank') {
      let curY = bodyTop - 2;
      for (const slot of q.fillBlanks || []) {
        const val = ans?.fillBlankAnswers?.[slot.id] || '____';
        const line = `${slot.prefix} [${val}] ${slot.suffix}`.trim();
        for (const wrapped of wrapTextLines(fonts.sans, line, 8.2, rw - 16).slice(0, 2)) {
          drawSafeLine(page, fonts.sans, wrapped, rx + 8, curY, 8.2, rgb(0.08, 0.25, 0.35));
          curY -= 12;
          if (curY < bottomY + 8) break;
        }
      }
    } else if (q.type === 'essay' || q.type === 'formula') {
      const content =
        q.type === 'formula'
          ? `Công thức LaTeX: ${ans?.formulaLatex || '(Chưa nhập)'}`
          : ans?.essayText || '(Chưa nhập bài làm)';
      let curY = bodyTop - 2;
      for (const wrapped of wrapTextLines(fonts.sans, content, 8.3, rw - 16)) {
        if (curY < bottomY + 8) break;
        drawSafeLine(page, fonts.sans, wrapped, rx + 8, curY, 8.3, rgb(0.1, 0.18, 0.26));
        curY -= 11.5;
      }
    } else if (q.type === 'matching' && q.matching) {
      const itemsA = q.matching.itemsA;
      const itemsB = q.matching.itemsB;
      const pairs: MatchingPair[] = ans?.matchingPairs || [];
      const rowCount = Math.max(itemsA.length, itemsB.length, 1);
      const availH = Math.max(40, rh - 30);
      const rowH = Math.min(28, availH / rowCount);

      if (q.matching.mode === 'line') {
        // VISUAL VECTOR LINE-CONNECTING RENDER ON PDF
        const colAW = Math.round(rw * 0.38);
        const colBW = Math.round(rw * 0.38);
        const colAX = rx + 8;
        const colBX = rx + rw - colBW - 8;
        const portA = new Map<string, { x: number; y: number }>();
        const portB = new Map<string, { x: number; y: number }>();

        itemsA.forEach((item, idx) => {
          const boxBottom = topY - 22 - (idx + 1) * rowH + 3;
          const boxH = Math.max(14, rowH - 5);
          page.drawRectangle({
            x: colAX,
            y: boxBottom,
            width: colAW,
            height: boxH,
            color: rgb(0.93, 0.97, 0.98),
            borderColor: rgb(0.09, 0.31, 0.39),
            borderWidth: 0.7,
          });
          drawSafeLine(
            page,
            fonts.sans,
            `${idx + 1}. ${item.label || item.latex || ''}`.slice(0, 28),
            colAX + 4,
            boxBottom + boxH / 2 - 3,
            7.4,
            rgb(0.09, 0.25, 0.34)
          );
          const cy = boxBottom + boxH / 2;
          portA.set(item.id, { x: colAX + colAW, y: cy });
          page.drawCircle({ x: colAX + colAW, y: cy, size: 2.5, color: rgb(0.03, 0.5, 0.44) });
        });

        itemsB.forEach((item, idx) => {
          const boxBottom = topY - 22 - (idx + 1) * rowH + 3;
          const boxH = Math.max(14, rowH - 5);
          page.drawRectangle({
            x: colBX,
            y: boxBottom,
            width: colBW,
            height: boxH,
            color: rgb(0.96, 0.97, 0.99),
            borderColor: rgb(0.28, 0.38, 0.5),
            borderWidth: 0.7,
          });
          const letter = String.fromCharCode(65 + idx);
          drawSafeLine(
            page,
            fonts.sans,
            `${letter}. ${item.label || item.latex || ''}`.slice(0, 28),
            colBX + 5,
            boxBottom + boxH / 2 - 3,
            7.4,
            rgb(0.12, 0.2, 0.3)
          );
          const cy = boxBottom + boxH / 2;
          portB.set(item.id, { x: colBX, y: cy });
          page.drawCircle({ x: colBX, y: cy, size: 2.5, color: rgb(0.11, 0.38, 0.72) });
        });

        // Draw actual vector connecting lines between matched ports!
        const keyPairs = params.grading?.answerKeys?.[q.id]?.matchingCorrectPairs;
        const keySet = keyPairs ? new Set(keyPairs.map((p) => `${p.fromId}->${p.toId}`)) : null;

        pairs.forEach((pair, idx) => {
          const pA = portA.get(pair.fromId);
          const pB = portB.get(pair.toId);
          if (!pA || !pB) return;
          const isCorrect = keySet ? keySet.has(`${pair.fromId}->${pair.toId}`) : null;
          const lineColor =
            isCorrect === true
              ? rgb(0.05, 0.58, 0.33)
              : isCorrect === false
                ? rgb(0.84, 0.15, 0.15)
                : MATCH_LINE_COLORS[idx % MATCH_LINE_COLORS.length];
          page.drawLine({
            start: { x: pA.x, y: pA.y },
            end: { x: pB.x, y: pB.y },
            thickness: 1.6,
            color: lineColor,
          });
        });
      } else {
        // VISUAL DRAG-AND-DROP PLACED CARDS RENDER ON PDF
        const itemBMap = new Map(itemsB.map((b) => [b.id, b]));
        itemsA.forEach((itemA, idx) => {
          const boxBottom = topY - 22 - (idx + 1) * rowH + 3;
          const boxH = Math.max(15, rowH - 5);
          const halfW = (rw - 24) / 2;
          page.drawRectangle({
            x: rx + 8,
            y: boxBottom,
            width: halfW,
            height: boxH,
            color: rgb(0.94, 0.97, 0.98),
            borderColor: rgb(0.09, 0.31, 0.39),
            borderWidth: 0.7,
          });
          drawSafeLine(
            page,
            fonts.sans,
            `${idx + 1}. ${itemA.label}`.slice(0, 34),
            rx + 12,
            boxBottom + boxH / 2 - 3,
            7.5
          );
          const matchedPair = pairs.find((p) => p.fromId === itemA.id);
          const placedB = matchedPair ? itemBMap.get(matchedPair.toId) : null;
          page.drawRectangle({
            x: rx + 14 + halfW,
            y: boxBottom,
            width: halfW,
            height: boxH,
            color: placedB ? rgb(0.9, 0.98, 0.95) : rgb(0.98, 0.98, 0.98),
            borderColor: placedB ? rgb(0.03, 0.5, 0.44) : rgb(0.7, 0.75, 0.8),
            borderWidth: 0.9,
          });
          drawSafeLine(
            page,
            fonts.sansBold,
            placedB ? `-> ${placedB.label}`.slice(0, 34) : '(Chưa thả thẻ)',
            rx + 18 + halfW,
            boxBottom + boxH / 2 - 3,
            7.5,
            placedB ? rgb(0.03, 0.45, 0.39) : rgb(0.55, 0.58, 0.63)
          );
        });
      }
    } else if (q.type === 'ordering') {
      const orderIds = ans?.orderingIds || q.orderingItems?.map((i) => i.id) || [];
      const itemMap = new Map((q.orderingItems || []).map((i) => [i.id, i.text]));
      let curY = bodyTop - 2;
      orderIds.forEach((id, idx) => {
        if (curY < bottomY + 8) return;
        drawSafeLine(
          page,
          fonts.sans,
          `${idx + 1}. ${itemMap.get(id) || id}`.slice(0, 74),
          rx + 8,
          curY,
          8,
          rgb(0.1, 0.22, 0.32)
        );
        curY -= 13;
      });
    } else if (q.type === 'reading') {
      let curY = bodyTop - 2;
      for (const sq of q.readingSubQuestions || []) {
        if (curY < bottomY + 8) break;
        const val = ans?.readingAnswers?.[sq.id] || '(Chưa trả lời)';
        drawSafeLine(
          page,
          fonts.sans,
          `${sq.prompt.slice(0, 38)} => ${val}`.slice(0, 76),
          rx + 8,
          curY,
          8,
          rgb(0.08, 0.26, 0.36)
        );
        curY -= 13;
      }
    } else if (q.type === 'drawing') {
      const strokes = ans?.drawingStrokes || [];
      const drawAreaTop = topY - 22;
      const drawAreaH = Math.max(20, rh - 26);
      for (const stroke of strokes) {
        if (stroke.points.length < 2) continue;
        const hex = (stroke.color || '#164E63').replace('#', '');
        const num = parseInt(hex.padEnd(6, '0').slice(0, 6), 16);
        const col = Number.isNaN(num)
          ? rgb(0.09, 0.31, 0.39)
          : rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
        for (let i = 1; i < stroke.points.length; i++) {
          const p1 = stroke.points[i - 1];
          const p2 = stroke.points[i];
          // Strokes are stored in normalized 0..1 relative to drawing box
          const x1 = rx + 6 + p1.x * (rw - 12);
          const y1 = drawAreaTop - p1.y * drawAreaH;
          const x2 = rx + 6 + p2.x * (rw - 12);
          const y2 = drawAreaTop - p2.y * drawAreaH;
          page.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            thickness: Math.max(0.8, Math.min(4, stroke.width * 0.65)),
            color: col,
          });
        }
      }
      if (strokes.length === 0) {
        drawSafeLine(page, fonts.sans, '(Chưa có nét vẽ)', rx + 10, bodyTop - 10, 8, rgb(0.5, 0.55, 0.6));
      }
    } else if (q.type === 'diagram_label') {
      const labels = ans?.diagramLabels || {};
      let curY = bodyTop - 2;
      for (const pin of q.diagramPins || []) {
        if (curY < bottomY + 8) break;
        const val = labels[pin.id] || '(Chưa chú thích)';
        drawSafeLine(
          page,
          fonts.sans,
          `${pin.code} ${pin.hint ? `(${pin.hint})` : ''}: ${val}`.slice(0, 72),
          rx + 8,
          curY,
          8,
          rgb(0.03, 0.45, 0.39)
        );
        curY -= 13;
      }
    } else if (q.type === 'attachment') {
      const atts = ans?.attachments || [];
      if (atts.length === 0) {
        drawSafeLine(page, fonts.sans, 'Chưa đính kèm tệp sản phẩm.', rx + 8, bodyTop - 6, 8.2, rgb(0.5, 0.55, 0.6));
      } else {
        let curY = bodyTop - 2;
        for (const a of atts) {
          if (curY < bottomY + 8) break;
          drawSafeLine(
            page,
            fonts.sans,
            `• ${a.fileName} (${Math.max(1, Math.round(a.size / 1024))} KB)`,
            rx + 8,
            curY,
            8,
            rgb(0.09, 0.31, 0.39)
          );
          curY -= 12;
        }
      }
    }

    // Teacher question-level note if present
    if (grade?.teacherNote) {
      drawSafeLine(
        page,
        fonts.sans,
        `GV: ${grade.teacherNote}`.slice(0, 74),
        rx + 6,
        bottomY + 4,
        7.5,
        rgb(0.78, 0.14, 0.14)
      );
    }
  }

  return pdfDoc.save();
}

// ============================================================================
// EXCEL GRADEBOOK EXPORT (.xlsx)
// ============================================================================

export function buildInteractiveGradebookBuffer(
  worksheet: InteractiveWorksheet,
  records: GradedSubmissionRecord[]
): Uint8Array {
  const headers = [
    'STT',
    'Họ và tên',
    'Lớp',
    'Mã học sinh',
    'Mã bài tập',
    'Trạng thái chấm',
    'Thời gian nộp',
    ...worksheet.questions.map((q) => `${q.code} (${q.maxPoints}đ)`),
    `Tổng điểm (/${worksheet.questions.reduce((s, q) => s + q.maxPoints, 0)}đ)`,
    'Nhận xét giáo viên',
  ];

  const rows = records.map((rec, index) => {
    const statusLabel =
      rec.status === 'graded'
        ? 'Đã chấm xong'
        : rec.status === 'in_progress'
          ? 'Đang chấm'
          : 'Chưa chấm';
    const qCols = worksheet.questions.map((q) => {
      const d = rec.gradingDetails[q.id];
      return typeof d?.earnedPoints === 'number' ? d.earnedPoints : '';
    });
    return [
      index + 1,
      rec.student.studentName,
      rec.student.className,
      rec.student.studentCode,
      rec.worksheetId,
      statusLabel,
      new Date(rec.submittedAt).toLocaleString('vi-VN'),
      ...qCols,
      rec.totalScore,
      rec.teacherComment || '',
    ];
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`BẢNG ĐIỂM BÀI TẬP PDF TƯƠNG TÁC — ${worksheet.title}`],
    [`Môn: ${worksheet.subjectLabel} · Lớp ${worksheet.grade} · Xuất lúc: ${new Date().toLocaleString('vi-VN')}`],
    [],
    headers,
    ...rows,
  ]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    ...worksheet.questions.map(() => ({ wch: 13 })),
    { wch: 16 },
    { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'BangDiem');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Uint8Array(out);
}

export function triggerInteractiveDownload(bytes: Uint8Array, fileName: string, mimeType: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1500);
}
