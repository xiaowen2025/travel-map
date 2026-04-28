import { describe, it, expect } from 'vitest';
import zhData from '../public/data/attractions.json';
import enData from '../public/data/attractions.en.json';

const ERACategoryRanges = {
  '史前与青铜时代': { min: -20000, max: -16 },
  '古代': { min: -500, max: 700 },
  '中世纪贸易': { min: 313, max: 1550 },
  '文艺复兴与宗教改革': { min: 1400, max: 1650 },
  '帝国、启蒙与革命': { min: 1747, max: 1902 },
  '世界大战与冷战': { min: 1914, max: 1999 },
  // English equivalents
  'Prehistoric Bronze Age': { min: -20000, max: -16 },
  'Ancient Era': { min: -500, max: 700 },
  'Medieval Trade': { min: 313, max: 1550 },
  'Renaissance Reformation': { min: 1400, max: 1650 },
  'Empires Enlightenment Revolution': { min: 1747, max: 1902 },
  'World Wars Cold War': { min: 1914, max: 1999 }
};

const REQUIRED_FIELDS = ['id', 'name', 'location', 'era', 'eraCategory', 'category', 'sortYear', 'coordinates', 'shortDesc', 'description', 'tags'];

function hasChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

describe('Attractions Data Validation', () => {
  describe('Chinese file (attractions.json)', () => {
    it('should have timelinePoints array', () => {
      expect(zhData.timelinePoints).toBeDefined();
      expect(Array.isArray(zhData.timelinePoints)).toBe(true);
    });

    it('should have valid eraCategory ranges', () => {
      for (const point of zhData.timelinePoints) {
        const range = ERACategoryRanges[point.eraCategory];
        expect(range, `${point.id} has unknown eraCategory: ${point.eraCategory}`)
          .toBeDefined();
        expect(point.sortYear, `${point.id} sortYear ${point.sortYear} outside ${point.eraCategory} range [${range.min}, ${range.max}]`)
          .toBeGreaterThanOrEqual(range.min);
        expect(point.sortYear, `${point.id} sortYear ${point.sortYear} outside ${point.eraCategory} range [${range.min}, ${range.max}]`)
          .toBeLessThanOrEqual(range.max);
      }
    });

    it('should have all required fields', () => {
      for (const point of zhData.timelinePoints) {
        for (const field of REQUIRED_FIELDS) {
          expect(point[field], `${point.id} missing field: ${field}`).toBeDefined();
        }
      }
    });

    it('should have valid coordinates [lng, lat]', () => {
      for (const point of zhData.timelinePoints) {
        expect(Array.isArray(point.coordinates), `${point.id} coordinates not array`).toBe(true);
        expect(point.coordinates.length, `${point.id} coordinates length != 2`).toBe(2);
        const [lng, lat] = point.coordinates;
        expect(lng, `${point.id} lng out of range`).toBeGreaterThanOrEqual(-180);
        expect(lng, `${point.id} lng out of range`).toBeLessThanOrEqual(180);
        expect(lat, `${point.id} lat out of range`).toBeGreaterThanOrEqual(-90);
        expect(lat, `${point.id} lat out of range`).toBeLessThanOrEqual(90);
      }
    });

    it('should contain no Latin text in Chinese fields', () => {
      const fields = ['name', 'location', 'eraCategory', 'shortDesc', 'description'];
      for (const point of zhData.timelinePoints) {
        for (const field of fields) {
          expect(hasChinese(point[field]), `${point.id}.${field} contains no Chinese`).toBe(true);
        }
      }
    });
  });

  describe('English file (attractions.en.json)', () => {
    it('should have timelinePoints array', () => {
      expect(enData.timelinePoints).toBeDefined();
      expect(Array.isArray(enData.timelinePoints)).toBe(true);
    });

    it('should have valid eraCategory ranges', () => {
      for (const point of enData.timelinePoints) {
        const range = ERACategoryRanges[point.eraCategory];
        expect(range, `${point.id} has unknown eraCategory: ${point.eraCategory}`)
          .toBeDefined();
        expect(point.sortYear, `${point.id} sortYear ${point.sortYear} outside ${point.eraCategory} range [${range.min}, ${range.max}]`)
          .toBeGreaterThanOrEqual(range.min);
        expect(point.sortYear, `${point.id} sortYear ${point.sortYear} outside ${point.eraCategory} range [${range.min}, ${range.max}]`)
          .toBeLessThanOrEqual(range.max);
      }
    });

    it('should have all required fields', () => {
      for (const point of enData.timelinePoints) {
        for (const field of REQUIRED_FIELDS) {
          expect(point[field], `${point.id} missing field: ${field}`).toBeDefined();
        }
      }
    });

    it('should have valid coordinates [lng, lat]', () => {
      for (const point of enData.timelinePoints) {
        expect(Array.isArray(point.coordinates), `${point.id} coordinates not array`).toBe(true);
        expect(point.coordinates.length, `${point.id} coordinates length != 2`).toBe(2);
      }
    });

    it('should contain no Chinese in English fields', () => {
      const fields = ['name', 'location', 'era', 'eraCategory', 'shortDesc', 'description'];
      for (const point of enData.timelinePoints) {
        for (const field of fields) {
          expect(hasChinese(point[field]), `${point.id}.${field} contains Chinese`).toBe(false);
        }
      }
    });
  });

  describe('Cross-file consistency', () => {
    it('should have same number of entries', () => {
      expect(zhData.timelinePoints.length).toBe(enData.timelinePoints.length);
    });

    it('should have matching ids', () => {
      const zhIds = zhData.timelinePoints.map(p => p.id).sort();
      const enIds = enData.timelinePoints.map(p => p.id).sort();
      expect(zhIds).toEqual(enIds);
    });

    it('should have same sortYear values', () => {
      for (const zhPoint of zhData.timelinePoints) {
        const enPoint = enData.timelinePoints.find(p => p.id === zhPoint.id);
        expect(enPoint, `id ${zhPoint.id} not found in English file`).toBeDefined();
        expect(enPoint.sortYear).toBe(zhPoint.sortYear);
      }
    });
  });
});
