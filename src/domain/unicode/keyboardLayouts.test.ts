import { describe, expect, it } from 'vitest';
import {
  CRULP_PHONETIC_MAP,
  mapKeyToUrduCharacter,
  SPECIAL_URDU_CHARACTERS,
} from './keyboardLayouts';

describe('keyboardLayouts', () => {
  it('maps CRULP phonetic keys correctly', () => {
    expect(CRULP_PHONETIC_MAP['a']?.normal).toBe('ا');
    expect(mapKeyToUrduCharacter('a', 'crulp', false)).toBe('ا');
    expect(mapKeyToUrduCharacter('a', 'crulp', true)).toBe('آ');
    expect(mapKeyToUrduCharacter('t', 'crulp', false)).toBe('ت');
    expect(mapKeyToUrduCharacter('t', 'crulp', true)).toBe('ٹ');
  });

  it('passes through native and english mode keys without mutation', () => {
    expect(mapKeyToUrduCharacter('a', 'native', false)).toBeNull();
    expect(mapKeyToUrduCharacter('a', 'english', false)).toBeNull();
  });

  it('provides special control characters (ZWNJ, ZWJ, RLM, LRM, honorifics)', () => {
    const zwnj = SPECIAL_URDU_CHARACTERS.find((c) => c.label === 'ZWNJ');
    expect(zwnj?.char).toBe('\u200C');

    const honorific = SPECIAL_URDU_CHARACTERS.find((c) => c.label === 'ﷺ');
    expect(honorific?.char).toBe('\uFDFA');
  });
});
