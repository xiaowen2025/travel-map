/**
 * Build nature.json from whc001.json + manually curated European coordinates & images.
 * Run: node scripts/build_nature_json.js
 */
import { readFileSync, writeFileSync } from 'fs';

const whcData = JSON.parse(readFileSync('public/data/processing/whc001.json', 'utf-8'));

// Manually curated European Natural/Mixed WHC sites with coordinates and image URLs
// Coordinates are [longitude, latitude] to match the app's convention
// Only sites visible on the European map extent (~-25 to 45 lng, 35 to 72 lat)
const europeanSites = [
  {
    id: "plitvice-lakes",
    nameOverride: { en: "Plitvice Lakes National Park", zh: "普利特维采湖群国家公园" },
    country: "Croatia",
    coordinates: [15.621, 44.880],
    image: "https://whc.unesco.org/uploads/thumbs/site_0098_0001-750-0-20151104175441.jpg",
    whcId: 98,
    ecosystemType: "Lakes"
  },
  {
    matchName: "Białowieża Forest",
    country: "Poland / Belarus",
    coordinates: [23.870, 52.750],
    image: "https://whc.unesco.org/uploads/thumbs/site_0033_0005-750-0-20151104113735.jpg",
    ecosystemType: "Forest"
  },
  {
    matchName: "Giant's Causeway and Causeway Coast",
    country: "United Kingdom",
    coordinates: [-6.512, 55.241],
    image: "https://whc.unesco.org/uploads/thumbs/site_0369_0006-750-0-20151104145424.jpg",
    ecosystemType: "Coastal"
  },
  {
    matchName: "Pirin National Park",
    country: "Bulgaria",
    coordinates: [23.433, 41.750],
    image: "https://whc.unesco.org/uploads/thumbs/site_0225_0003-750-0-20151104112223.jpg",
    ecosystemType: "Mountain"
  },
  {
    id: "srebarna-nature-reserve",
    nameOverride: { en: "Srebarna Nature Reserve", zh: "斯雷巴尔纳自然保护区" },
    shortDescOverride: {
      en: "The Srebarna Nature Reserve is a freshwater lake adjacent to the Danube and extending over 600 ha. It is the breeding ground of almost 100 species of birds.",
      zh: "斯雷巴尔纳自然保护区是一个毗邻多瑙河的淡水湖，面积超过600公顷。这里是近100种鸟类的繁殖地。"
    },
    country: "Bulgaria",
    coordinates: [27.073, 44.107],
    image: "https://whc.unesco.org/uploads/thumbs/site_0219_0002-750-0-20151104111720.jpg",
    ecosystemType: "Wetland"
  },
  {
    matchName: "Škocjan Caves",
    country: "Slovenia",
    coordinates: [13.993, 45.663],
    image: "https://whc.unesco.org/uploads/thumbs/site_0390_0002-750-0-20151104150152.jpg",
    ecosystemType: "Cave"
  },
  {
    matchName: "Durmitor National Park",
    country: "Montenegro",
    coordinates: [19.028, 43.151],
    image: "https://whc.unesco.org/uploads/thumbs/site_0100_0008-750-0-20151104113004.jpg",
    ecosystemType: "Mountain"
  },
  {
    matchName: "The Dolomites",
    country: "Italy",
    coordinates: [12.160, 46.610],
    image: "https://whc.unesco.org/uploads/thumbs/site_1237_0001-750-0-20151104163741.jpg",
    ecosystemType: "Mountain"
  },
  {
    matchName: "Mount Etna",
    country: "Italy",
    coordinates: [14.993, 37.751],
    image: "https://whc.unesco.org/uploads/thumbs/site_1427_0004-750-0-20151104170655.jpg",
    ecosystemType: "Volcanic"
  },
  {
    id: "aeolian-islands",
    nameOverride: { en: "Isole Eolie (Aeolian Islands)", zh: "伊奥利亚群岛" },
    shortDescOverride: {
      en: "The Aeolian Islands provide an outstanding record of volcanic island-building and destruction. The ongoing volcanic phenomena provide a rich field of study for volcanology.",
      zh: "伊奥利亚群岛提供了火山岛形成与毁灭的杰出记录。持续的火山现象为火山学研究提供了丰富的素材。"
    },
    country: "Italy",
    coordinates: [14.960, 38.530],
    image: "https://whc.unesco.org/uploads/thumbs/site_0908_0001-750-0-20151104160039.jpg",
    ecosystemType: "Volcanic"
  },
  {
    matchName: "Evaporitic Karst and Caves of Northern Apennines",
    country: "Italy",
    coordinates: [11.630, 44.270],
    image: "https://whc.unesco.org/uploads/thumbs/site_1692_0001-750-0-20231002094049.jpg",
    ecosystemType: "Cave"
  },
  {
    matchName: "Monte San Giorgio",
    country: "Italy / Switzerland",
    coordinates: [8.950, 45.910],
    image: "https://whc.unesco.org/uploads/thumbs/site_1090_0001-750-0-20151104161244.jpg",
    ecosystemType: "Mountain"
  },
  {
    matchName: "Swiss Alps Jungfrau-Aletsch",
    country: "Switzerland",
    coordinates: [7.980, 46.540],
    image: "https://whc.unesco.org/uploads/thumbs/site_1037_0003-750-0-20151104160637.jpg",
    ecosystemType: "Glacial"
  },
  {
    matchName: "Swiss Tectonic Arena Sardona",
    country: "Switzerland",
    coordinates: [9.220, 46.930],
    image: "https://whc.unesco.org/uploads/thumbs/site_1179_0004-750-0-20151104162645.jpg",
    ecosystemType: "Mountain"
  },
  {
    matchName: "Vatnajökull National Park - Dynamic Nature of Fire and Ice",
    country: "Iceland",
    coordinates: [-16.770, 64.420],
    image: "https://whc.unesco.org/uploads/thumbs/site_1604_0001-750-0-20190711094011.jpg",
    ecosystemType: "Glacial"
  },
  {
    matchName: "Surtsey",
    country: "Iceland",
    coordinates: [-20.605, 63.303],
    image: "https://whc.unesco.org/uploads/thumbs/site_1267_0001-750-0-20151104164112.jpg",
    ecosystemType: "Volcanic"
  },
  {
    matchName: "Doñana National Park",
    country: "Spain",
    coordinates: [-6.440, 36.980],
    image: "https://whc.unesco.org/uploads/thumbs/site_0685_0004-750-0-20151104154239.jpg",
    ecosystemType: "Wetland"
  },
  {
    matchName: "Teide National Park",
    country: "Spain",
    coordinates: [-16.642, 28.272],
    image: "https://whc.unesco.org/uploads/thumbs/site_1258_0002-750-0-20151104163909.jpg",
    ecosystemType: "Volcanic"
  },
  {
    matchName: "Garajonay National Park",
    country: "Spain",
    coordinates: [-17.230, 28.120],
    image: "https://whc.unesco.org/uploads/thumbs/site_0380_0002-750-0-20151104145727.jpg",
    ecosystemType: "Forest"
  },
  {
    matchName: "Gulf of Porto: Calanche of Piana, Gulf of Girolata, Scandola Reserve",
    country: "France",
    coordinates: [8.580, 42.350],
    image: "https://whc.unesco.org/uploads/thumbs/site_0258_0005-750-0-20151104114726.jpg",
    ecosystemType: "Coastal"
  },
  {
    matchName: "Chaîne des Puys - Limagne fault tectonic arena",
    country: "France",
    coordinates: [2.960, 45.774],
    image: "https://whc.unesco.org/uploads/thumbs/site_1434_0003-750-0-20180702152110.jpg",
    ecosystemType: "Volcanic"
  },
  {
    id: "wadden-sea",
    nameOverride: { en: "Wadden Sea", zh: "瓦登海" },
    shortDescOverride: {
      en: "The Wadden Sea is the largest unbroken system of intertidal sand and mud flats in the world, spanning the coasts of Denmark, Germany and the Netherlands.",
      zh: "瓦登海是世界上最大的连续潮间带沙泥滩系统，横跨丹麦、德国和荷兰海岸。"
    },
    country: "Denmark / Germany / Netherlands",
    coordinates: [8.250, 53.890],
    image: "https://whc.unesco.org/uploads/thumbs/site_1314_0005-750-0-20151104165138.jpg",
    ecosystemType: "Coastal"
  },
  {
    matchName: "Stevns Klint",
    country: "Denmark",
    coordinates: [12.443, 55.269],
    image: "https://whc.unesco.org/uploads/thumbs/site_1416_0001-750-0-20151104170422.jpg",
    ecosystemType: "Coastal"
  },
  {
    matchName: "Møns Klint",
    country: "Denmark",
    coordinates: [12.546, 54.968],
    image: "https://whc.unesco.org/uploads/thumbs/site_1728_0001-750-0-20241001055447.jpg",
    ecosystemType: "Coastal"
  },
  {
    id: "messel-pit",
    nameOverride: { en: "Messel Pit Fossil Site", zh: "梅塞尔化石坑" },
    shortDescOverride: {
      en: "Messel Pit provides the single best site for understanding the living environment of the Eocene, between 57 million and 36 million years ago.",
      zh: "梅塞尔化石坑是了解始新世生活环境的最佳地点，记录了5700万至3600万年前的生态。"
    },
    country: "Germany",
    coordinates: [8.760, 49.920],
    image: "https://whc.unesco.org/uploads/thumbs/site_0720_0002-750-0-20151104155155.jpg",
    ecosystemType: "Fossil"
  },
  {
    matchName: "High Coast / Kvarken Archipelago",
    country: "Sweden / Finland",
    coordinates: [18.490, 63.140],
    image: "https://whc.unesco.org/uploads/thumbs/site_0898_0003-750-0-20151104155734.jpg",
    ecosystemType: "Coastal"
  },
  {
    matchName: "Danube Delta",
    country: "Romania",
    coordinates: [29.510, 45.060],
    image: "https://whc.unesco.org/uploads/thumbs/site_0588_0001-750-0-20151104152629.jpg",
    ecosystemType: "Wetland"
  },
  {
    matchName: "Caves of Aggtelek Karst and Slovak Karst",
    country: "Hungary / Slovakia",
    coordinates: [20.490, 48.490],
    image: "https://whc.unesco.org/uploads/thumbs/site_0725_0004-750-0-20151104155315.jpg",
    ecosystemType: "Cave"
  },
  {
    matchName: "Dorset and East Devon Coast",
    country: "United Kingdom",
    coordinates: [-2.610, 50.620],
    image: "https://whc.unesco.org/uploads/thumbs/site_1029_0003-750-0-20151104160523.jpg",
    ecosystemType: "Coastal"
  },
  {
    matchName: "The Flow Country",
    country: "United Kingdom",
    coordinates: [-3.850, 58.370],
    image: "https://whc.unesco.org/uploads/thumbs/site_1722_0001-750-0-20240926133115.jpg",
    ecosystemType: "Wetland"
  },
  {
    matchName: "Laurisilva of Madeira",
    country: "Portugal",
    coordinates: [-17.060, 32.760],
    image: "https://whc.unesco.org/uploads/thumbs/site_0934_0004-750-0-20151104155914.jpg",
    ecosystemType: "Forest"
  },
  {
    matchName: "Vjetrenica Cave, Ravno",
    country: "Bosnia and Herzegovina",
    coordinates: [17.989, 42.847],
    image: "https://whc.unesco.org/uploads/thumbs/site_1673_0004-750-0-20230321171259.jpg",
    ecosystemType: "Cave"
  },
  {
    id: "west-norwegian-fjords",
    nameOverride: { en: "West Norwegian Fjords – Geirangerfjord and Nærøyfjord", zh: "挪威西峡湾-盖朗厄尔峡湾和纳柔依峡湾" },
    shortDescOverride: {
      en: "Situated in south-western Norway, the two fjords are among the world's longest and deepest, featuring towering cliff walls, waterfalls and diverse wildlife.",
      zh: "位于挪威西南部，这两条峡湾是世界上最长最深的峡湾之一，拥有高耸的悬崖壁、瀑布和多样的野生动物。"
    },
    country: "Norway",
    coordinates: [7.095, 62.105],
    image: "https://whc.unesco.org/uploads/thumbs/site_1195_0005-750-0-20151104162827.jpg",
    ecosystemType: "Coastal"
  },
  {
    id: "colchic-rainforests",
    nameOverride: { en: "Colchic Rainforests and Wetlands", zh: "科尔基斯雨林和湿地" },
    shortDescOverride: {
      en: "A chain of rainforests and wetlands along the eastern coast of the Black Sea in western Georgia, these ancient forests are refugia for many species.",
      zh: "沿着格鲁吉亚西部黑海东岸的一系列雨林和湿地，这些古老的森林是许多物种的避难所。"
    },
    country: "Georgia",
    coordinates: [41.880, 42.100],
    image: "https://whc.unesco.org/uploads/thumbs/site_1616_0002-750-0-20211028103920.jpg",
    ecosystemType: "Forest"
  },
  {
    id: "virgin-komi-forests",
    nameOverride: { en: "Virgin Komi Forests", zh: "科米原始森林" },
    shortDescOverride: {
      en: "The Virgin Komi Forests cover 3.28 million ha of tundra and mountain tundra in the Urals, one of the most extensive areas of virgin boreal forest remaining in Europe.",
      zh: "科米原始森林覆盖乌拉尔山脉328万公顷的苔原和山地苔原，是欧洲现存最大面积的原始北方针叶林之一。"
    },
    country: "Russia",
    coordinates: [58.750, 63.500],
    image: "https://whc.unesco.org/uploads/thumbs/site_0719_0001-750-0-20151104155109.jpg",
    ecosystemType: "Forest"
  },
  {
    matchName: "Western Caucasus",
    country: "Russia",
    coordinates: [40.200, 43.700],
    image: "https://whc.unesco.org/uploads/thumbs/site_0900_0003-750-0-20151104155802.jpg",
    ecosystemType: "Mountain"
  },
  {
    matchName: "Hierapolis-Pamukkale",
    country: "Turkey",
    coordinates: [29.124, 37.920],
    image: "https://whc.unesco.org/uploads/thumbs/site_0485_0009-750-0-20151104151840.jpg",
    ecosystemType: "Geological"
  },
  {
    matchName: "Ancient and Primeval Beech Forests of the Carpathians and Other Regions of Europe",
    country: "Transnational (18 countries)",
    coordinates: [22.540, 48.470],
    image: "https://whc.unesco.org/uploads/thumbs/site_1133_0020-750-0-20210804114548.jpg",
    ecosystemType: "Forest"
  },
  {
    matchName: "Hyrcanian Forests",
    country: "Azerbaijan / Iran",
    coordinates: [48.850, 38.850],
    image: "https://whc.unesco.org/uploads/thumbs/site_1584_0002-750-0-20190711094355.jpg",
    ecosystemType: "Forest"
  }
];

