import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Output to travel-map/.my_list
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'my_list');

const BASE_URL = 'http://localhost:5173/my-list.html';

const args = process.argv.slice(2);
const singleIndex = args.includes('--single') ? parseInt(args[args.indexOf('--single') + 1]) : null;
const targetId = args.includes('--id') ? args[args.indexOf('--id') + 1] : null;

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 800, deviceScaleFactor: 2 });

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

  // Wait for cards to be rendered
  await page.waitForSelector('.attraction-card', { timeout: 10000 });

  const cards = await page.$$('.attraction-card');
  console.log(`Found ${cards.length} cards`);

  let start = 0;
  let end = cards.length;

  if (singleIndex !== null) {
    start = singleIndex;
    end = singleIndex + 1;
  } else if (targetId) {
    // Find the card index by data-id attribute
    const allCards = await page.$$('.attraction-card');
    for (let i = 0; i < allCards.length; i++) {
      const id = await allCards[i].evaluate(el => el.getAttribute('data-id'));
      if (id === targetId) {
        start = i;
        end = i + 1;
        break;
      }
    }
  }

  for (let i = start; i < end && i < cards.length; i++) {
    const card = cards[i];

    // Get the name from the card title
    const title = await page.evaluate(el => el.querySelector('.card-title')?.textContent || '', card);
    const safeName = title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').slice(0, 30);
    const filename = `${i + 1}-${safeName}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    // Scroll card into view
    await card.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await new Promise(r => setTimeout(r, 300));

    // Capture screenshot of just this element
    await card.screenshot({ path: outputPath, type: 'png' });
    console.log(`Saved: ${filename}`);
  }

  await browser.close();
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
