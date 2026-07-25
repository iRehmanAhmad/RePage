import type { RePageDocument } from '../document/types';
import { DEFAULT_OBJECT_STYLES, type ObjectStyle } from './objectStyles';
import { URDU_TYPOGRAPHY_PRESETS } from './styles';

export type ConflictStrategy = 'overwrite' | 'keep-existing' | 'rename';

export interface StyleLibrary {
  characterStyles: Record<string, unknown>;
  paragraphStyles: Record<string, unknown>;
  objectStyles: Record<string, ObjectStyle>;
}

/**
 * Creates an initial default Style Library with built-in Urdu typography and object styles.
 */
export function createDefaultStyleLibrary(): StyleLibrary {
  return {
    characterStyles: { ...URDU_TYPOGRAPHY_PRESETS.characterStyles },
    paragraphStyles: { ...URDU_TYPOGRAPHY_PRESETS.paragraphStyles },
    objectStyles: { ...DEFAULT_OBJECT_STYLES },
  };
}

/**
 * Imports source styles into a target style dictionary with conflict resolution handling.
 */
export function importStyleSet<T extends { id: string; name: string }>(
  target: Record<string, T>,
  source: Record<string, T>,
  strategy: ConflictStrategy = 'keep-existing',
): Record<string, T> {
  const result = { ...target };

  for (const [id, style] of Object.entries(source)) {
    if (!result[id]) {
      result[id] = style;
      continue;
    }

    if (strategy === 'overwrite') {
      result[id] = style;
    } else if (strategy === 'rename') {
      const newId = `${id}_imported_${Date.now()}`;
      const newStyle = {
        ...style,
        id: newId,
        name: `${style.name} (Imported)`,
      };
      result[newId] = newStyle;
    }
    // strategy === 'keep-existing': do nothing
  }

  return result;
}

/**
 * Imports an entire Style Library from an external document into the target document styles.
 */
export function importStylesIntoDocument(
  doc: RePageDocument,
  sourceLibrary: Partial<StyleLibrary>,
  strategy: ConflictStrategy = 'keep-existing',
): RePageDocument {
  const currentStyles = (doc.styles ?? {}) as Partial<StyleLibrary>;

  const mergedObjectStyles = importStyleSet(
    currentStyles.objectStyles ?? {},
    sourceLibrary.objectStyles ?? {},
    strategy,
  );

  const mergedParagraphStyles = importStyleSet(
    (currentStyles.paragraphStyles ?? {}) as Record<string, { id: string; name: string }>,
    (sourceLibrary.paragraphStyles ?? {}) as Record<string, { id: string; name: string }>,
    strategy,
  );

  const mergedCharacterStyles = importStyleSet(
    (currentStyles.characterStyles ?? {}) as Record<string, { id: string; name: string }>,
    (sourceLibrary.characterStyles ?? {}) as Record<string, { id: string; name: string }>,
    strategy,
  );

  return {
    ...doc,
    styles: {
      ...currentStyles,
      objectStyles: mergedObjectStyles,
      paragraphStyles: mergedParagraphStyles,
      characterStyles: mergedCharacterStyles,
    },
  };
}

/**
 * Cleans up unreferenced styles from the document.
 */
export function cleanupUnusedStyles(doc: RePageDocument): RePageDocument {
  const currentStyles = (doc.styles ?? {}) as Partial<StyleLibrary>;
  const objectStyles = { ...(currentStyles.objectStyles ?? {}) };

  // Collect referenced object style IDs from document objects
  const referencedObjectStyleIds = new Set<string>();
  for (const pageObj of Object.values(doc.objects)) {
    const styleId = (pageObj as { styleId?: string }).styleId;
    if (styleId) {
      referencedObjectStyleIds.add(styleId);
    }
  }

  const cleanedObjectStyles: Record<string, ObjectStyle> = {};
  for (const [id, style] of Object.entries(objectStyles)) {
    if (referencedObjectStyleIds.has(id)) {
      cleanedObjectStyles[id] = style;
    }
  }

  return {
    ...doc,
    styles: {
      ...currentStyles,
      objectStyles: cleanedObjectStyles,
    },
  };
}