// Build output
const sites = [];

for (const site of europeanSites) {
  let whcEntry = null;

  if (site.matchName) {
    whcEntry = whcData.find(d => d.name_en === site.matchName);
  }

  const id = site.id || site.matchName?.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const name = site.nameOverride || (whcEntry ? {
    en: whcEntry.name_en,
    zh: whcEntry.name_zh || whcEntry.name_en
  } : { en: site.matchName, zh: site.matchName });

  const shortDesc = site.shortDescOverride || (whcEntry ? {
    en: whcEntry.short_description_en || '',
    zh: whcEntry.short_description_zh || whcEntry.short_description_en || ''
  } : { en: '', zh: '' });

  const description = whcEntry ? {
    en: whcEntry.description_en || '',
    zh: '' // no zh description in whc001
  } : { en: '', zh: '' };

  const category = whcEntry?.category || 'Natural';

  sites.push({
    id,
    name,
    category,
    ecosystemType: site.ecosystemType,
    country: site.country,
    coordinates: site.coordinates,
    shortDesc,
    description,
    image: site.image,
    whcId: site.whcId || null
  });
}

const output = { sites };

writeFileSync('public/data/nature.json', JSON.stringify(output, null, 2), 'utf-8');
console.log(`✅ Wrote ${sites.length} European natural sites to public/data/nature.json`);
