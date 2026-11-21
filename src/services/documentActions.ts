import { SAMPLE_DOCUMENTS } from '../samples/sampleCatalog';
import { storageService } from './storageService';
import { useStudioStore } from '../stores/useStudioStore';
import type { ImageStudioObject, StudioDocument, SubjectCategory } from '../types/studio';

/**
 * Lazy-load PDF & sample engines only when the user actively opens, creates,
 * or exports a document — keeps initial UI startup instant and immune to engine errors.
 */
const loadPdfEngine = () => import('../engines/pdf/pdfEngine');
const loadSampleGenerator = () => import('../samples/sampleDocuments');

function detectSubjectHint(fileName: string): SubjectCategory {
  const lower = fileName.toLowerCase();
  if (/(toan|math|giai_tich|hinh_hoc|dai_so|ham_so)/.test(lower)) return 'math';
  if (/(ly|li|phys|vat_li|dien|quang|co_hoc)/.test(lower)) return 'physics';
  if (/(hoa|chem|axit|phan_ung|huu_co)/.test(lower)) return 'chemistry';
  if (/(sinh|bio|di_truyen|te_bao)/.test(lower)) return 'biology';
  if (/(tin|cs|code|thuat_toan|lap_trinh)/.test(lower)) return 'cs';
  if (/(dia_li|diali|geo|ban_do|bieu_do)/.test(lower)) return 'geography';
  if (/(lich_su|lichsu|hist|su_hoc|tu_lieu)/.test(lower)) return 'history';
  if (/(tieng_anh|english|eng_|reading|listening|speaking|writing|grammar)/.test(lower)) return 'english';
  return 'general';
}

export async function openFilesInStudio(files: FileList | File[]): Promise<void> {
  const store = useStudioStore.getState();
  const list = Array.from(files);
  if (list.length === 0) return;

  store.setBusy(`Đang mở ${list.length} tệp trên thiết bị...`);
  try {
    for (const file of list) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.pdfedu')) {
        const { peekPdfEduPackageKind } = await import('../features/interactive/interactiveEngine');
        const pkgKind = await peekPdfEduPackageKind(file);
        if (pkgKind === 'worksheet' || pkgKind === 'submission' || pkgKind === 'teacher-master') {
          const targetTab =
            pkgKind === 'worksheet'
              ? 'solve'
              : pkgKind === 'submission'
                ? 'grade'
                : 'author';
          store.openInteractive(targetTab, file);
          continue;
        }
        const { loadProjectBundle } = await loadPdfEngine();
        const loaded = await loadProjectBundle(file);
        store.openDocument({
          title: loaded.title,
          fileName: loaded.fileName,
          pdfBytes: loaded.pdfBytes,
          pages: loaded.pages,
          objects: loaded.objects,
          grading: loaded.grading,
          watermark: loaded.watermark,
          pageNumbers: loaded.pageNumbers,
          subjectHint: loaded.subjectHint,
        });
        store.notify(`Đã mở dự án "${loaded.title}"`, 'success');
      } else if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
        const { inspectPdfBytes } = await loadPdfEngine();
        const bytes = new Uint8Array(await file.arrayBuffer());
        const inspected = await inspectPdfBytes(bytes);
        const title = file.name.replace(/\.pdf$/i, '');
        store.openDocument({
          title,
          fileName: file.name,
          pdfBytes: bytes,
          pages: inspected.pages,
          subjectHint: detectSubjectHint(file.name),
        });
        store.notify(`Đã mở "${file.name}" (${inspected.pages.length} trang)`, 'success');
      } else if (file.type.startsWith('image/')) {
        await insertImageFileToActiveDoc(file);
      } else {
        store.notify(`Định dạng "${file.name}" chưa được hỗ trợ trực tiếp.`, 'warning');
      }
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    store.setPdfError({
      title: 'Không thể mở tài liệu PDF',
      message: 'Không thể mở tài liệu PDF. Vui lòng thử lại.',
      detail,
      onRetry: () => {
        openFilesInStudio(list);
      },
    });
  } finally {
    store.setBusy(null);
  }
}

export async function createNewBlankDocument(pageCount = 1, title = 'Tài liệu mới'): Promise<void> {
  const store = useStudioStore.getState();
  store.setBusy('Đang tạo tài liệu PDF mới...');
  try {
    const { createBlankPdf, inspectPdfBytes } = await loadPdfEngine();
    const bytes = await createBlankPdf(pageCount, title);
    const inspected = await inspectPdfBytes(bytes);
    store.openDocument({
      title,
      fileName: `${title.replace(/\s+/g, '_')}.pdf`,
      pdfBytes: bytes,
      pages: inspected.pages,
      subjectHint: 'general',
    });
    store.notify('Đã tạo tài liệu PDF trống khổ A4', 'success');
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    store.setPdfError({
      title: 'Không thể tạo tài liệu PDF mới',
      message: 'Không thể mở tài liệu PDF. Vui lòng thử lại.',
      detail,
      onRetry: () => {
        createNewBlankDocument(pageCount, title);
      },
    });
  } finally {
    store.setBusy(null);
  }
}

