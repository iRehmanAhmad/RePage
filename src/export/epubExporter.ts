import JSZip from 'jszip';
import { RePageDocument } from '../domain/document/types';
import { getDocumentNotes } from '../domain/rich-text/notesEngine';

export interface EpubExportOptions {
  title?: string | undefined;
  author?: string | undefined;
  publisher?: string | undefined;
  language?: string | undefined;
  includeNotes?: boolean | undefined;
}

export async function exportDocumentToEpub(
  doc: RePageDocument,
  options: EpubExportOptions = {},
): Promise<Uint8Array> {
  const zip = new JSZip();

  const title = options.title || doc.metadata.title || 'Urdu Document';
  const author = options.author || 'RePage Author';
  const language = options.language || doc.metadata.locale || 'ur';
  const notes = getDocumentNotes(doc.id);

  // 1. Uncompressed mimetype file (must be first file in EPUB zip)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. OEBPS/style.css with native RTL Nastaliq formatting
  const styleCss = `
@charset "utf-8";
body {
  direction: rtl;
  text-align: right;
  font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaliq', 'Urdu Typesetting', serif;
  line-height: 2.0;
  margin: 5%;
  color: #111111;
  background-color: #ffffff;
}
h1, h2, h3 {
  color: #0d47a1;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  text-align: center;
}
p {
  margin-bottom: 1.2em;
  text-indent: 1.5em;
}
.footnote-ref, .endnote-ref {
  vertical-align: super;
  font-size: 0.8em;
  color: #c62828;
  text-decoration: none;
  font-weight: bold;
}
.notes-section {
  margin-top: 3em;
  border-top: 1px solid #cccccc;
  padding-top: 1em;
}
.note-item {
  font-size: 0.9em;
  margin-bottom: 0.5em;
}
`;
  zip.file('OEBPS/style.css', styleCss);

  // Extract pages and stories
  const chapterFiles: string[] = [];
  const pageList = doc.pageOrder ? doc.pageOrder.map((id) => doc.pages[id]!).filter(Boolean) : Object.values(doc.pages);

  pageList.forEach((page, index) => {
    const chapterFilename = `chapter_${index + 1}.xhtml`;
    chapterFiles.push(chapterFilename);

    let pageHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${language}" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title>${title} - Page ${index + 1}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${title} (صفحہ ${index + 1})</h1>
`;

    // Process page text frames
    page.objectOrder.forEach((objId) => {
      const obj = doc.objects[objId];
      if (obj && obj.type === 'text-frame') {
        const story = doc.stories[obj.storyId];
        if (story && story.content && story.content.content) {
          story.content.content.forEach((para) => {
            const textContent = para.content
              .map((node) => (node.type === 'text' ? node.text : ''))
              .join('');
            if (textContent.trim()) {
              pageHtml += `  <p>${textContent}</p>\n`;
            }
          });
        }
      }
    });

    // Append footnotes/endnotes if present on this page/story
    if (notes.length > 0) {
      pageHtml += `  <section class="notes-section" epub:type="footnotes">\n`;
      pageHtml += `    <h2>حواشی و تعلیقات (Notes)</h2>\n`;
      notes.forEach((note) => {
        pageHtml += `    <div className="note-item" id="${note.id}" epub:type="${note.type}">\n`;
        pageHtml += `      <span class="note-num">[${note.symbol || note.number}]</span> ${note.text}\n`;
        pageHtml += `    </div>\n`;
      });
      pageHtml += `  </section>\n`;
    }

    pageHtml += `</body>\n</html>`;
    zip.file(`OEBPS/${chapterFilename}`, pageHtml);
  });

  // 4. OEBPS/toc.ncx Navigation Center XML
  let ncxXml = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:repage-${doc.id}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="${pageList.length}"/>
    <meta name="dtb:maxPageNumber" content="${pageList.length}"/>
  </head>
  <docTitle><text>${title}</text></docTitle>
  <navMap>
`;

  chapterFiles.forEach((file, idx) => {
    ncxXml += `    <navPoint id="navpoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>صفحہ ${idx + 1}</text></navLabel>
      <content src="${file}"/>
    </navPoint>\n`;
  });
  ncxXml += `  </navMap>\n</ncx>`;
  zip.file('OEBPS/toc.ncx', ncxXml);

  // 5. OEBPS/content.opf Manifest Package XML
  let opfXml = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0" xml:lang="${language}" dir="rtl">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:repage-${doc.id}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>${language}</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
`;

  chapterFiles.forEach((file, idx) => {
    opfXml += `    <item id="chapter_${idx + 1}" href="${file}" media-type="application/xhtml+xml"/>\n`;
  });

  opfXml += `  </manifest>\n  <spine toc="ncx" page-progression-direction="rtl">\n`;
  chapterFiles.forEach((_, idx) => {
    opfXml += `    <itemref idref="chapter_${idx + 1}"/>\n`;
  });
  opfXml += `  </spine>\n</package>`;
  zip.file('OEBPS/content.opf', opfXml);

  // Generate EPUB binary ZIP buffer
  return await zip.generateAsync({ type: 'uint8array', mimeType: 'application/epub+zip' });
}
