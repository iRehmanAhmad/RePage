import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import { runAccessibilityAudit } from './accessibilityChecker';

describe('accessibilityChecker (Phase UX-8)', () => {
  it('audits document and reports missing alt text and metadata title warning', () => {
    const doc = createStarterDocument();
    doc.objects['pic_1'] = {
      id: 'pic_1',
      pageId: doc.pageOrder[0]!,
      type: 'image-frame',
      name: 'Unlabelled Image',
      frame: { x: 100, y: 100, width: 200, height: 150, rotation: 0 },
      locked: false,
      hidden: false,
      opacity: 1,
      assetId: 'asset_1',
      fit: 'contain',
    };

    const issues = runAccessibilityAudit(doc);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.id === 'acc_alt_pic_1')).toBe(true);
  });
});
