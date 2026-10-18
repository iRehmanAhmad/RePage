import type { RePageDocument } from '../domain/document/types';

/**
 * A print-ready document template: a pure builder function plus the
 * bilingual metadata the gallery shows. Builders must return a complete,
 * zod-valid, preflight-clean RePageDocument — no placeholders that break
 * validation, no transliterated Urdu.
 */
export interface TemplateDefinition {
  /** Stable id, e.g. 'exam-paper'. */
  id: string;
  /** Urdu title shown in the gallery, e.g. 'امتحانی پرچہ'. */
  titleUr: string;
  /** English title shown in the gallery, e.g. 'Exam Paper'. */
  titleEn: string;
  /** One-line Urdu description for the gallery card. */
  descriptionUr: string;
  /** One-line English description for the gallery card. */
  descriptionEn: string;
  /** Human page-size label, e.g. 'A4'. */
  pageSize: string;
  /** Builds a fresh document. Must not throw for a default call. */
  build: () => RePageDocument;
}
