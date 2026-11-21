import type { GradingSession, StudioObject, SubjectCategory } from '../types/studio';
import { createStructuredSamplePdf, type StructuredSamplePdfSpec } from './pdfSampleLayout';
import { getDiagramByKey } from '../engines/geometry/diagramLibrary';
import { compileLatexToSvg } from '../engines/mathematics/formulaEngine';
import { createDefaultGradingSession } from '../engines/grading/gradingEngine';

export interface StructuredSamplePayload {
  pdfBytes: Uint8Array;
  initialObjects: (firstPageId: string) => StudioObject[];
  grading?: GradingSession;
}

export function makeDiagramObj(
  id: string,
  diagramKey: string,
  subject: SubjectCategory,
  pageId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zIndex = 2
): StudioObject[] {
  const diag = getDiagramByKey(diagramKey);
  if (!diag) return [];
  return [
    {
      id,
      type: 'diagram',
      pageId,
      x,
      y,
      width,
      height,
      rotation: 0,
      zIndex,
      opacity: 1,
      title: diag.title,
      diagramKey: diag.key,
      subject,
      svgMarkup: diag.render({ strokeColor: '#164E63', strokeWidth: 1.6, labels: [] }),
      strokeColor: '#164E63',
      strokeWidth: 1.6,
      strokeStyle: 'solid',
      labels: [],
      sourceKind: 'library',
    },
  ];
}

export function makeFormulaObj(
  id: string,
  latex: string,
  pageId: string,
  x: number,
  y: number,
  color = '#164E63',
  fontSize = 16,
  zIndex = 3
): StudioObject {
  const compiled = compileLatexToSvg(latex, color, fontSize);
  return {
    id,
    type: 'formula',
    pageId,
    x,
    y,
    width: Math.min(480, compiled.widthPx),
    height: compiled.heightPx,
    rotation: 0,
    zIndex,
    opacity: 1,
    latex,
    svgMarkup: compiled.svgMarkup,
    color,
    fontSize,
  };
}

export function buildRubricSession(
  title: string,
  subject: string,
  className: string,
  criteria: Array<{ id: string; label: string; maxScore: number }>
): GradingSession {
  const session = createDefaultGradingSession(title, subject);
  session.className = className;
  session.mode = 'essay';
  session.scaleMax = Math.round(criteria.reduce((sum, c) => sum + c.maxScore, 0) * 100) / 100;
  session.questions = criteria.map((c) => ({
    id: c.id,
    label: c.label,
    maxScore: c.maxScore,
    earnedScore: null,
    subParts: [],
  }));
  return session;
}

export function buildMcqSession(
  title: string,
  subject: string,
  className: string,
  items: Array<{ number: number; kind: 'abcd' | 'tf4' | 'short'; answerKey: string; maxScore: number }>
): GradingSession {
  const session = createDefaultGradingSession(title, subject);
  session.className = className;
  session.mode = 'mcq';
  session.scaleMax = Math.round(items.reduce((s, i) => s + i.maxScore, 0) * 100) / 100;
  session.mcqItems = items.map((it, idx) => ({
    id: `m-${idx + 1}`,
    number: it.number,
    kind: it.kind,
    answerKey: it.answerKey,
    studentAnswer: '',
    maxScore: it.maxScore,
  }));
  return session;
}

export async function buildStructuredPayload(
  spec: StructuredSamplePdfSpec,
  initialObjects: (firstPageId: string) => StudioObject[] = () => [],
  grading?: GradingSession
): Promise<StructuredSamplePayload> {
  const pdfBytes = await createStructuredSamplePdf(spec);
  return { pdfBytes, initialObjects, grading };
}
