import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', '.gemini']);

// Common mojibake character sequences resulting from UTF-8 interpreted as Windows-1252 / ISO-8859-1
const MOJIBAKE_PATTERNS = [
  /\uFFFD/, // Replacement character
  /\u00C3[\u0080-\u00FF]/, // UTF-8 multibyte misdecoded as Latin-1
  /\u00C2[\u0080-\u00FF]/,
  /\u00EF\u00BF\u00BD/, // UTF-8 representation of U+FFFD misdecoded as ISO-8859-1
];

let errorCount = 0;
let fileCount = 0;

function scanDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SCAN_EXTENSIONS.has(ext)) {
        checkFile(fullPath);
      }
    }
  }
}

function checkFile(filePath) {
  fileCount++;
  const relativePath = path.relative(rootDir, filePath);
  const buffer = fs.readFileSync(filePath);

  // Check 1: Valid UTF-8 string decoding
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let content;
  try {
    content = decoder.decode(buffer);
  } catch (err) {
    console.error(`❌ Non-UTF-8 encoding error in: ${relativePath}`);
    console.error(`   Details: ${err.message}`);
    errorCount++;
    return;
  }

  // Check 2: Mojibake detection
  for (const pattern of MOJIBAKE_PATTERNS) {
    if (pattern.test(content)) {
      console.error(`❌ Mojibake / encoding corruption detected in: ${relativePath}`);
      console.error(`   Pattern matched: ${pattern}`);
      errorCount++;
      return;
    }
  }
}

console.log('🔍 Checking UTF-8 validity and scanning for mojibake...');
scanDirectory(rootDir);

if (errorCount > 0) {
  console.error(`\nFAILED: Found ${errorCount} UTF-8 or encoding issues across ${fileCount} files.`);
  process.exit(1);
} else {
  console.log(`\nPASSED: ${fileCount} files verified as valid UTF-8 without mojibake.`);
  process.exit(0);
}
