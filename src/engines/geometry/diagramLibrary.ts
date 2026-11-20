import type { SubjectCategory } from '../../types/studio';
import { MATH_PLANE_DIAGRAMS } from './diagramsMathPlane';
import { MATH_SPACE_GRAPH_DIAGRAMS } from './diagramsMathSpace';
import { CHEMISTRY_DIAGRAMS, PHYSICS_DIAGRAMS } from './diagramsScience';
import type { DiagramRenderConfig, ScientificDiagramItem } from './diagramHelpers';

export type { DiagramRenderConfig, ScientificDiagramItem };

export const MATH_DIAGRAMS: ScientificDiagramItem[] = [
  ...MATH_PLANE_DIAGRAMS,
  ...MATH_SPACE_GRAPH_DIAGRAMS,
];

export const SCIENTIFIC_DIAGRAM_LIBRARY: ScientificDiagramItem[] = [
  ...MATH_DIAGRAMS,
  ...PHYSICS_DIAGRAMS,
  ...CHEMISTRY_DIAGRAMS,
];

export function getDiagramByKey(key: string): ScientificDiagramItem | undefined {
  return SCIENTIFIC_DIAGRAM_LIBRARY.find((d) => d.key === key);
}

export function getPrioritizedDiagrams(subjectHint: SubjectCategory): ScientificDiagramItem[] {
  if (subjectHint === 'physics') {
    return [...PHYSICS_DIAGRAMS, ...MATH_DIAGRAMS, ...CHEMISTRY_DIAGRAMS];
  }
  if (subjectHint === 'chemistry') {
    return [...CHEMISTRY_DIAGRAMS, ...MATH_DIAGRAMS, ...PHYSICS_DIAGRAMS];
  }
  return SCIENTIFIC_DIAGRAM_LIBRARY;
}
