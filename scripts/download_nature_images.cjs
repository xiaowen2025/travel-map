const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('public/data/nature.json', 'utf8'));

// Mapping of site IDs to Wikimedia image URLs (high-quality panoramic images)
const imageUrls = {
  'plitvice-lakes': 'https://upload.wikimedia.org/wikipedia/commons/5/53/Nationalpark_Plitvicer_Seen_%2820917640874%29.jpg',
  'bia-owie-a-forest': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bialowieza03.jpg',
  'giants-causeway-and-causeway-coast': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Causeway-Panorama.jpg',
  'pirin-national-park': 'https://upload.wikimedia.org/wikipedia/commons/9/94/Mountain_Pirin.jpg',
  'srebarna-nature-reserve': 'https://upload.wikimedia.org/wikipedia/commons/8/84/Srebarna_Nature_Reserve_05.jpg',
  'kocjan-caves': 'https://upload.wikimedia.org/wikipedia/commons/0/00/Skocjan_Caves%2C_view_of_the_Mala_dolina_from_the_natural_bridge_05.jpg',
  'durmitor-national-park': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Durmitor_Sedlo_Pass_-_4.jpg',
  'the-dolomites': 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Dolomites.jpg',
  'mount-etna': 'https://upload.wikimedia.org/wikipedia/commons/0/02/Mount_Etna.jpg',
  'aeolian-islands': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Aeolian_Islands.jpg',
  'evaporitic-karst-and-caves-of-northern-apennines': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Domica_Cave_22.jpg',
  'monte-san-giorgio': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Lago_di_Lugano3.jpg',
  'swiss-alps-jungfrau-aletsch': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Jungfrau.jpg',
  'swiss-tectonic-arena-sardona': 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Panorama_de_la_cha%C3%AEne_des_Puys.jpg',
  'vatnaj-kull-national-park-dynamic-nature-of-fire-and-ice': 'https://upload.wikimedia.org/wikipedia/commons/4/48/Wv_Vatnaj%C3%B6kull_National_Park_banner.jpg',
  'surtsey': 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Surtsey_by_Brian_Gratwicke.jpg',
  'do-ana-national-park': 'https://upload.wikimedia.org/wikipedia/commons/8/85/Wetlands_in_Donana.jpg',
  'teide-national-park': 'https://upload.wikimedia.org/wikipedia/commons/8/89/Cumbre_del_Teide_nevada.jpg',
  'garajonay-national-park': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Paisaje_desde_Garajonay_-_panoramio.jpg',
  'gulf-of-porto-calanche-of-piana-gulf-of-girolata-scandola-reserve': 'https://upload.wikimedia.org/wikipedia/commons/1/10/Piana_Golfe_vu_des_Calanche.jpg',
  'cha-ne-des-puys-limagne-fault-tectonic-arena': 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Cha%C3%AEne_des_Puys.jpg',
  'wadden-sea': 'https://upload.wikimedia.org/wikipedia/commons/2/27/Wadden_Sea.jpg',
  'stevns-klint': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Stevns_Klint.jpg',
  'm-ns-klint': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/M%C3%B8ns_Klint.jpg',
  'messel-pit': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Grube_Messel%2C_Weltnaturerbe_-_panoramio.jpg',
  'high-coast-kvarken-archipelago': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Kvarken_Archipelago.jpg',
  'danube-delta': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Ca%C3%B1as_%28Phragmites_australis%29%2C_Delta_del_Danubio%2C_Ruman%C3%ADa%2C_2016-05-28%2C_DD_17.jpg',
  'caves-of-aggtelek-karst-and-slovak-karst': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Domica_Cave_22.jpg',
  'dorset-and-east-devon-coast': 'https://upload.wikimedia.org/wikipedia/commons/7/74/2012-07-24_Durlston_Castle_roof_view.JPG',
  'the-flow-country': 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Flow_Country.jpg',
  'laurisilva-of-madeira': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Laurisilva.jpg',
  'vjetrenica-cave-ravno': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Vjetrenica_entrance_relief_2.jpg',
  'west-norwegian-fjords': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Geirangerfjord.jpg',
  'colchic-rainforests': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Jungfrau.jpg',
  'virgin-komi-forests': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Four_herous01.JPG',
  'western-caucasus': 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Autumn_in_Caucasus.JPG',
  'high-coast-kvarken-archipelago': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Kvarken_Archipelago.jpg',
  'danube-delta': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Ca%C3%B1as_%28Phragmites_australis%29%2C_Delta_del_Danubio%2C_Ruman%C3%ADa%2C_2016-05-28%2C_DD_17.jpg',
  'caves-of-aggtelek-karst-and-slovak-karst': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Domica_Cave_22.jpg',
  'dorset-and-east-devon-coast': 'https://upload.wikimedia.org/wikipedia/commons/7/74/2012-07-24_Durlston_Castle_roof_view.JPG',
  'the-flow-country': 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Flow_Country.jpg',
  'laurisilva-of-madeira': 'https://upload.wikimedia.org/wikipedia/commons/1/14/Laurisilva.jpg',
  'vjetrenica-cave-ravno': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Vjetrenica_entrance_relief_2.jpg',
  'west-norwegian-fjords': 'https://upload.wikimedia.org/wikipedia/commons/1/16/Geirangerfjord.jpg',
  'colchic-rainforests': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Jungfrau.jpg',
  'virgin-komi-forests': 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Four_herous01.JPG',
  'western-caucasus': 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Autumn_in_Caucasus.JPG',
  'hierapolis-pamukkale': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Pamukkale_%28Hierapolis%29_Turkey.jpg',
  'ancient-and-primeval-beech-forests-of-the-carpathians-and-other-regions-of-europe': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Beu%C8%99ni%C8%9Ba_%28Beu%29_valley_42.jpg',
  'hyrcanian-forests': 'https://upload.wikimedia.org/wikipedia/commons/5/52/3615554_%D8%AA%D8%B5%D8%A7%D9%88%DB%8C%D8%B1_%D9%87%D9%88%D8%A7%DB%8C%DB%8C_%D8%AC%D8%A7%D8%AF%D9%87_%D9%87%D8%A7%DB%8C_%D9%BE%D8%A7%DB%8C%DB%8C%D8%B2%DB%8C_%D8%AC%D9%86%DA%AF%D9%84_%D9%87%D8%A7%DB%8C_%D9%87%DB%8C%D8%B1%DA%A9%D8%A7%D9%86%DB%8C.jpg'
};

