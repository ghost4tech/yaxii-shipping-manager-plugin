import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.resolve('data/sources/s450r1-algeria-cities-2025/cities.json');
const currentOutputDir = path.resolve('data/algeria/current');
const legacyOutputDir = path.resolve('data/algeria/legacy-58');
const sourceCommit = 'ba0cd7d5aeb9aec54fcde69c073f9dfc34f94de2';
const expectedWilayaCount = 69;
const expectedCommuneCount = 1541;

const cleanedLabels = [];

function readSourceDataset() {
  const sourceText = fs.readFileSync(sourcePath, 'utf8');
  return JSON.parse(sourceText);
}

function assertSourceShape(sourceDataset) {
  const errors = [];
  if (!sourceDataset || typeof sourceDataset !== 'object' || Array.isArray(sourceDataset)) {
    errors.push('Source root must be an object.');
  }
  if (!Array.isArray(sourceDataset?.wilayas)) {
    errors.push('Source wilayas must be an array.');
  }
  if (!Array.isArray(sourceDataset?.communes)) {
    errors.push('Source communes must be an array.');
  }
  if (sourceDataset?.wilayas?.length !== expectedWilayaCount) {
    errors.push(`Expected ${expectedWilayaCount} source wilayas.`);
  }
  if (sourceDataset?.communes?.length !== expectedCommuneCount) {
    errors.push(`Expected ${expectedCommuneCount} source communes.`);
  }
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

function numericCode(sourceId, width) {
  if (!Number.isInteger(sourceId) || sourceId < 1) {
    throw new Error(`Invalid positive integer source ID: ${String(sourceId)}`);
  }
  return String(sourceId).padStart(width, '0');
}

function cleanedLabel(rawLabel, recordPath) {
  if (typeof rawLabel !== 'string') {
    throw new Error(`Missing string label at ${recordPath}.`);
  }

  const normalizedLabel = rawLabel.trim().replace(/\s+/gu, ' ');
  if (normalizedLabel !== rawLabel) {
    cleanedLabels.push({ path: recordPath, before: rawLabel, after: normalizedLabel });
  }
  if (!normalizedLabel) {
    throw new Error(`Empty label after cleanup at ${recordPath}.`);
  }
  return normalizedLabel;
}

function normalizeWilayas(sourceWilayas) {
  return sourceWilayas.map((sourceWilaya) => ({
    code: numericCode(sourceWilaya.wilaya_id, 2),
    source_id: sourceWilaya.wilaya_id,
    name_fr: cleanedLabel(
      sourceWilaya.wilaya_name_latin,
      `wilayas.${sourceWilaya.wilaya_id}.wilaya_name_latin`,
    ),
    name_ar: cleanedLabel(
      sourceWilaya.wilaya_name_arabic,
      `wilayas.${sourceWilaya.wilaya_id}.wilaya_name_arabic`,
    ),
    label: cleanedLabel(
      sourceWilaya.wilaya_name_latin,
      `wilayas.${sourceWilaya.wilaya_id}.label`,
    ),
    mode: 'current',
    supported: true,
    notes: [],
  }));
}

function normalizeCommunes(sourceCommunes) {
  return sourceCommunes.map((sourceCommune) => ({
    code: numericCode(sourceCommune.commune_id, 4),
    source_id: sourceCommune.commune_id,
    wilaya_code: numericCode(sourceCommune.wilaya_id, 2),
    name_fr: cleanedLabel(
      sourceCommune.commune_name_latin,
      `communes.${sourceCommune.commune_id}.commune_name_latin`,
    ),
    name_ar: cleanedLabel(
      sourceCommune.commune_name_arabic,
      `communes.${sourceCommune.commune_id}.commune_name_arabic`,
    ),
    mode: 'current',
    supported: true,
    notes: [],
  }));
}

function currentMetadata(wilayas, communes) {
  return {
    mode: 'current',
    source: 's450r1-algeria-cities-2025',
    source_commit: sourceCommit,
    version: 'current-candidate-2025',
    complete: true,
    verified: false,
    wilaya_count: wilayas.length,
    commune_count: communes.length,
    license: 'Public domain statement preserved from source README',
    warnings: [
      'Source reform claims are preserved as source claims and require independent official verification before marketing as official.',
    ],
  };
}

function legacyMetadata() {
  return {
    mode: 'legacy_58',
    complete: false,
    verified: false,
    available: false,
    reason:
      'Legacy 58-compatible mapping is deferred until an auditable mapping/cross-source comparison is implemented.',
  };
}

function writeJsonFile(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function writeDatasetFiles(wilayas, communes) {
  fs.mkdirSync(currentOutputDir, { recursive: true });
  fs.mkdirSync(legacyOutputDir, { recursive: true });
  writeJsonFile(path.join(currentOutputDir, 'wilayas.json'), wilayas);
  writeJsonFile(path.join(currentOutputDir, 'communes.json'), communes);
  writeJsonFile(path.join(currentOutputDir, 'metadata.json'), currentMetadata(wilayas, communes));
  writeJsonFile(path.join(legacyOutputDir, 'metadata.json'), legacyMetadata());
}

function printSummary(wilayas, communes) {
  console.log('S450R1 normalization complete');
  console.log(`Source: ${sourcePath}`);
  console.log(`Current wilayas: ${wilayas.length}`);
  console.log(`Current communes: ${communes.length}`);
  console.log(`Cleaned labels: ${cleanedLabels.length}`);
  cleanedLabels.slice(0, 20).forEach((labelChange) => {
    console.log(`- ${labelChange.path}: ${JSON.stringify(labelChange.before)} -> ${JSON.stringify(labelChange.after)}`);
  });
  console.log('Legacy 58-compatible metadata: unavailable placeholder written');
}

try {
  const sourceDataset = readSourceDataset();
  assertSourceShape(sourceDataset);
  const wilayas = normalizeWilayas(sourceDataset.wilayas);
  const communes = normalizeCommunes(sourceDataset.communes);
  writeDatasetFiles(wilayas, communes);
  printSummary(wilayas, communes);
} catch (error) {
  console.error('S450R1 normalization failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
