/**
 * Template gallery tests: every template must build, validate (zod),
 * pass preflight with zero errors AND zero warnings, and contain its
 * key structural elements.
 */
import { describe, expect, it } from 'vitest';
import { documentSchema } from '../domain/document/schema';
import { runPreflightCheck } from '../domain/diagnostics/preflightEngine';
import { TEMPLATE_REGISTRY, getTemplate } from './index';
import { allParagraphsAligned, countParagraphsContaining, inch, mm } from './helpers';
import type { RePageDocument } from '../domain/document/types';

function expectCleanDocument(doc: RePageDocument, label: string): void {
  const parsed = documentSchema.safeParse(doc);
  expect(parsed.success, `${label}: zod validation failed: ${JSON.stringify(parsed.error?.issues.slice(0, 3))}`).toBe(true);

  const preflight = runPreflightCheck(doc);
  expect(
    preflight.errorCount,
    `${label}: preflight errors: ${preflight.issues.filter((i) => i.severity === 'error').map((i) => i.message).join(' | ')}`,
  ).toBe(0);
  expect(
    preflight.warningCount,
    `${label}: preflight warnings: ${preflight.issues.filter((i) => i.severity === 'warning').map((i) => i.message).join(' | ')}`,
  ).toBe(0);
}

describe('template gallery registry', () => {
  it('registers exactly 6 templates with unique ids and bilingual metadata', () => {
    expect(TEMPLATE_REGISTRY).toHaveLength(6);
    const ids = TEMPLATE_REGISTRY.map((t) => t.id);
    expect(new Set(ids).size).toBe(6);
    for (const t of TEMPLATE_REGISTRY) {
      expect(t.titleUr.trim().length).toBeGreaterThan(0);
      expect(t.titleEn.trim().length).toBeGreaterThan(0);
      expect(t.descriptionUr.trim().length).toBeGreaterThan(0);
      expect(t.descriptionEn.trim().length).toBeGreaterThan(0);
      expect(getTemplate(t.id)).toBe(t);
    }
  });

  it('returns undefined for unknown template ids', () => {
    expect(getTemplate('does-not-exist')).toBeUndefined();
  });
});

describe.each(TEMPLATE_REGISTRY.map((t) => [t.id, t.titleEn] as const))(
  'template %s (%s)',
  (id) => {
    it('builds without throwing and produces a clean document', () => {
      const template = getTemplate(id);
      expect(template).toBeDefined();
      const doc = template!.build();
      expect(doc.metadata.locale).toBe('ur-PK');
      expectCleanDocument(doc, id);
    });
  },
);

describe('exam-paper structure', () => {
  it('has a header, instructions, at least 5 questions and a page footer', () => {
    const doc = getTemplate('exam-paper')!.build();
    expect(countParagraphsContaining(doc, 'سوال نمبر')).toBeGreaterThanOrEqual(5);
    expect(countParagraphsContaining(doc, 'نوٹ:')).toBe(1);
    expect(countParagraphsContaining(doc, 'کل نمبر')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'صفحہ نمبر')).toBe(1);
    expect(countParagraphsContaining(doc, '(نمبر:')).toBeGreaterThanOrEqual(5);
  });
});

describe('worksheet structure', () => {
  it('has student info line, 3 exercises and ruled answer space', () => {
    const doc = getTemplate('worksheet')!.build();
    expect(countParagraphsContaining(doc, 'نام:')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'مشق')).toBeGreaterThanOrEqual(3);
    let ruled = 0;
    for (const story of Object.values(doc.stories)) {
      for (const p of story.content.content) {
        if (p.border?.side === 'bottom') ruled += 1;
      }
    }
    expect(ruled).toBeGreaterThanOrEqual(12);
  });
});

describe('shaadi-card structure', () => {
  it('is fully centered on a 5x7 inch card with a double border', () => {
    const doc = getTemplate('shaadi-card')!.build();
    expect(allParagraphsAligned(doc, 'center')).toBe(true);
    const pageId = doc.pageOrder[0]!;
    const page = doc.pages[pageId]!;
    expect(page.width).toBeCloseTo(inch(5), 0);
    expect(page.height).toBeCloseTo(inch(7), 0);
    expect(countParagraphsContaining(doc, 'بسم اللہ')).toBe(1);
    expect(countParagraphsContaining(doc, 'دولہے کا نام')).toBe(1);
    expect(countParagraphsContaining(doc, 'دلہن کا نام')).toBe(1);
    const borders = Object.values(doc.objects).filter(
      (o) => o.type === 'rectangle' && o.name === 'Page border',
    );
    expect(borders.length).toBe(2);
  });
});

describe('newspaper-column structure', () => {
  it('has a two-column RTL body, headline and byline', () => {
    const doc = getTemplate('newspaper-column')!.build();
    expect(countParagraphsContaining(doc, 'سرخی')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'از:')).toBe(1);
    const bodyFrames = Object.values(doc.objects).filter(
      (o) => o.type === 'text-frame' && o.name === 'Column body',
    );
    expect(bodyFrames).toHaveLength(1);
    const body = bodyFrames[0]!;
    if (body.type !== 'text-frame') throw new Error('expected text frame');
    expect(body.columns).toBe(2);
    expect(body.rtlColumnOrder).toBe(true);
  });
});

describe('letterhead structure', () => {
  it('has org header, ref/date line, body and signature block', () => {
    const doc = getTemplate('letterhead')!.build();
    expect(countParagraphsContaining(doc, 'ادارے کا نام')).toBe(1);
    expect(countParagraphsContaining(doc, 'حوالہ نمبر')).toBe(1);
    expect(countParagraphsContaining(doc, 'تاریخ:')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'دستخط')).toBe(1);
    expect(countParagraphsContaining(doc, 'السلام علیکم')).toBe(1);
  });
});

describe('naat-page structure', () => {
  it('is an A5 page with centered verses and a page number', () => {
    const doc = getTemplate('naat-page')!.build();
    const pageId = doc.pageOrder[0]!;
    const page = doc.pages[pageId]!;
    expect(page.width).toBeCloseTo(mm(148), 0);
    expect(page.height).toBeCloseTo(mm(210), 0);
    expect(allParagraphsAligned(doc, 'center')).toBe(true);
    expect(countParagraphsContaining(doc, 'سلام')).toBeGreaterThanOrEqual(4);
    expect(countParagraphsContaining(doc, 'نعتِ رسولِ مقبول')).toBe(1);
  });
});
