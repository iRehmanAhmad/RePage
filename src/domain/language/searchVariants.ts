import { stripAerab } from '../rich-text/findReplace';
import { applyNormalization } from './characterNormalization';

export function generateSearchVariants(query: string): string[] {
  if (!query || query.trim().length === 0) return [];

  const variants = new Set<string>();
  const trimmed = query.trim();

  // 1. Exact query
  variants.add(trimmed);

  // 2. Aerab-stripped variant
  const noAerab = stripAerab(trimmed);
  if (noAerab) variants.add(noAerab);

  // 3. Normalized character variant
  const normalized = applyNormalization(trimmed);
  if (normalized) variants.add(normalized);

  // 4. Normalized + Aerab stripped variant
  const normNoAerab = stripAerab(normalized);
  if (normNoAerab) variants.add(normNoAerab);

  // 5. Hamza variations (e.g. "آ" vs "ا", "ئے" vs "ائے")
  if (trimmed.includes('آ')) {
    variants.add(trimmed.replace(/آ/g, 'ا'));
  }
  if (trimmed.includes('ئے')) {
    variants.add(trimmed.replace(/ئے/g, 'ائے'));
  }

  return Array.from(variants);
}
