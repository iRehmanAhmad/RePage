import { describe, expect, it } from 'vitest';
import {
  isStyleQatKey,
  qatKeyForStyle,
  sanitizeQatItems,
  styleIdFromQatKey,
} from './qatEngine';

describe('style QAT keys', () => {
  it('round-trips style id through key helpers', () => {
    const key = qatKeyForStyle('poetry');
    expect(key).toBe('style:poetry');
    expect(isStyleQatKey(key)).toBe(true);
    expect(styleIdFromQatKey(key)).toBe('poetry');
  });

  it('rejects built-in action keys and malformed input', () => {
    expect(isStyleQatKey('save')).toBe(false);
    expect(isStyleQatKey('style:')).toBe(false);
    expect(isStyleQatKey('')).toBe(false);
  });
});

describe('sanitizeQatItems', () => {
  it('keeps action keys and well-formed style keys, drops junk', () => {
    expect(
      sanitizeQatItems(['save', 'style:poetry', 'bogus', 42, 'style:', null]),
    ).toEqual(['save', 'style:poetry']);
  });

  it('returns empty for non-arrays', () => {
    expect(sanitizeQatItems(undefined)).toEqual([]);
    expect(sanitizeQatItems('save')).toEqual([]);
  });
});
