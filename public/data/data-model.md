# Travel Map Data Model

## destinations.json

```json
{ "destinations": [{ name, Region, Country, type, Latitude, Longitude,
  "Approximate Annual Tourists", Currency, Majority Religion, Famous Foods, Language,
  "Best Time to Visit", "Cost of Living", Safety, "Cultural Significance", Description, history }] }
```

- `name`: string — destination name
- `Region`: string — e.g. "Lazio"
- `Country`: string — e.g. "Italy"
- `type`: string — "City" | "Town" | "Region" | "Lake" | etc.
- `Latitude` / `Longitude`: float
- `Majority Religion`, `Best Time to Visit`, `Cost of Living`, `Safety`, `Description`: `{ en, zh }` bilingual
- `history`: `{ zh }` Chinese only

---

## attractions.json

```json
{ "timelinePoints": [{
  id, name: { en, zh }, era, sortYear, eraKey, category, coordinates,
  tags, shortDesc: { en, zh }, description: { en, zh }, image,
  country, region: { en, zh }, city
}] }
```

- `id`: string — unique slug, e.g. "altare-della-patria"
- `era`: string — human-readable range, e.g. "1885–1935" or "~36000 BC"
- `sortYear`: int — year for sorting (negative for BC)
- `eraKey`: string — key into eras.json, e.g. "late_modern"
- `category`: string — "cultural" | ...
- `coordinates`: [lng, lat]
- `country`: string — ISO code, e.g. "IT"

---

## eras.json

```json
{ "eras": [{ key, name: { en, zh }, dateRange: { start, end }, milestone: { en, zh } }] }
```

| key | name | dateRange |
|---|---|---|
| prehistory | Prehistory | -99999 ~ -3000 |
| ancient | Classical Antiquity | -3000 ~ 476 |
| medieval | Middle Ages | 477 ~ 1453 |
| early_modern | Early Modern Period | 1454 ~ 1788 |
| late_modern | Late Modern Period | 1789 ~ 1945 |
| contemporary | Contemporary | 1946 ~ present |

---

## countries.json

```json
{ "countries": { "<ISO>": { en, zh } }, "fullNames": { "<name>": "<ISO>" } }
```

- ISO 2-letter codes as keys (FR, DE, IT, ES, PL, GB, GR, AT, VA, PT, CZ, HR, BE, TR, SI, NL, MT, IE, HU, BA, SK, CH, SE, NO, DK, FI, EE, LV, LT, RO, BG, RS, AL, MK, XK, ME, LU, CY, AD, MC, SM, LI, IS, BY, MD, UA)
- `fullNames` inverts the map for lookup

---

## nature.json

```json
{ "sites": [{
  id, name: { en, zh }, category, tags, country, coordinates,
  shortDesc: { en, zh }, description: { en, zh }, image,
  bestTimeToVisit, recommendedDuration, officialWebsite, tickets
}] }
```

- `category`: string — "Natural"
- `tags`: array of strings — `["key:value"]`, e.g., `["range:Alps", "feature:Mountain", "unesco:natural"]`
- `coordinates`: [lng, lat]