export async function openSampleInStudio(sampleId: string): Promise<void> {
  const store = useStudioStore.getState();
  const meta = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
  if (!meta) return;

  store.setBusy(`Đang mở tài liệu mẫu: ${meta.title}...`);
  try {
    const [{ generateSampleDocument }, { inspectPdfBytes }] = await Promise.all([
      loadSampleGenerator(),
      loadPdfEngine(),
    ]);
    const built = await generateSampleDocument(sampleId);
    const inspected = await inspectPdfBytes(built.pdfBytes);
    const firstPageId = inspected.pages[0]?.id || 'p-0';
    const objects = built.initialObjects(firstPageId);

    // Ensure direct opening in PDF viewer/editor without any blocking modal or guide overlay
    store.closeGuide();
    store.setActiveModal(null);

    store.openDocument({
      id: `sample-${sampleId}-${Date.now()}`,
      title: meta.title,
      fileName: `${sampleId}.pdf`,
      pdfBytes: built.pdfBytes,
      pages: inspected.pages,
      objects,
      grading: built.grading,
      subjectHint: meta.subject,
    });

    if (meta.isGradingSample) {
      store.setRibbonTab('grade');
    } else if (meta.subject === 'math' && sampleId.includes('space')) {
      store.setRibbonTab('draw');
    } else {
      store.setRibbonTab('edit');
    }
    store.notify(`Đã mở tài liệu mẫu "${meta.title}"`, 'success');
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    store.setPdfError({
      title: 'Không thể mở tài liệu mẫu',
      message: 'Không thể mở tài liệu PDF. Vui lòng thử lại.',
      detail,
      onRetry: () => {
        openSampleInStudio(sampleId);
      },
    });
  } finally {
    store.setBusy(null);
  }
}

/**
 * Generates a fresh, real PDF byte array for inline PDF.js preview on the Library screen
 * without modifying any active workspace state.
 */
export async function buildSamplePreviewBytes(sampleId: string): Promise<Uint8Array> {
  const { generateSampleDocument } = await loadSampleGenerator();
  const built = await generateSampleDocument(sampleId);
  return built.pdfBytes;
}

/**
 * Generates a standalone copy of a sample document (embedding initial vector diagrams/formulas
 * into the output PDF when present) and downloads it as a new .pdf file without mutating the template.
 */
export async function downloadSampleAsNewPdf(sampleId: string): Promise<void> {
  const store = useStudioStore.getState();
  const meta = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
  if (!meta) return;

  store.setBusy(`Đang tạo bản sao PDF mới: ${meta.title}...`);
  try {
    const [{ generateSampleDocument }, { inspectPdfBytes, exportDocumentToPdf, triggerDownload }] =
      await Promise.all([loadSampleGenerator(), loadPdfEngine()]);
    const built = await generateSampleDocument(sampleId);
    const inspected = await inspectPdfBytes(built.pdfBytes);
    const firstPageId = inspected.pages[0]?.id || 'p-0';
    const initialObjs = built.initialObjects(firstPageId);

    let outBytes = built.pdfBytes;
    if (initialObjs.length > 0) {
      const tempDoc: StudioDocument = {
        id: `export-sample-${sampleId}`,
        title: meta.title,
        fileName: `${sampleId}.pdf`,
        originalPdfBytes: built.pdfBytes,
        currentPdfBytes: built.pdfBytes,
        pages: inspected.pages,
        objects: initialObjs,
        grading:
          built.grading ||
          (await import('../engines/grading/gradingEngine')).createDefaultGradingSession(
            meta.title,
            meta.subjectLabel
          ),
        watermark: {
          enabled: false,
          kind: 'text',
          text: '',
          fontSize: 36,
          rotation: -35,
          opacity: 0.14,
          color: '#164E63',
          position: 'center',
          scope: 'all',
        },
        pageNumbers: {
          enabled: false,
          position: 'footer',
          align: 'center',
          startNumber: 1,
          fontSize: 10,
          color: '#475569',
          format: 'number',
        },
        subjectHint: meta.subject,
        zoom: 1,
        viewMode: 'continuous',
        currentPageIndex: 0,
        isDirty: false,
        isConfidential: false,
        history: [],
        historyIndex: 0,
      };
      const exported = await exportDocumentToPdf(tempDoc, {
        includeAnnotations: true,
        applyRedactions: false,
        sanitizeMetadata: false,
      });
      outBytes = exported.bytes;
    }

    const outName = `${sampleId}_ban_sao.pdf`;
    triggerDownload(new Blob([new Uint8Array(outBytes)], { type: 'application/pdf' }), outName);
    store.notify(`Đã tải bản sao PDF mới "${outName}" (${inspected.pages.length} trang)`, 'success');
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    store.setPdfError({
      title: 'Không thể lưu bản sao PDF',
      message: 'Không thể tạo bản sao tài liệu PDF. Vui lòng thử lại.',
      detail,
      onRetry: () => {
        downloadSampleAsNewPdf(sampleId);
      },
    });
  } finally {
    store.setBusy(null);
  }
}

