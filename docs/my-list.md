# my-list.html Documentation

## Overview
`my-list.html` is a standalone page that displays a filtered list of attractions marked as "必须去" (must-visit) from `my_list.json`. Each card shows the attraction with era prefix, location, image, description, and personal comments.

## File Structure
```
travel-map/
├── my-list.html              # Standalone page (no bundler needed)
├── public/
│   └── data/
│       ├── my_list.json      # List data with ratings and comments
│       ├── attractions.json  # Attraction details (timeline points)
│       ├── eras.json         # Era definitions and names
│       └── countries.json    # Country code to name mapping
└── docs/
    └── my-list.md            # This documentation
```

## Data Flow

1. **Parallel Fetch** — 4 JSON files loaded simultaneously via `Promise.all`:
   - `my_list.json` — user's list with ratings
   - `attractions.json` — timeline points with full attraction data
   - `eras.json` — era categories (史前时代, 古典时代, etc.)
   - `countries.json` — ISO country codes to names

2. **Build Maps** — `attractionMap` from `timelinePoints` for O(1) lookup; `eraMap` from `eras` for O(1) era name resolution

3. **Filter** — `myList.filter(item => item.rating === RATING_MUST_GO)` keeps only "必须去" items

4. **Render** — Each item mapped to HTML card with era prefix, location, image, description

## Rating Values (my_list.json)
| Rating | Meaning |
|--------|---------|
| `必须去` | Must visit |
| `尽量去` | Recommended if time permits |
| `看情况` | Consider if nearby |

## Era Prefix Format
Cards display: `{eraName} · {era}` (e.g., "史前时代 · ~36000 BC")

The `era` field comes from `attractions.json`; the `eraName` is resolved via `eraKey` → `eras.json`.

## Style Override
The page loads `/src/style.css` but overrides `.attraction-card` and `.card-expanded` with inline `<style>` to ensure cards display correctly in standalone mode:
- `position: relative` (not absolute)
- `max-height: none` on `.card-expanded`
- Dark background `#0a0a0f`

## Screenshot Capture
Puppeteer script (`capture2.mjs`) generates standalone HTML for each card and captures screenshots:
```
node .my_list/capture2.mjs
```
Outputs to `.my_list/{index}-{name}.png`