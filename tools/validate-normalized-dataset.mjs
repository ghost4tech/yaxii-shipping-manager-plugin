import fs from 'node:fs';
import path from 'node:path';

const currentDir = path.resolve('data/algeria/current');
const legacyDir = path.resolve('data/algeria/legacy-58');
const uiScanRoots = ['admin-app/src', 'src', 'assets/admin'];
const expectedWilayaCount = 69;
const expectedCommuneCount = 1541;
const mojibakePattern = /[ÃƒÃ˜Ã™]/u;
const repeatedWhitespacePattern = /\s{2,}/u;
const validationErrors = [];

function readJson(relativePath) {
  const filePath = path.resolve(relativePath);
  if (!fs.existsSync(filePath)) {
    validationErrors.push(`Missing file: ${relativePath}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    validationErrors.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function requireObject(payload, label) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    validationErrors.push(`${label} must be an object.`);
    return false;
  }
  return true;
}

function requireArray(payload, label) {
  if (!Array.isArray(payload)) {
    validationErrors.push(`${label} must be an array.`);
    return false;
  }
  return true;
}

function requireString(value, pathLabel) {
  if (typeof value !== 'string' || !value.trim()) {
    validationErrors.push(`${pathLabel} must be a non-empty string.`);
    return;
  }
  if (value !== value.trim()) {
    validationErrors.push(`${pathLabel} must be trimmed.`);
  }
  if (repeatedWhitespacePattern.test(value)) {
    validationErrors.push(`${pathLabel} contains repeated whitespace.`);
  }
  if (mojibakePattern.test(value)) {
    validationErrors.push(`${pathLabel} contains a mojibake marker.`);
  }
}

function requireNumber(value, pathLabel) {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    validationErrors.push(`${pathLabel} must be an integer number.`);
  }
}

function requireBoolean(value, pathLabel) {
  if (typeof value !== 'boolean') {
    validationErrors.push(`${pathLabel} must be a boolean.`);
  }
}

function assertCount(records, expectedCount, label) {
  if (records.length !== expectedCount) {
    validationErrors.push(`${label} count is ${records.length}; expected ${expectedCount}.`);
  }
}

function assertNoDuplicates(records, keyName, label) {
  const seenValues = new Set();
  records.forEach((record) => {
    const keyValue = record[keyName];
    if (seenValues.has(keyValue)) {
      validationErrors.push(`Duplicate ${label} ${keyName}: ${String(keyValue)}`);
    }
    seenValues.add(keyValue);
  });
}

function validateMetadata(metadata) {
  if (!requireObject(metadata, 'current metadata')) {
    return;
  }
  if (metadata.mode !== 'current') {
    validationErrors.push('current metadata mode must be current.');
  }
  requireString(metadata.source, 'metadata.source');
  requireString(metadata.source_commit, 'metadata.source_commit');
  requireString(metadata.version, 'metadata.version');
  requireBoolean(metadata.complete, 'metadata.complete');
  requireBoolean(metadata.verified, 'metadata.verified');
  if (metadata.complete !== true) {
    validationErrors.push('current metadata complete must be true.');
  }
  if (metadata.verified !== false) {
    validationErrors.push('current metadata verified must remain false.');
  }
  if (metadata.wilaya_count !== expectedWilayaCount) {
    validationErrors.push(`metadata.wilaya_count must be ${expectedWilayaCount}.`);
  }
  if (metadata.commune_count !== expectedCommuneCount) {
    validationErrors.push(`metadata.commune_count must be ${expectedCommuneCount}.`);
  }
}

function validateWilayas(wilayas) {
  if (!requireArray(wilayas, 'wilayas')) {
    return new Set();
  }
  assertCount(wilayas, expectedWilayaCount, 'wilaya');
  assertNoDuplicates(wilayas, 'code', 'wilaya');

  const wilayaCodes = new Set();
  wilayas.forEach((wilaya, index) => {
    const label = `wilayas[${index}]`;
    requireString(wilaya.code, `${label}.code`);
    if (typeof wilaya.code === 'string' && !/^\d{2}$/u.test(wilaya.code)) {
      validationErrors.push(`${label}.code must be 2 digits.`);
    }
    requireNumber(wilaya.source_id, `${label}.source_id`);
    requireString(wilaya.name_fr, `${label}.name_fr`);
    requireString(wilaya.name_ar, `${label}.name_ar`);
    requireString(wilaya.label, `${label}.label`);
    if (wilaya.mode !== 'current') {
      validationErrors.push(`${label}.mode must be current.`);
    }
    requireBoolean(wilaya.supported, `${label}.supported`);
    if (!Array.isArray(wilaya.notes)) {
      validationErrors.push(`${label}.notes must be an array.`);
    }
    wilayaCodes.add(wilaya.code);
  });

  return wilayaCodes;
}

function validateCommunes(communes, wilayaCodes) {
  if (!requireArray(communes, 'communes')) {
    return;
  }
  assertCount(communes, expectedCommuneCount, 'commune');
  assertNoDuplicates(communes, 'code', 'commune');

  communes.forEach((commune, index) => {
    const label = `communes[${index}]`;
    requireString(commune.code, `${label}.code`);
    if (typeof commune.code === 'string' && !/^\d{4}$/u.test(commune.code)) {
      validationErrors.push(`${label}.code must be 4 digits.`);
    }
    requireNumber(commune.source_id, `${label}.source_id`);
    requireString(commune.wilaya_code, `${label}.wilaya_code`);
    if (!wilayaCodes.has(commune.wilaya_code)) {
      validationErrors.push(`${label}.wilaya_code references missing wilaya ${commune.wilaya_code}.`);
    }
    requireString(commune.name_fr, `${label}.name_fr`);
    requireString(commune.name_ar, `${label}.name_ar`);
    if (commune.mode !== 'current') {
      validationErrors.push(`${label}.mode must be current.`);
    }
    requireBoolean(commune.supported, `${label}.supported`);
    if (!Array.isArray(commune.notes)) {
      validationErrors.push(`${label}.notes must be an array.`);
    }
  });
}

function validateLegacyMetadata(legacyMetadata) {
  if (!requireObject(legacyMetadata, 'legacy metadata')) {
    return;
  }
  if (legacyMetadata.mode !== 'legacy_58') {
    validationErrors.push('legacy metadata mode must be legacy_58.');
  }
  if (legacyMetadata.complete !== false) {
    validationErrors.push('legacy metadata complete must be false.');
  }
  if (legacyMetadata.verified !== false) {
    validationErrors.push('legacy metadata verified must be false.');
  }
  if (legacyMetadata.available !== false) {
    validationErrors.push('legacy metadata available must be false.');
  }
  requireString(legacyMetadata.reason, 'legacy metadata reason');
}

function walkFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const files = [];
  fs.readdirSync(rootDir, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  });
  return files;
}

function scanUiFacingFiles() {
  uiScanRoots.flatMap(walkFiles).forEach((filePath) => {
    if (!/\.(php|ts|tsx|js|css|json)$/u.test(filePath)) {
      return;
    }
    const fileText = fs.readFileSync(filePath, 'utf8');
    if (fileText.includes('68 wilayas')) {
      validationErrors.push(`Forbidden wording found in ${filePath}: 68 wilayas`);
    }
    if (fileText.includes('69 wilayas')) {
      validationErrors.push(`Unapproved UI/build-facing wording found in ${filePath}: 69 wilayas`);
    }
  });
}

const metadata = readJson(path.join(currentDir, 'metadata.json'));
const wilayas = readJson(path.join(currentDir, 'wilayas.json'));
const communes = readJson(path.join(currentDir, 'communes.json'));
const legacyMetadata = readJson(path.join(legacyDir, 'metadata.json'));

validateMetadata(metadata);
const wilayaCodes = validateWilayas(wilayas);
validateCommunes(communes, wilayaCodes);
validateLegacyMetadata(legacyMetadata);
scanUiFacingFiles();

if (validationErrors.length > 0) {
  console.error(`Normalized dataset validation failed with ${validationErrors.length} error(s):`);
  validationErrors.forEach((validationError) => console.error(`- ${validationError}`));
  process.exit(1);
}

console.log('Normalized dataset validation passed');
console.log(`Current wilayas: ${wilayas.length}`);
console.log(`Current communes: ${communes.length}`);
console.log('Legacy 58-compatible metadata: unavailable/incomplete as expected');
