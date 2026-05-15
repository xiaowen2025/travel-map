#!/usr/bin/env node
/**
 * Sort nature.json by feature, range, then longitude (west to east)
 */
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/nature.json'), 'utf8'));

function getFeature(tags) {
  const t = tags?.find(t => t.startsWith('feature:'));
  return t ? t.split(':')[1] : 'Other';
}

function getRange(tags) {
  const t = tags?.find(t => t.startsWith('range:'));
  return t ? t.split(':')[1] : '';
}

data.sites.sort((a, b) => {
  const featA = getFeature(a.tags);
  const featB = getFeature(b.tags);
  if (featA < featB) return -1;
  if (featA > featB) return 1;

  const rangeA = getRange(a.tags);
  const rangeB = getRange(b.tags);
  if (rangeA < rangeB) return -1;
  if (rangeA > rangeB) return 1;

  const lngA = a.coordinates?.[0] ?? 0;
  const lngB = b.coordinates?.[0] ?? 0;
  return lngA - lngB;
});

fs.writeFileSync(path.join(__dirname, '../public/data/nature.json'), JSON.stringify(data, null, 2));
console.log(`Sorted ${data.sites.length} sites`);