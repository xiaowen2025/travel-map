import sharp from 'sharp';
import { readdir, stat, copyFile, rm } from 'fs/promises';
import path from 'path';
import { fileTypeFromFile } from 'file-type';

const dir = 'public/assets/attractions';
const files = await readdir(dir);

let compressed = 0;
let skipped = 0;
let failed = 0;

for (const file of files) {
  if (!file.endsWith('.jpg') && !file.endsWith('.jpeg')) continue;

  const filepath = path.join(dir, file);
  const fileType = await fileTypeFromFile(filepath);

  if (!fileType || (fileType.mime !== 'image/jpeg' && fileType.mime !== 'image/png')) {
    skipped++;
    continue;
  }

  try {
    const { size } = await stat(filepath);
    const sizeMB = size / (1024 * 1024);

    if (sizeMB > 5) {
      process.stdout.write(`Compressing ${file} (${sizeMB.toFixed(1)} MB)...`);
      const tmpPath = filepath + '.tmp';
      await sharp(filepath)
        .resize(2000, null, { withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toFile(tmpPath);
      await copyFile(tmpPath, filepath);
      await rm(tmpPath);
      console.log(` done`);
      compressed++;
    } else {
      skipped++;
    }
  } catch (err) {
    console.log(` FAILED: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${compressed} compressed, ${skipped} skipped, ${failed} failed`);
