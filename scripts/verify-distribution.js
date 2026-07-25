import fs from 'node:fs';
import path from 'node:path';

function verifyDistributionConfig() {
  console.log('🔍 Verifying distribution packaging configuration...');

  const tauriConfPath = path.resolve(process.cwd(), 'src-tauri/tauri.conf.json');
  if (!fs.existsSync(tauriConfPath)) {
    console.error('❌ Missing tauri.conf.json file');
    process.exit(1);
  }

  const rawConf = fs.readFileSync(tauriConfPath, 'utf-8');
  const conf = JSON.parse(rawConf);

  const targets = conf.bundle?.targets;
  if (!Array.isArray(targets) || targets.length === 0) {
    console.error('❌ Missing or invalid bundle targets in tauri.conf.json');
    process.exit(1);
  }

  const fileAssoc = conf.bundle?.fileAssociations;
  if (!Array.isArray(fileAssoc) || fileAssoc.length === 0) {
    console.error('❌ Missing fileAssociations in tauri.conf.json');
    process.exit(1);
  }

  const urdupAssoc = fileAssoc.find((a) => a.ext && a.ext.includes('urdup'));
  if (!urdupAssoc) {
    console.error('❌ .urdup file extension is not registered in fileAssociations');
    process.exit(1);
  }

  console.log(`✅ Distribution Config Verified:`);
  console.log(`   - Product: ${conf.productName} v${conf.version}`);
  console.log(`   - Targets: ${targets.join(', ')}`);
  console.log(`   - MIME Type: ${urdupAssoc.mimeType}`);
}

verifyDistributionConfig();
