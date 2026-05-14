#!/usr/bin/env node
/**
 * Compress large JPEG/PNG images in a directory.
 * Usage: node compress-images.mjs <directory>
 * Example: node compress-images.mjs public/assets/attractions
 */
import sharp from 'sharp';
import { readdir, stat, copyFile, rm } from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

const dir = process.argv[2] || 'public/assets/attractions';

if (!dir) {
  console.error('Usage: node compress-images.mjs <directory>');
  process.exit(1);
}

const files = await readdir(dir);

let compressed = 0;
let skipped = 0;
let failed = 0;

for (const file of files) {
  if (!file.endsWith('.jpg') && !file.endsWith('.jpeg')) continue;

  const filepath = path.join(dir, file);
  const fileType = await fileTypeFromFile(filepath);

  if (!fileType || (fileType.mime !== 'image/jpeg' && fileType.mime !== 'image/png')) {
    console.log(`Skipping ${file} (not a JPEG/PNG: ${fileType?.mime || 'unknown'})`);
    skipped++;
    continue;
  }

  try {
    const { size } = await stat(filepath);
    const sizeMB = size / (1024 * 1024);

    if (sizeMB > 5) {
      console.log(`Compressing ${file} (${sizeMB.toFixed(1)} MB)...`);
      const tmpPath = filepath + '.tmp';
      await sharp(filepath)
        .resize(2000, null, { withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toFile(tmpPath);
      await copyFile(tmpPath, filepath);
      await rm(tmpPath);
      compressed++;
    } else {
      console.log(`Skipping ${file} (${sizeMB.toFixed(1)} MB)`);
      skipped++;
    }
  } catch (err) {
    console.log(`Failed ${file}: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${compressed} compressed, ${skipped} skipped, ${failed} failed`);