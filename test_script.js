import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./public/data/destinations.json'));

function getCityType(dest) {
    const t = dest.type;
    if (t === null) return '';
    if (typeof t === 'object') return t.en || '';
    return t || '';
}

function isCity(dest) {
    return getCityType(dest) === 'City';
}

try {
    const cities = data.destinations.filter(isCity);
    console.log("Cities count:", cities.length);
} catch (e) {
    console.error("Error:", e);
}
