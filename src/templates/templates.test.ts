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
  it('registers exactly 10 templates with unique ids and bilingual metadata', () => {
    expect(TEMPLATE_REGISTRY).toHaveLength(10);
    const ids = TEMPLATE_REGISTRY.map((t) => t.id);
    expect(new Set(ids).size).toBe(10);
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

/** Extracts the plain text of one table cell's rich-text content. */
function cellText(cell: { content: unknown }): string {
  const content = cell.content as { content?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (!content?.content) return '';
  return content.content
    .map((p) => (p.content ? p.content.map((n) => (n.type === 'text' ? n.text ?? '' : '')).join('') : ''))
    .join(' ');
}

/** Returns the (single) table object of a template document as a text grid. */
function tableGrid(doc: RePageDocument): string[][] {
  const tables = Object.values(doc.objects).filter((o) => o.type === 'table');
  expect(tables).toHaveLength(1);
  const table = tables[0]!;
  if (table.type !== 'table') throw new Error('expected table');
  return table.rows.map((row) => row.cells.map(cellText));
}

describe('result-card structure', () => {
  it('has a real marks table (7 subjects + total), summary line, remarks and 3 signatures', () => {
    const doc = getTemplate('result-card')!.build();
    const grid = tableGrid(doc);
    // Header + 7 subjects + total row, 3 columns.
    expect(grid).toHaveLength(9);
    for (const row of grid) expect(row).toHaveLength(3);
    expect(grid[0]).toEqual(['مضمون', 'کل نمبر', 'حاصل کردہ نمبر']);
    const subjects = grid.slice(1, 8).map((r) => r[0]);
    expect(subjects).toEqual(['اردو', 'انگریزی', 'ریاضی', 'علوم', 'معاشرتی علوم', 'اسلامیات', 'کمپیوٹر']);
    expect(grid[1]![1]).toBe('۱۰۰');
    expect(grid[8]![0]).toBe('مجموعہ');
    expect(grid[8]![1]).toBe('۶۰۰');
    // Obtained-marks cells start empty.
    for (const row of grid.slice(1)) expect(row[2]).toBe('');

    expect(countParagraphsContaining(doc, 'تعلیمی سال')).toBe(1);
    expect(countParagraphsContaining(doc, 'ولدیت')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'فیصد')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'گریڈ')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'پوزیشن')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'اساتذہ کے تاثرات')).toBe(1);
    expect(countParagraphsContaining(doc, 'دستخط والد')).toBe(1);
    expect(countParagraphsContaining(doc, 'دستخط استاد')).toBe(1);
    expect(countParagraphsContaining(doc, 'دستخط ہیڈ ٹیچر')).toBe(1);
  });
});

describe('date-sheet structure', () => {
  it('has a real schedule table with header + 8 empty rows, notes and a signature', () => {
    const doc = getTemplate('date-sheet')!.build();
    const grid = tableGrid(doc);
    expect(grid).toHaveLength(9);
    for (const row of grid) expect(row).toHaveLength(3);
    expect(grid[0]).toEqual(['تاریخ', 'دن', 'مضمون']);
    for (const row of grid.slice(1)) {
      for (const cell of row) expect(cell).toBe('');
    }
    expect(countParagraphsContaining(doc, 'امتحان:')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'کمرہ امتحان')).toBe(2);
    expect(countParagraphsContaining(doc, 'دستخط ہیڈ ٹیچر')).toBe(1);
  });
});

describe('admission-form structure', () => {
  it('has a photo box, 12 student fields, guardian section and an office-use box', () => {
    const doc = getTemplate('admission-form')!.build();
    const rects = Object.values(doc.objects).filter((o) => o.type === 'rectangle');
    expect(rects.some((r) => r.name === 'Photo box')).toBe(true);
    expect(rects.some((r) => r.name === 'Office use box')).toBe(true);
    expect(countParagraphsContaining(doc, 'تصویر')).toBe(1);
    expect(countParagraphsContaining(doc, 'فارم نمبر')).toBeGreaterThanOrEqual(1);
    for (const label of [
      'طالب علم کا نام',
      'تاریخ پیدائش',
      'فارم ب نمبر',
      'مستقل پتہ',
      'موبائل نمبر',
      'سابقہ اسکول',
      'آخری جماعت پاس',
    ]) {
      expect(countParagraphsContaining(doc, label), `missing field: ${label}`).toBeGreaterThanOrEqual(1);
    }
    expect(countParagraphsContaining(doc, 'سرپرست کی معلومات')).toBe(1);
    expect(countParagraphsContaining(doc, 'والد/سرپرست کے دستخط')).toBe(1);
    expect(countParagraphsContaining(doc, 'دفتر کے استعمال کے لیے')).toBe(1);
  });
});

describe('attendance-register structure', () => {
  it('is A4 landscape with a 34-column, 11-row real table and the mark legend', () => {
    const doc = getTemplate('attendance-register')!.build();
    const pageId = doc.pageOrder[0]!;
    const page = doc.pages[pageId]!;
    expect(page.width).toBeCloseTo(mm(297), 0);
    expect(page.height).toBeCloseTo(mm(210), 0);

    const grid = tableGrid(doc);
    // Header + 10 student rows; roll + name + 31 days + total = 34 columns.
    expect(grid).toHaveLength(11);
    for (const row of grid) expect(row).toHaveLength(34);
    expect(grid[0]![0]).toBe('رول نمبر');
    expect(grid[0]![1]).toBe('نام');
    expect(grid[0]![2]).toBe('۱');
    expect(grid[0]![32]).toBe('۳۱');
    expect(grid[0]![33]).toBe('کل حاضری');
    expect(grid[1]![0]).toBe('۱');
    expect(grid[10]![0]).toBe('۱۰');
    // Day and total cells of student rows start empty.
    expect(grid[1]!.slice(1).every((c) => c === '')).toBe(true);

    expect(countParagraphsContaining(doc, 'حاضری رجسٹر')).toBeGreaterThanOrEqual(1);
    expect(countParagraphsContaining(doc, 'ح = حاضر')).toBe(1);
    expect(countParagraphsContaining(doc, 'غ = غیر حاضر')).toBeGreaterThanOrEqual(1);
  });
});
