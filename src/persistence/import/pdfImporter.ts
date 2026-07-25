import { DEFAULT_RESOURCE_LIMITS, ImportOptions, ImportPdfResult, validateResourceLimits } from './importEngine';

export async function computeSha256Hash(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Basic fallback hash for non-WebCrypto test environments
  let hash = 0;
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) {
    hash = (hash << 5) - hash + view[i];
    hash |= 0;
  }
  return `sha256-${Math.abs(hash).toString(16)}`;
}

export async function importPdfPage(
  pdfBuffer: ArrayBuffer,
  options: ImportOptions = {},
): Promise<ImportPdfResult> {
  const limits = { ...DEFAULT_RESOURCE_LIMITS, ...options.resourceLimits };
  validateResourceLimits(pdfBuffer.byteLength, limits);

  const bytes = new Uint8Array(pdfBuffer);
  const headerText = String.fromCharCode(...bytes.slice(0, 8));

  if (!headerText.startsWith('%PDF-')) {
    throw new Error('Invalid PDF format: Missing %PDF- header magic bytes');
  }

  // Calculate SHA-256 asset hash
  const assetId = await computeSha256Hash(pdfBuffer);

  // Extract page count and MediaBox bounding dimensions if available
  const pdfString = String.fromCharCode(...bytes.slice(0, Math.min(bytes.length, 50000)));
  const mediaBoxMatch = pdfString.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/);

  let widthPoints = 595.28; // Default A4 width in points
  let heightPoints = 841.89; // Default A4 height in points

  if (mediaBoxMatch) {
    const x1 = parseFloat(mediaBoxMatch[1]);
    const y1 = parseFloat(mediaBoxMatch[2]);
    const x2 = parseFloat(mediaBoxMatch[3]);
    const y2 = parseFloat(mediaBoxMatch[4]);
    widthPoints = Math.abs(x2 - x1);
    heightPoints = Math.abs(y2 - y1);
  }

  // Count /Page objects
  const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g) || [];
  const pageCount = Math.max(pageMatches.length, 1);

  return {
    type: 'pdf',
    assetId,
    pageCount,
    widthPoints,
    heightPoints,
    detectedFormat: 'pdf',
    warnings: [],
  };
}
