// ==================== Magic Number Constants ====================
// All tunable magic numbers extracted from the codebase

// UI timings
export const EXPAND_DELAY_MS = 300;           // ms before auto-expand card
export const TOAST_DURATION_MS = 3000;         // era toast display duration
export const SLIDE_ANIM_DURATION_MS = 300;     // card slide animation duration

// Map zoom levels
export const MAP_ZOOM_INITIAL = 1.6;            // initial map zoom
export const MAP_ZOOM_FLYTO = 3.5;             // default zoom when flying to point
export const MAP_ANIMATION_DURATION_MS = 1200; // animation duration when flying

// Map symbol sizes
export const SYMBOL_SIZE_ACTIVE = 18;          // currently selected point
export const SYMBOL_SIZE_SELECTED = 20;        // clicked/related point
export const SYMBOL_SIZE_HISTORY = 12;         // history points in scatter
export const SYMBOL_SIZE_OTHER = 6;            // other points in scatter
export const SYMBOL_SIZE_DEFAULT = 8;          // default symbol size for city mode
export const SYMBOL_SIZE_GEOGRAPHY = 14;      // geography feature symbol size

// Map label fonts
export const LABEL_FONT_SIZE_NORMAL = 13;      // normal label font size
export const LABEL_FONT_SIZE_CITY = 12;       // city mode label font size
export const LABEL_FONT_SIZE_EMPHASIS = 14;   // emphasis label font size
export const LABEL_FONT_SIZE_GEOGRAPHY = 11;  // geography feature label font size

// Scroll management
export const SCROLL_THROTTLE_MS = 400;         // throttle ms for scroll events
