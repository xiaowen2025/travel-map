/**
 * Script to identify European Natural/Mixed WHC sites from whc001.json
 * Searches for European country names in the descriptions and site names
 */
import { readFileSync } from 'fs';

const EUROPEAN_COUNTRIES = [
  'Albania', 'Andorra', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium',
  'Bosnia', 'Herzegovina', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech',
  'Czechia', 'Denmark', 'Estonia', 'Finland', 'France', 'Georgia',
  'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy',
  'Kazakhstan', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro',
  'Netherlands', 'North Macedonia', 'Macedonia', 'Norway', 'Poland',
  'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia',
  'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
  'Turkey', 'Türkiye', 'Ukraine', 'United Kingdom', 'UK', 'Britain',
  'England', 'Scotland', 'Wales',
  // Regions that strongly indicate European location
  'Alps', 'Pyrenees', 'Carpathian', 'Scandinavia', 'Baltic',
  'Mediterranean', 'Adriatic', 'Aegean', 'Atlantic',
  'Danube', 'Rhine', 'Dolomit', 'Bavari',
  // Islands
  'Canary', 'Madeira', 'Azores', 'Sardinia', 'Sicily', 'Corsica',
  'Crete', 'Balearic', 'Svalbard',
  // Specific European regions
  'Transylvania', 'Lapland', 'Andalusia', 'Catalonia', 'Tuscany',
  'Provence', 'Brittany', 'Normandy', 'Galicia', 'Basque',
  'Caucasus', 'Carpathians', 'Dinaric', 'Iberian'
];

const data = JSON.parse(readFileSync('public/data/processing/whc001.json', 'utf-8'));

const naturalMixed = data.filter(d => d.category === 'Natural' || d.category === 'Mixed');

console.log(`Total Natural/Mixed entries: ${naturalMixed.length}`);
console.log('---');

const europeanSites = [];

for (const site of naturalMixed) {
  const searchText = [
    site.name_en,
    site.name_zh,
    site.short_description_en,
    site.description_en,
    site.justification_en
  ].filter(Boolean).join(' ');

  const matchedCountries = EUROPEAN_COUNTRIES.filter(country =>
    new RegExp(`\\b${country}\\b`, 'i').test(searchText)
  );

  if (matchedCountries.length > 0) {
    europeanSites.push({
      name_en: site.name_en,
      name_zh: site.name_zh,
      category: site.category,
      matched: matchedCountries.join(', '),
      short_desc_en: site.short_description_en?.substring(0, 120) + '...'
    });
  }
}

console.log(`\nEuropean Natural/Mixed sites found: ${europeanSites.length}\n`);

for (let i = 0; i < europeanSites.length; i++) {
  const s = europeanSites[i];
  console.log(`${i + 1}. [${s.category}] ${s.name_en}`);
  console.log(`   中文: ${s.name_zh || '(none)'}`);
  console.log(`   Countries: ${s.matched}`);
  console.log(`   ${s.short_desc_en}`);
  console.log('');
}
