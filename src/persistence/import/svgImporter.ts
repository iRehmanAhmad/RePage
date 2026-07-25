import { PageObject } from '../../domain/document/types';
import { createId } from '../../domain/document/createDocument';
import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportVectorResult, validateResourceLimits } from './importEngine';
import { sanitizeSvgXml } from './sanitizer';

export function importSvg(
  svgXml: string,
  options: ImportOptions = {},
): ImportVectorResult {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(new Blob([svgXml]).size, limits);

  // 1. Sanitize executable SVG markup
  const sanitizedXml = sanitizeSvgXml(svgXml);

  const objects: PageObject[] = [];
  let elementCount = 0;
  const warnings: string[] = [];

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(sanitizedXml, 'image/svg+xml');

    const parserError = svgDoc.getElementsByTagName('parsererror')[0];
    if (parserError) {
      throw new Error(`SVG parsing error: ${parserError.textContent}`);
    }

    const rectEls = Array.from(svgDoc.getElementsByTagName('rect'));
    const ellipseEls = Array.from(svgDoc.getElementsByTagName('ellipse'));
    const lineEls = Array.from(svgDoc.getElementsByTagName('line'));

    elementCount = rectEls.length + ellipseEls.length + lineEls.length;

    if (elementCount > limits.maxVectorElements) {
      throw new Error(`SVG element count (${elementCount}) exceeds maximum limit of ${limits.maxVectorElements}`);
    }

    rectEls.forEach((rect) => {
      const x = parseFloat(rect.getAttribute('x') || '0');
      const y = parseFloat(rect.getAttribute('y') || '0');
      const width = parseFloat(rect.getAttribute('width') || '100');
      const height = parseFloat(rect.getAttribute('height') || '100');
      const fill = rect.getAttribute('fill') || '#000000';
      const stroke = rect.getAttribute('stroke') || 'none';

      objects.push({
        id: createId('obj'),
        type: 'rectangle',
        x,
        y,
        width: Math.max(width, 1),
        height: Math.max(height, 1),
        rotation: 0,
        fill,
        stroke,
        strokeWidth: parseFloat(rect.getAttribute('stroke-width') || '1'),
      });
    });

    ellipseEls.forEach((ellipse) => {
      const cx = parseFloat(ellipse.getAttribute('cx') || '50');
      const cy = parseFloat(ellipse.getAttribute('cy') || '50');
      const rx = parseFloat(ellipse.getAttribute('rx') || '50');
      const ry = parseFloat(ellipse.getAttribute('ry') || '50');
      const fill = ellipse.getAttribute('fill') || '#000000';
      const stroke = ellipse.getAttribute('stroke') || 'none';

      objects.push({
        id: createId('obj'),
        type: 'ellipse',
        x: cx - rx,
        y: cy - ry,
        width: Math.max(rx * 2, 1),
        height: Math.max(ry * 2, 1),
        rotation: 0,
        fill,
        stroke,
        strokeWidth: parseFloat(ellipse.getAttribute('stroke-width') || '1'),
      });
    });

    lineEls.forEach((line) => {
      const x1 = parseFloat(line.getAttribute('x1') || '0');
      const y1 = parseFloat(line.getAttribute('y1') || '0');
      const x2 = parseFloat(line.getAttribute('x2') || '100');
      const y2 = parseFloat(line.getAttribute('y2') || '100');

      objects.push({
        id: createId('obj'),
        type: 'line',
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.max(Math.abs(x2 - x1), 1),
        height: Math.max(Math.abs(y2 - y1), 1),
        rotation: 0,
        x1,
        y1,
        x2,
        y2,
        stroke: line.getAttribute('stroke') || '#000000',
        strokeWidth: parseFloat(line.getAttribute('stroke-width') || '1'),
      });
    });
  } else {
    warnings.push('DOMParser unavailable; basic SVG import fallback applied.');
  }

  return {
    type: 'vector',
    objects,
    elementCount: objects.length,
    detectedFormat: 'svg',
    warnings,
  };
}
