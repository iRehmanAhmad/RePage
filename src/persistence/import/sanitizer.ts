/**
 * Strict Security & Markup Sanitizer for External Document Importers
 *
 * Enforces sanitization against executable markup (XSS, script injection,
 * inline event handlers, iframe injection, and XXE external entities).
 */

export function sanitizeHtmlMarkup(htmlInput: string): string {
  if (!htmlInput) return '';

  // 1. Remove dangerous blocks: <script>, <style>, <iframe>, <object>, <embed>, <applet>, <form>, <link>, <meta>
  let clean = htmlInput.replace(/<(script|style|iframe|object|embed|applet|form|link|meta)[\s\S]*?<\/\1>/gi, '');
  clean = clean.replace(/<(script|style|iframe|object|embed|applet|form|link|meta)[^>]*\/>/gi, '');
  clean = clean.replace(/<(script|style|iframe|object|embed|applet|form|link|meta)[^>]*>/gi, '');

  // 2. Remove inline event attributes (e.g. onload, onerror, onclick, onmouseover)
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 3. Remove executable pseudo-protocol URLs (javascript:, vbscript:, data:text/html)
  clean = clean.replace(/href\s*=\s*["']?\s*(javascript|vbscript|data:text\/html):[^"'\s>]*/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*["']?\s*(javascript|vbscript|data:text\/html):[^"'\s>]*/gi, 'src=""');

  return clean;
}

export function sanitizeSvgXml(svgInput: string): string {
  if (!svgInput) return '';

  // 1. Remove DOCTYPE declaration to prevent XML External Entity (XXE) expansion attacks
  let clean = svgInput.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  clean = clean.replace(/<!ENTITY[\s\S]*?>/gi, '');

  // 2. Remove script tags and foreignObject tags
  clean = clean.replace(/<(script|foreignObject)[\s\S]*?<\/\1>/gi, '');
  clean = clean.replace(/<(script|foreignObject)[^>]*\/>/gi, '');
  clean = clean.replace(/<(script|foreignObject)[^>]*>/gi, '');

  // 3. Remove inline event handlers
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 4. Remove javascript: links inside xlink:href or href
  clean = clean.replace(/(?:xlink:)?href\s*=\s*["']?\s*(javascript|vbscript|data:text\/html):[^"'\s>]*/gi, 'href="#"');

  return clean;
}

export function containsExecutableMarkup(input: string): boolean {
  if (!input) return false;
  const scriptRegex = /<script|onload=|onerror=|onclick=|javascript:/i;
  return scriptRegex.test(input);
}
