import { describe, expect, it } from 'vitest';
import { createStarterDocument } from './createDocument';
import { addCaptionToObject, formatCrossReference, getCaptionPrefix } from './captionEngine';
import { addRectangle } from '../../editor/commands/documentCommands';

describe('captionEngine (Phase UX-5)', () => {
  it('returns correct localized caption prefix', () => {
    expect(getCaptionPrefix('figure', 'ur')).toBe('شکل');
    expect(getCaptionPrefix('table', 'ur')).toBe('جدول');
    expect(getCaptionPrefix('figure', 'en')).toBe('Figure');
  });

  it('adds caption to document object and generates cross-reference', () => {
    let doc = createStarterDocument();
    doc = addRectangle(doc, doc.pageOrder[0]!);
    const objectId = Object.keys(doc.objects)[0]!;

    doc = addCaptionToObject(doc, objectId, 'figure', 'نمونہ شکل (Sample Diagram)');
    expect(doc.captions).toBeDefined();

    const captionId = Object.keys(doc.captions!)[0]!;
    const ref = formatCrossReference(doc, 'figure', captionId, 'ur');
    expect(ref).toContain('شکل ۱');
    expect(ref).toContain('صفحہ');
  });
});
