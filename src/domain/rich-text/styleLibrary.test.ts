import { describe, expect, it } from 'vitest';
import { createStarterDocument } from '../document/createDocument';
import {
  cleanupUnusedStyles,
  createDefaultStyleLibrary,
  importStylesIntoDocument,
  importStyleSet,
} from './styleLibrary';
import type { ObjectStyle } from './objectStyles';

describe('styleLibrary (M3.5)', () => {
  it('creates default style library with Urdu typography and object styles', () => {
    const lib = createDefaultStyleLibrary();
    expect(lib.objectStyles.poetry_callout_box).toBeDefined();
    expect(lib.paragraphStyles.headline).toBeDefined();
  });

  it('imports styles with keep-existing conflict resolution strategy', () => {
    const target: Record<string, ObjectStyle> = {
      box1: { id: 'box1', name: 'Original Box', fill: '#ffffff', stroke: '#000000', strokeWidth: 1, cornerRadius: 0, opacity: 1 },
    };
    const source: Record<string, ObjectStyle> = {
      box1: { id: 'box1', name: 'Incoming Box', fill: '#ff0000', stroke: '#000000', strokeWidth: 1, cornerRadius: 0, opacity: 1 },
      box2: { id: 'box2', name: 'New Box', fill: '#00ff00', stroke: '#000000', strokeWidth: 1, cornerRadius: 0, opacity: 1 },
    };

    const merged = importStyleSet(target, source, 'keep-existing');
    expect(merged.box1?.name).toBe('Original Box');
    expect(merged.box2?.name).toBe('New Box');
  });

  it('imports styles with overwrite conflict resolution strategy', () => {
    const target: Record<string, ObjectStyle> = {
      box1: { id: 'box1', name: 'Original Box', fill: '#ffffff', stroke: '#000000', strokeWidth: 1, cornerRadius: 0, opacity: 1 },
    };
    const source: Record<string, ObjectStyle> = {
      box1: { id: 'box1', name: 'Incoming Box', fill: '#ff0000', stroke: '#000000', strokeWidth: 1, cornerRadius: 0, opacity: 1 },
    };

    const merged = importStyleSet(target, source, 'overwrite');
    expect(merged.box1?.name).toBe('Incoming Box');
    expect(merged.box1?.fill).toBe('#ff0000');
  });

  it('cleans up unused object styles from document', () => {
    const doc = createStarterDocument();
    const docWithStyles = importStylesIntoDocument(doc, {
      objectStyles: {
        used_style: { id: 'used_style', name: 'Used', fill: '#000', stroke: '#000', strokeWidth: 1, cornerRadius: 0, opacity: 1 },
        unused_style: { id: 'unused_style', name: 'Unused', fill: '#fff', stroke: '#000', strokeWidth: 1, cornerRadius: 0, opacity: 1 },
      },
    });

    // Assign used_style to first object
    const firstObjId = Object.keys(docWithStyles.objects)[0]!;
    docWithStyles.objects[firstObjId] = {
      ...docWithStyles.objects[firstObjId]!,
      styleId: 'used_style',
    } as any;

    const cleanedDoc = cleanupUnusedStyles(docWithStyles);
    const cleanedObjectStyles = (cleanedDoc.styles as any).objectStyles;

    expect(cleanedObjectStyles.used_style).toBeDefined();
    expect(cleanedObjectStyles.unused_style).toBeUndefined();
  });
});
