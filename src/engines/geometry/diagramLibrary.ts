import type { SubjectCategory } from '../../types/studio';
import { MATH_PLANE_DIAGRAMS } from './diagramsMathPlane';
import { MATH_SPACE_GRAPH_DIAGRAMS } from './diagramsMathSpace';
import { CHEMISTRY_DIAGRAMS, PHYSICS_DIAGRAMS } from './diagramsScience';
import {
  ENGLISH_DIAGRAMS,
  GEOGRAPHY_DIAGRAMS,
  HISTORY_DIAGRAMS,
  SOCIAL_ENGLISH_DIAGRAMS,
} from './diagramsSocialEng';
import {
  BIO_CS_EXTRA_DIAGRAMS,
  BIOLOGY_DIAGRAMS,
  CS_DIAGRAMS,
  EXTRA_SCIENCE_DIAGRAMS,
} from './diagramsBioCs';
import type { DiagramRenderConfig, ScientificDiagramItem } from './diagramHelpers';

export type { DiagramRenderConfig, ScientificDiagramItem };

export const MATH_DIAGRAMS: ScientificDiagramItem[] = [
  ...MATH_PLANE_DIAGRAMS,
  ...MATH_SPACE_GRAPH_DIAGRAMS,
];

export const ALL_PHYSICS_DIAGRAMS: ScientificDiagramItem[] = [
  ...PHYSICS_DIAGRAMS,
  ...EXTRA_SCIENCE_DIAGRAMS.filter((d) => d.subject === 'physics'),
];

export const ALL_CHEMISTRY_DIAGRAMS: ScientificDiagramItem[] = [
  ...CHEMISTRY_DIAGRAMS,
  ...EXTRA_SCIENCE_DIAGRAMS.filter((d) => d.subject === 'chemistry'),
];

export const SCIENTIFIC_DIAGRAM_LIBRARY: ScientificDiagramItem[] = [
  ...MATH_DIAGRAMS,
  ...ALL_PHYSICS_DIAGRAMS,
  ...ALL_CHEMISTRY_DIAGRAMS,
  ...BIOLOGY_DIAGRAMS,
  ...CS_DIAGRAMS,
  ...SOCIAL_ENGLISH_DIAGRAMS,
];

export function getDiagramByKey(key: string): ScientificDiagramItem | undefined {
  return SCIENTIFIC_DIAGRAM_LIBRARY.find((d) => d.key === key);
}

export function getPrioritizedDiagrams(subjectHint: SubjectCategory): ScientificDiagramItem[] {
  if (subjectHint === 'physics') {
    return [...ALL_PHYSICS_DIAGRAMS, ...MATH_DIAGRAMS, ...ALL_CHEMISTRY_DIAGRAMS, ...BIOLOGY_DIAGRAMS, ...CS_DIAGRAMS, ...SOCIAL_ENGLISH_DIAGRAMS];
  }
  if (subjectHint === 'chemistry') {
    return [...ALL_CHEMISTRY_DIAGRAMS, ...MATH_DIAGRAMS, ...ALL_PHYSICS_DIAGRAMS, ...BIOLOGY_DIAGRAMS, ...CS_DIAGRAMS, ...SOCIAL_ENGLISH_DIAGRAMS];
  }
  if (subjectHint === 'biology') {
    return [...BIOLOGY_DIAGRAMS, ...ALL_CHEMISTRY_DIAGRAMS, ...MATH_DIAGRAMS, ...ALL_PHYSICS_DIAGRAMS, ...CS_DIAGRAMS, ...SOCIAL_ENGLISH_DIAGRAMS];
  }
  if (subjectHint === 'cs') {
    return [...CS_DIAGRAMS, ...MATH_DIAGRAMS, ...ALL_PHYSICS_DIAGRAMS, ...BIOLOGY_DIAGRAMS, ...ALL_CHEMISTRY_DIAGRAMS, ...SOCIAL_ENGLISH_DIAGRAMS];
  }
  if (subjectHint === 'geography') {
    return [...GEOGRAPHY_DIAGRAMS, ...MATH_DIAGRAMS, ...HISTORY_DIAGRAMS, ...ENGLISH_DIAGRAMS, ...BIO_CS_EXTRA_DIAGRAMS, ...PHYSICS_DIAGRAMS, ...CHEMISTRY_DIAGRAMS];
  }
  if (subjectHint === 'history') {
    return [...HISTORY_DIAGRAMS, ...GEOGRAPHY_DIAGRAMS, ...ENGLISH_DIAGRAMS, ...MATH_DIAGRAMS, ...BIO_CS_EXTRA_DIAGRAMS, ...PHYSICS_DIAGRAMS, ...CHEMISTRY_DIAGRAMS];
  }
  if (subjectHint === 'english') {
    return [...ENGLISH_DIAGRAMS, ...HISTORY_DIAGRAMS, ...GEOGRAPHY_DIAGRAMS, ...MATH_DIAGRAMS, ...BIO_CS_EXTRA_DIAGRAMS, ...PHYSICS_DIAGRAMS, ...CHEMISTRY_DIAGRAMS];
  }
  return SCIENTIFIC_DIAGRAM_LIBRARY;
}
