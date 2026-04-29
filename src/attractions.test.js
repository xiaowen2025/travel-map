import { describe, it, expect } from 'vitest';
import attractionsData from '../public/data/attractions.json';
import erasData from '../public/data/eras.json';

const ERAKeyRanges = {
  'prehistory': { min: -30000, max: -3000 },
  'ancient': { min: -3000, max: 476 },
  'medieval': { min: 477, max: 1449 },
  'renaissance': { min: 1450, max: 1599 },
  'enlightenment': { min: 1600, max: 1788 },
  'earlymodern': { min: 1789, max: 1913 },
  'worldwars': { min: 1914, max: 1945 },
  'contemporary': { min: 1945, max: 2100 }
};

const I18N_FIELDS = ['name', 'shortDesc', 'description', 'country', 'region'];

function hasChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

function isI18n(obj) {
  return obj && typeof obj === 'object' && 'en' in obj && 'zh' in obj;
}

describe('Attractions Data Validation', () => {
  describe('i18n structure', () => {
    it('should have timelinePoints array', () => {
      expect(attractionsData.timelinePoints).toBeDefined();
      expect(Array.isArray(attractionsData.timelinePoints)).toBe(true);
    });

    it('should have valid eraKey ranges', () => {
      for (const point of attractionsData.timelinePoints) {
        const range = ERAKeyRanges[point.eraKey];
        expect(range, `${point.id} has unknown eraKey: ${point.eraKey}`)
          .toBeDefined();
        expect(point.sortYear, `${point.id} sortYear ${point.sortYear} outside ${point.eraKey} range [${range.min}, ${range.max}]`)
          .toBeGreaterThanOrEqual(range.min);
        expect(point.sortYear, `${point.id} sortYear ${point.sortYear} outside ${point.eraKey} range [${range.min}, ${range.max}]`)
          .toBeLessThanOrEqual(range.max);
      }
    });

    it('should have all required fields', () => {
      const REQUIRED_FIELDS = ['id', 'era', 'eraKey', 'category', 'sortYear', 'coordinates', 'tags'];
      for (const point of attractionsData.timelinePoints) {
        for (const field of REQUIRED_FIELDS) {
          expect(point[field], `${point.id} missing field: ${field}`).toBeDefined();
        }
      }
    });

    it('should have valid coordinates [lng, lat]', () => {
      for (const point of attractionsData.timelinePoints) {
        expect(Array.isArray(point.coordinates), `${point.id} coordinates not array`).toBe(true);
        expect(point.coordinates.length, `${point.id} coordinates length != 2`).toBe(2);
        const [lng, lat] = point.coordinates;
        expect(lng, `${point.id} lng out of range`).toBeGreaterThanOrEqual(-180);
        expect(lng, `${point.id} lng out of range`).toBeLessThanOrEqual(180);
        expect(lat, `${point.id} lat out of range`).toBeGreaterThanOrEqual(-90);
        expect(lat, `${point.id} lat out of range`).toBeLessThanOrEqual(90);
      }
    });

    it('i18n fields should have {en, zh} structure', () => {
      for (const point of attractionsData.timelinePoints) {
        for (const field of I18N_FIELDS) {
          const val = point[field];
          if (val === null) continue;
          expect(typeof val === 'object' && 'en' in val && 'zh' in val, `${point.id}.${field} should be {en, zh} object or null`).toBe(true);
        }
      }
    });

    it('i18n fields should have correct language content', () => {
      for (const point of attractionsData.timelinePoints) {
        for (const field of I18N_FIELDS) {
          const val = point[field];
          if (val === null) continue;
          if (val.zh !== null) {
            expect(hasChinese(val.zh), `${point.id}.${field}.zh should have Chinese`).toBe(true);
          }
          if (val.en !== null) {
            expect(hasChinese(val.en), `${point.id}.${field}.en should NOT have Chinese`).toBe(false);
          }
        }
      }
    });
  });

  describe('era ranges consistency', () => {
    it('sortYear should be within era range defined in eras.json', () => {
      for (const point of attractionsData.timelinePoints) {
        const era = erasData.eras.find(e => e.key === point.eraKey);
        if (!era) continue;
        const { start, end } = era.dateRange;
        expect(point.sortYear, `${point.id} sortYear ${point.sortYear} outside era "${point.eraKey}" range [${start}, ${end}]`)
          .toBeGreaterThanOrEqual(start);
        expect(point.sortYear, `${point.id} sortYear ${point.sortYear} outside era "${point.eraKey}" range [${start}, ${end}]`)
          .toBeLessThanOrEqual(end);
      }
    });
  });
});