const destDir = path.join(__dirname, '..', 'public', 'assets', 'attractions');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadImage(url, destPath, retries = 3) {
  return new Promise((resolve, reject) => {
    const { execSync } = require('child_process');

    console.log(`Downloading: ${url}`);
    console.log(`Saving to: ${destPath}`);

    const doDownload = (attempt = 1) => {
      try {
        // Skip if file already exists but update JSON path
        if (require('fs').existsSync(destPath)) {
          console.log(`File already exists, skipping: ${destPath}`);
          // Update JSON path if it still points to a URL
          site.image = `/assets/attractions/${site.id}${ext}`;
          resolve();
          return;
        }

        // Use curl with proper headers to avoid rate limiting
        const result = execSync(`curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -w "%{http_code}" -o "${destPath}" "${url}"`, { encoding: 'utf8' });

        const statusCode = result.trim();

        if (statusCode === '429' && attempt < retries) {
          if (require('fs').existsSync(destPath)) require('fs').unlinkSync(destPath);
          const delay = Math.pow(2, attempt) * 5000;
          console.log(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}/${retries}...`);
          setTimeout(() => doDownload(attempt + 1), delay);
          return;
        }

        if (statusCode !== '200') {
          if (require('fs').existsSync(destPath)) require('fs').unlinkSync(destPath);
          reject(new Error(`HTTP ${statusCode}`));
          return;
        }

        resolve();
      } catch (err) {
        if (require('fs').existsSync(destPath)) require('fs').unlinkSync(destPath);
        reject(err);
      }
    };

    doDownload();
  });
}

async function run() {
  ensureDir(destDir);

  const sites = data.sites;
  const results = [];

  for (const site of sites) {
    const imageUrl = imageUrls[site.id];
    if (!imageUrl) {
      console.log(`No URL found for: ${site.id} (${site.name.en})`);
      results.push({ id: site.id, status: 'NO_URL' });
      continue;
    }

    const ext = path.extname(imageUrl) || '.jpg';
    const destPath = path.join(destDir, `${site.id}${ext}`);

    try {
      await downloadImage(imageUrl, destPath);
      console.log(`SUCCESS: ${site.id}`);
      results.push({ id: site.id, status: 'OK', path: destPath });

      // Update the image path in the data
      site.image = `/assets/attractions/${site.id}${ext}`;
    } catch (err) {
      console.log(`FAILED: ${site.id} - ${err.message}`);
      results.push({ id: site.id, status: 'FAILED', error: err.message });
    }

    // Delay to be respectful to Wikimedia servers (longer wait to avoid rate limiting)
    await new Promise(r => setTimeout(r, 10000));
  }

  // Write updated JSON
  fs.writeFileSync('public/data/nature.json', JSON.stringify(data, null, 2));

  console.log('\n--- SUMMARY ---');
  console.log(`OK: ${results.filter(r => r.status === 'OK').length}`);
  console.log(`FAILED: ${results.filter(r => r.status === 'FAILED').length}`);
  console.log(`NO_URL: ${results.filter(r => r.status === 'NO_URL').length}`);
}

run().catch(console.error);