export async function openDraftById(draftId: string): Promise<void> {
  const store = useStudioStore.getState();
  store.setBusy('Đang khôi phục bản nháp từ bộ nhớ cục bộ...');
  try {
    const draft = await storageService.loadDraft(draftId);
    if (!draft) {
      store.notify('Không tìm thấy dữ liệu bản nháp cục bộ.', 'warning');
      return;
    }
    store.openDocument({
      id: draft.id,
      title: draft.title,
      fileName: draft.fileName,
      pdfBytes: draft.currentPdfBytes,
      pages: draft.pages,
      objects: draft.objects,
      grading: draft.grading,
      watermark: draft.watermark,
      pageNumbers: draft.pageNumbers,
      subjectHint: draft.subjectHint,
    });
    store.notify(`Đã mở lại "${draft.title}"`, 'success');
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    store.setPdfError({
      title: 'Không thể mở lại tài liệu gần đây',
      message: 'Không thể mở tài liệu PDF. Vui lòng thử lại.',
      detail,
      onRetry: () => {
        openDraftById(draftId);
      },
    });
  } finally {
    store.setBusy(null);
  }
}

export async function quickSavePdf(doc: StudioDocument, saveAsNew = false): Promise<void> {
  const store = useStudioStore.getState();
  store.setBusy('Đang xuất tệp PDF chuẩn (nhúng font tiếng Việt & hình vector)...');
  try {
    const { exportDocumentToPdf, triggerDownload } = await loadPdfEngine();
    const result = await exportDocumentToPdf(doc, {
      includeAnnotations: true,
      applyRedactions: true,
      sanitizeMetadata: false,
    });
    const baseName = doc.fileName.replace(/\.pdf$/i, '');
    const suffix = saveAsNew ? `_ban_moi_${new Date().toISOString().slice(0, 10)}` : '_da_chinh_sua';
    const outName = `${baseName}${suffix}.pdf`;
    triggerDownload(new Blob([new Uint8Array(result.bytes)], { type: 'application/pdf' }), outName);
    store.markDocSaved(doc.id);
    if (result.redactedPagesCount > 0) {
      store.notify(
        result.redactionVerifiedClean
          ? `Đã lưu "${outName}" và xác minh xóa vĩnh viễn nội dung ở ${result.redactedPagesCount} trang.`
          : `Đã lưu "${outName}" (${result.redactedPagesCount} trang đã áp dụng xóa vĩnh viễn).`,
        'success'
      );
    } else {
      store.notify(`Đã lưu tệp PDF mới "${outName}" (tệp gốc được giữ nguyên).`, 'success');
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    store.setPdfError({
      title: 'Không thể lưu tệp PDF',
      message: 'Không thể xuất tài liệu PDF. Vui lòng thử lại.',
      detail,
      onRetry: () => {
        quickSavePdf(doc, saveAsNew);
      },
    });
  } finally {
    store.setBusy(null);
  }
}

export async function quickSaveProjectBundle(doc: StudioDocument): Promise<void> {
  const store = useStudioStore.getState();
  store.setBusy('Đang đóng gói dự án .pdfedu...');
  try {
    const { saveProjectBundle, triggerDownload } = await loadPdfEngine();
    const blob = await saveProjectBundle(doc);
    const outName = `${doc.fileName.replace(/\.pdf$/i, '')}.pdfedu`;
    triggerDownload(blob, outName);
    store.markDocSaved(doc.id);
    store.notify(`Đã lưu dự án "${outName}" (có thể mở lại để sửa mọi công thức, hình vẽ, điểm số).`, 'success');
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    store.setPdfError({
      title: 'Không thể lưu dự án .pdfedu',
      message: 'Không thể đóng gói dự án. Vui lòng thử lại.',
      detail,
      onRetry: () => {
        quickSaveProjectBundle(doc);
      },
    });
  } finally {
    store.setBusy(null);
  }
}

export async function insertImageFileToActiveDoc(file: File): Promise<void> {
  const store = useStudioStore.getState();
  const doc = store.documents.find((d) => d.id === store.activeDocId);
  if (!doc) {
    store.notify('Vui lòng mở một tài liệu PDF trước khi chèn hình ảnh.', 'warning');
    return;
  }
  const page = doc.pages[doc.currentPageIndex];
  if (!page) return;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const dims = await new Promise<{ w: number; h: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 240, h: img.naturalHeight || 160 });
    img.onerror = () => resolve({ w: 240, h: 160 });
    img.src = dataUrl;
  });

  const maxW = Math.min(280, page.width * 0.55);
  const scale = maxW / Math.max(dims.w, 1);
  const obj: ImageStudioObject = {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    type: 'image',
    pageId: page.id,
    x: Math.max(40, (page.width - dims.w * scale) / 2),
    y: 120,
    width: Math.round(dims.w * scale),
    height: Math.round(dims.h * scale),
    rotation: 0,
    zIndex: 10,
    opacity: 1,
    dataUrl,
    mimeType: file.type || 'image/png',
    keepAspect: true,
    isSvg: file.type === 'image/svg+xml',
  };
  store.addObject(obj);
  store.setActiveTool('select');
  store.notify('Đã chèn hình ảnh vào trang hiện tại', 'success');
}
