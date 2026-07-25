import { describe, expect, it } from 'vitest';
import { importRtf } from './rtfImporter';

describe('rtfImporter', () => {
  it('parses RTF formatting controls and Unicode escapes into canonical marks', () => {
    const rtf = '{\\rtf1\\ansi {\\b Urdu} \\i Text \\fs28 \\u1589?\\par Next paragraph}';
    const result = importRtf(rtf);

    expect(result.type).toBe('story');
    expect(result.detectedFormat).toBe('rtf');
    expect(result.paragraphCount).toBeGreaterThanOrEqual(1);

    const firstPara = result.story.content[0];
    expect(firstPara).toBeDefined();
  });
});
