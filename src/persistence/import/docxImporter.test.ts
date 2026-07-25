import { describe, expect, it } from 'vitest';
import { importDocxXml } from './docxImporter';

describe('docxImporter', () => {
  it('extracts paragraphs and runs with bidi and bold formatting from word/document.xml', () => {
    const xml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:pPr><w:bidi/></w:pPr>
            <w:r>
              <w:rPr><w:b/></w:rPr>
              <w:t>اہم سرخی</w:t>
            </w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const result = importDocxXml(xml);

    expect(result.type).toBe('story');
    expect(result.detectedFormat).toBe('docx');
    expect(result.paragraphCount).toBe(1);
    expect(result.story.content[0].direction).toBe('rtl');
  });
});
