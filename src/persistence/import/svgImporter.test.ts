import { describe, expect, it } from 'vitest';
import { importSvg } from './svgImporter';

describe('svgImporter', () => {
  it('parses SVG rect, ellipse, and line elements into canvas objects', () => {
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="100" height="50" fill="#ff0000" />
        <ellipse cx="100" cy="100" rx="30" ry="20" fill="#00ff00" />
        <line x1="0" y1="0" x2="50" y2="50" stroke="#0000ff" />
      </svg>
    `;

    const result = importSvg(svg);

    expect(result.type).toBe('vector');
    expect(result.detectedFormat).toBe('svg');
    expect(result.elementCount).toBe(3);
  });
});
