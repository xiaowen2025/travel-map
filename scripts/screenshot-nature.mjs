import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'my_list', 'screenshots', 'nature');
const STYLE_URL = 'http://localhost:5173/src/style.css';
const ASSETS_BASE = 'http://localhost:5173';

const args = process.argv.slice(2);
const tagArg = args.includes('--tag') ? args[args.indexOf('--tag') + 1] : 'range:Alps';

async function main() {
    // 1. Load Data
    const natureData = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'public', 'data', 'nature.json'), 'utf8'));
    const countriesData = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'public', 'data', 'countries.json'), 'utf8'));
    
    const getCountryName = (code, locale = 'zh') => {
        const country = countriesData.countries[code];
        return country ? (country[locale] || country.en) : code;
    };

    const getRangeLabel = (tags) => {
        const rangeTag = tags.find(t => t.startsWith('range:'));
        return rangeTag ? rangeTag.split(':')[1] : '';
    };

    // 2. Filter Sites
    const filteredSites = natureData.sites.filter(site => site.tags.includes(tagArg));
    console.log(`Found ${filteredSites.length} sites matching tag: ${tagArg}`);

    if (filteredSites.length === 0) {
        console.log('No sites found. Exiting.');
        return;
    }

    // 3. Launch Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 600, height: 1000, deviceScaleFactor: 2 });

    // 4. Render and Screenshot each site
    for (let i = 0; i < filteredSites.length; i++) {
        const site = filteredSites[i];
        const name = site.name.zh || site.name.en;
        const rangeLabel = getRangeLabel(site.tags);
        const countryName = getCountryName(site.country);
        const location = `📍 ${countryName}`;
        const image = site.image ? (site.image.startsWith('http') ? site.image : `${ASSETS_BASE}${site.image}`) : '';

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="${STYLE_URL}">
            <style>
                body {
                    background: #0a0a0f;
                    margin: 0;
                    padding: 40px;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                }
                .attraction-card {
                    position: relative !important;
                    width: 500px;
                    opacity: 1 !important;
                    transform: none !important;
                }
                .card-expanded {
                    max-height: none !important;
                    overflow: visible !important;
                    display: block !important;
                }
                .card-image {
                    width: 100%;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    display: block;
                }
            </style>
        </head>
        <body>
            <div class="attraction-card visible" data-id="${site.id}">
                <div class="card-compact">
                    <span class="card-era">${rangeLabel}</span>
                    <h3 class="card-title">${name}</h3>
                    <span class="card-location">${location}</span>
                </div>
                <div class="card-expanded revealed">
                    <div class="card-divider"></div>
                    ${image ? `<img class="card-image" src="${image}" alt="${name}">` : ''}
                    <p class="card-short-desc" style="margin:0 0 8px 0;">${site.shortDesc.zh}</p>
                    <p class="card-description" style="margin:0 0 8px 0;font-size:13px;line-height:1.6;">${site.description.zh}</p>
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(html, { waitUntil: 'load' });
        // Wait a bit for any late-loading images or fonts
        await new Promise(r => setTimeout(r, 500));

        const card = await page.$('.attraction-card');
        if (card) {
            const safeName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_').slice(0, 30);
            const filename = `${i + 1}-${safeName}.png`;
            const outputPath = path.join(OUTPUT_DIR, filename);

            await card.screenshot({ path: outputPath, type: 'png' });
            console.log(`Saved: ${filename}`);
        }
    }

    await browser.close();
    console.log('Done!');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});