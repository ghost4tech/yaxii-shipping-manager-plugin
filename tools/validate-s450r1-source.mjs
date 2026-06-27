import fs from 'node:fs';
import path from 'node:path';

const sourceJsonPath = path.resolve(
  'data/sources/s450r1-algeria-cities-2025/cities.json',
);

const requiredWilayaFields = [
  'wilaya_id',
  'wilaya_name_arabic',
  'wilaya_name_latin',
];
const requiredCommuneFields = [
  'commune_id',
  'wilaya_id',
  'commune_name_arabic',
  'commune_name_latin',
];
const mojibakePattern = /[ÃØÙ]/;

const sourceText = fs.readFileSync(sourceJsonPath, 'utf8');
const parsedDataset = JSON.parse(sourceText);
const validationErrors = [];

function rootKeys(parsedSource) {
  return parsedSource && typeof parsedSource === 'object' && !Array.isArray(parsedSource)
    ? Object.keys(parsedSource)
    : [];
}

function arrayAtKey(parsedSource, keyName) {
  return parsedSource && Array.isArray(parsedSource[keyName]) ? parsedSource[keyName] : [];
}

function collectMissingFields(records, requiredFields, recordLabel) {
  records.forEach((sourceRecord, recordIndex) => {
    requiredFields.forEach((fieldName) => {
      const fieldPayload = sourceRecord[fieldName];
      const isMissing = fieldPayload === undefined || fieldPayload === null || fieldPayload === '';
      if (isMissing) {
        validationErrors.push(`${recordLabel} #${recordIndex + 1} missing ${fieldName}`);
      }
    });
  });
}

function collectDuplicateIds(records, idFieldName, recordLabel) {
  const seenIds = new Set();
  records.forEach((sourceRecord) => {
    const normalizedId = String(sourceRecord[idFieldName]);
    if (seenIds.has(normalizedId)) {
      validationErrors.push(`Duplicate ${recordLabel} ${idFieldName}: ${normalizedId}`);
    }
    seenIds.add(normalizedId);
  });
}

function collectInvalidCommuneReferences(communes, wilayaIds) {
  communes.forEach((communeRecord) => {
    const referencedWilayaId = String(communeRecord.wilaya_id);
    if (!wilayaIds.has(referencedWilayaId)) {
      validationErrors.push(
        `Commune ${communeRecord.commune_id} references missing wilaya_id ${referencedWilayaId}`,
      );
    }
  });
}

function collectMojibakeStrings(recordPayload, pathSegments = []) {
  if (typeof recordPayload === 'string') {
    if (mojibakePattern.test(recordPayload)) {
      validationErrors.push(`Mojibake pattern found at ${pathSegments.join('.')}`);
    }
    return;
  }
  if (!recordPayload || typeof recordPayload !== 'object') {
    return;
  }
  Object.entries(recordPayload).forEach(([fieldName, fieldPayload]) => {
    collectMojibakeStrings(fieldPayload, [...pathSegments, fieldName]);
  });
}

function idTypeSummary(records, idFieldName) {
  const idTypes = new Set(records.map((sourceRecord) => typeof sourceRecord[idFieldName]));
  return Array.from(idTypes).sort().join(', ');
}

function compareMetadataCount(metadataField, records, recordLabel) {
  if (typeof parsedDataset[metadataField] !== 'number') {
    return;
  }
  if (parsedDataset[metadataField] !== records.length) {
    validationErrors.push(
      `${metadataField} is ${parsedDataset[metadataField]} but ${recordLabel} count is ${records.length}`,
    );
  }
}

const wilayaRecords = arrayAtKey(parsedDataset, 'wilayas');
const communeRecords = arrayAtKey(parsedDataset, 'communes');
const wilayaIds = new Set(wilayaRecords.map((wilayaRecord) => String(wilayaRecord.wilaya_id)));

if (!wilayaRecords.length) {
  validationErrors.push('Missing or empty wilayas array');
}
if (!communeRecords.length) {
  validationErrors.push('Missing or empty communes array');
}

collectMissingFields(wilayaRecords, requiredWilayaFields, 'wilaya');
collectMissingFields(communeRecords, requiredCommuneFields, 'commune');
collectDuplicateIds(wilayaRecords, 'wilaya_id', 'wilaya');
collectDuplicateIds(communeRecords, 'commune_id', 'commune');
collectInvalidCommuneReferences(communeRecords, wilayaIds);
collectMojibakeStrings(parsedDataset, ['root']);
compareMetadataCount('total_wilayas', wilayaRecords, 'wilaya');
compareMetadataCount('total_communes', communeRecords, 'commune');

console.log('S450R1 Algeria Cities 2025 validation');
console.log(`Source: ${sourceJsonPath}`);
console.log(`Root type: ${Array.isArray(parsedDataset) ? 'array' : typeof parsedDataset}`);
console.log(`Root keys: ${rootKeys(parsedDataset).join(', ')}`);
console.log(`Wilaya location: root.wilayas`);
console.log(`Commune location: root.communes`);
console.log(`Wilaya count: ${wilayaRecords.length}`);
console.log(`Commune count: ${communeRecords.length}`);
console.log(`Wilaya fields: ${Object.keys(wilayaRecords[0] ?? {}).join(', ')}`);
console.log(`Commune fields: ${Object.keys(communeRecords[0] ?? {}).join(', ')}`);
console.log(`Wilaya ID types: ${idTypeSummary(wilayaRecords, 'wilaya_id')}`);
console.log(`Commune ID types: ${idTypeSummary(communeRecords, 'commune_id')}`);
console.log(`Commune wilaya_id types: ${idTypeSummary(communeRecords, 'wilaya_id')}`);
console.log(`Sample wilaya: ${JSON.stringify(wilayaRecords[0] ?? null)}`);
console.log(`Sample commune: ${JSON.stringify(communeRecords[0] ?? null)}`);

if (validationErrors.length > 0) {
  console.error(`Validation failed with ${validationErrors.length} error(s):`);
  validationErrors.forEach((validationError) => console.error(`- ${validationError}`));
  process.exit(1);
}

console.log('Validation passed: references, required fields, duplicate IDs, metadata counts, and mojibake scan are valid.');
