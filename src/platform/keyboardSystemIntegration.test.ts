import { beforeEach, describe, expect, it } from 'vitest';
import { createStarterDocument } from '../domain/document/createDocument';
import type { RePageDocument } from '../domain/document/types';
import { paragraph } from '../domain/rich-text/types';
import {
  getLayoutMapForMode,
  mapKeyToUrduCharacter,
} from '../domain/unicode/keyboardLayouts';
import {
  createDefaultCustomLayout,
  deleteCustomKeyboardLayout,
  duplicateCustomKeyboardLayout,
  exportLayoutToJson,
  importLayoutFromJson,
  loadCustomKeyboardLayouts,
  resetCustomLayoutsToDefault,
  saveCustomKeyboardLayout,
  validateCustomKeyMapping,
  type CustomKeyboardLayout,
} from '../domain/unicode/customKeyboardEngine';
import { extractPlainTextFromStory } from '../domain/language/languageToolScope';
import { createUrdupPackage, readUrdupPackage } from '../persistence/package/urdupPackage';

describe('Urdu Tools Phase 4 — Keyboard Layout System & Custom Layouts', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCustomLayoutsToDefault();
  });

  it('1. CRULP vs Navees vs Native OS vs Custom Mode mappings', () => {
    // CRULP vs Navees shift difference fixtures for key 'e'
    const crulpE = mapKeyToUrduCharacter('e', 'crulp', true);
    const naveesE = mapKeyToUrduCharacter('e', 'navees', true);
    expect(crulpE).toBe('ۓ');
    expect(naveesE).toBe('ٍ');

    // Native OS mode returns null (honest pass-through)
    const nativeA = mapKeyToUrduCharacter('a', 'native', false);
    expect(nativeA).toBeNull();
  });

  it('2. Custom Layout management: save, load, duplicate, delete, import, export', () => {
    const layout = createDefaultCustomLayout('Test Layout');
    layout.mappings.a = { normal: 'ﷺ', shift: 'آ' };

    saveCustomKeyboardLayout(layout);

    const loaded = loadCustomKeyboardLayouts();
    expect(loaded.length).toBe(1);
    expect(loaded[0]?.name).toBe('Test Layout');

    // Duplicate
    const dup = duplicateCustomKeyboardLayout(layout.id);
    expect(dup).not.toBeNull();
    expect(loadCustomKeyboardLayouts().length).toBe(2);

    // Export & Import JSON
    const json = exportLayoutToJson(layout);
    expect(json).toContain('Test Layout');

    const imported = importLayoutFromJson(json);
    expect(imported).not.toBeNull();

    // Delete
    deleteCustomKeyboardLayout(layout.id);
    expect(loadCustomKeyboardLayouts().length).toBe(2);
  });

  it('3. Validates custom key mapping strings', () => {
    expect(validateCustomKeyMapping('ﷺ')).toBe(true);
    expect(validateCustomKeyMapping('\u200C')).toBe(true);
    expect(validateCustomKeyMapping('')).toBe(true);
  });

  it('4. Phase 4 Exit Gate: Create custom mapping for a -> ﷺ, save, select custom layout, type character, save .urdup & reopen, verify text', async () => {
    // 1. Create custom layout mapping 'a' -> 'ﷺ'
    const customLayout: CustomKeyboardLayout = {
      id: 'custom_gate_kbd_1',
      name: 'Salawat Layout',
      mappings: {
        a: { normal: 'ﷺ', shift: 'آ' },
      },
    };
    saveCustomKeyboardLayout(customLayout);

    // 2. Select layout custom:custom_gate_kbd_1 and resolve character for 'a'
    const modeString = `custom:${customLayout.id}` as const;
    const resolvedMap = getLayoutMapForMode(modeString);

    expect(resolvedMap.a).toBeDefined();
    const typedChar = mapKeyToUrduCharacter('a', modeString, false);
    expect(typedChar).toBe('ﷺ');

    // 3. Insert character into document story
    const baseDoc = createStarterDocument();
    const storyId = 'primary-body-story';

    const testDoc: RePageDocument = {
      ...baseDoc,
      stories: {
        ...baseDoc.stories,
        [storyId]: {
          id: storyId,
          name: 'Primary Story',
          content: {
            type: 'doc' as const,
            content: [paragraph(`حضرت محمد ${typedChar} رسول اللہ ہیں`, 'rtl')],
          },
        },
      },
    };

    const storyText = extractPlainTextFromStory(testDoc.stories[storyId]!);
    expect(storyText).toContain('ﷺ');

    // 4. Package save and reopen check
    const pkgBytes = await createUrdupPackage(testDoc);
    expect(pkgBytes.length).toBeGreaterThan(0);

    const reopenedDoc = await readUrdupPackage(pkgBytes);
    const reopenedText = extractPlainTextFromStory(reopenedDoc.stories[storyId]!);
    expect(reopenedText).toBe(storyText);
    expect(reopenedText).toContain('ﷺ');
  });
});
