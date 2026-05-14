import { describe, it, expect } from 'vitest';
import geographyData from '../public/data/geography.json';

function hasChinese(text) {
  return /[\u4e00-\u9fff]/.test(text);
}

describe('Geography Data Validation', () => {
  it('should have features array', () => {
    expect(geographyData.features).toBeDefined();
    expect(Array.isArray(geographyData.features)).toBe(true);
  });

  it('should have all required fields for each feature', () => {
    const REQUIRED_FIELDS = ['id', 'name', 'type', 'coordinates', 'path', 'icon'];
    for (const feature of geographyData.features) {
      for (const field of REQUIRED_FIELDS) {
        expect(feature[field], `${feature.id} missing field: ${field}`).toBeDefined();
      }
    }
  });

  it('should have valid i18n name structure', () => {
    for (const feature of geographyData.features) {
      expect(feature.name.en, `${feature.id} missing name.en`).toBeDefined();
      expect(feature.name.zh, `${feature.id} missing name.zh`).toBeDefined();
      expect(hasChinese(feature.name.zh), `${feature.id}.name.zh should have Chinese`).toBe(true);
    }
  });

  it('should have valid coordinates [lng, lat]', () => {
    for (const feature of geographyData.features) {
      expect(Array.isArray(feature.coordinates), `${feature.id} coordinates not array`).toBe(true);
      expect(feature.coordinates.length, `${feature.id} coordinates length != 2`).toBe(2);
      const [lng, lat] = feature.coordinates;
      expect(lng).toBeGreaterThanOrEqual(-180);
      expect(lng).toBeLessThanOrEqual(180);
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
    }
  });

  it('should have valid path with at least 2 points', () => {
    for (const feature of geographyData.features) {
      expect(Array.isArray(feature.path), `${feature.id} path not array`).toBe(true);
      expect(feature.path.length).toBeGreaterThanOrEqual(2);
      for (const point of feature.path) {
        expect(Array.isArray(point), `${feature.id} path point not array`).toBe(true);
        expect(point.length).toBe(2);
        const [lng, lat] = point;
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    }
  });

  it('type should be mountain or river', () => {
    for (const feature of geographyData.features) {
      expect(['mountain', 'river']).toContain(feature.type);
    }
  });
});
