import { describe, it, expect } from 'vitest';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

const MAX_SIZE_MB = 26;

describe('Image validation', () => {
  const imageDirs = [
    'public/assets/destinations',
    'public/assets/attractions',
  ];

  for (const dir of imageDirs) {
    describe(dir, () => {
      it('all images should be valid JPEG/PNG files', async () => {
        const files = await readdir(dir);
        const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));

        expect(imageFiles.length).toBeGreaterThan(0);

        for (const file of imageFiles) {
          const filepath = path.join(dir, file);
          const fileType = await fileTypeFromFile(filepath);

          expect(fileType, `${file} should be a valid image`).toBeTruthy();
          expect(['image/jpeg', 'image/png'].includes(fileType?.mime), `${file} should be JPEG or PNG, got ${fileType?.mime}`).toBe(true);
        }
      });

      it('all images should be under 26 MB', async () => {
        const files = await readdir(dir);
        const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));

        for (const file of imageFiles) {
          const filepath = path.join(dir, file);
          const { size } = await stat(filepath);
          const sizeMB = size / (1024 * 1024);

          expect(sizeMB, `${file} is ${sizeMB.toFixed(1)} MB, exceeds ${MAX_SIZE_MB} MB limit`).toBeLessThan(MAX_SIZE_MB);
        }
      });
    });
  }

  describe('nature.json image references', () => {
    it('all referenced images should exist in public/assets/attractions', async () => {
      const natureData = JSON.parse(
        await import('fs').then(fs => fs.promises.readFile('public/data/nature.json', 'utf-8'))
      );

      const missingImages = [];
      const checkedPaths = new Set();

      for (const site of natureData.sites) {
        if (site.image) {
          const imagePath = site.image; // e.g., "/assets/attractions/la-meije.jpg"
          if (!checkedPaths.has(imagePath)) {
            checkedPaths.add(imagePath);
            const fullPath = path.join(process.cwd(), 'public', imagePath);
            try {
              await stat(fullPath);
            } catch {
              missingImages.push({ id: site.id, path: imagePath });
            }
          }
        }
      }

      expect(missingImages, `Missing images: ${missingImages.map(m => m.path).join(', ')}`).toHaveLength(0);
    });
  });
});