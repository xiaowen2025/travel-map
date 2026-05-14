# src/ File Structure

## Entry & Core

| File | Purpose |
|------|---------|
| `main.js` | App entry point. Initializes ECharts map, loads data (geojson, attractions, eras, destinations, nature), wires mode switching, language toggle, keyboard shortcuts, and scroll manager. |
| `mapEngine.js` | ECharts map initialization, geojson registration, `flyTo`, `updateMarkers`, `highlightRelated`, `showAllPoints`, `resizeChart`. |
| `state.js` | Simple observable state with `addEventListener` subscriptions for `change:*` events. |
| `i18n.js` | Internationalization — `t()` (translate), `loc()` / `getLoc()` (localized field access). Manages `locale` in state. |
| `constants.js` | Map zoom levels, symbol sizes, label font sizes, animation durations. |

## Data Helpers

| File | Purpose |
|------|---------|
| `countries.js` | `getCountry`, `getCountryByFullName`, `getCountryCode` utilities for country lookups. |
| `scrollManager.js` | `ScrollManager` class — detects scroll direction above a configurable threshold, fires callbacks. |

## UI

| File | Purpose |
|------|---------|
| `ui.js` | View mode switching, language toggle, static label updates, mode buttons, era panel, card expand/collapse, toasts. |
| `keyboardNavigation.js` | Keyboard navigation helpers. |
| `detailOverlay.js` | Reusable overlay component with fade animation, `show()` / `close()` / `isVisible`, ESC key handling. |
| `style.css` | All styles for the app. |

## Explorers

| File | Purpose |
|------|---------|
| `historyExplorer.js` | History timeline explorer. Points sorted by year (`sortYear`), scroll-driven navigation, era panel/toast, compact card display with expand timer. |
| `cityExplorer.js` | City explorer. Panel with destinations data, search, country filter, grouped display, card expansion opening a `detailOverlay`. |
| `natureExplorer.js` | Nature explorer. Panel with UNESCO natural/mixed heritage sites, ecosystem type filter, search, grouped display, card expansion. |

## Tests

| File | Purpose |
|------|---------|
| `attractions.test.js` | Tests for attractions data. |