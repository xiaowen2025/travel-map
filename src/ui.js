import { state } from './state.js';
import { t, getLoc } from './i18n.js';
import { getCountry } from './countries.js';
import {
    TOAST_DURATION_MS,
    SLIDE_ANIM_DURATION_MS,
    SYMBOL_SIZE_ACTIVE,
    SYMBOL_SIZE_SELECTED,
    LABEL_FONT_SIZE_NORMAL,
    LABEL_FONT_SIZE_CITY,
    LABEL_FONT_SIZE_EMPHASIS,
} from './constants.js';

// Find era by key directly from erasData
function findEraByKey(key) {
    const erasData = state.get('erasData');
    if (!erasData || !key) return null;
    return erasData.eras.find(e => e.key === key);
}

// DOM references
const ui = {
    eraTitle: document.getElementById('eraTitle'),
    eraDesc: document.getElementById('eraDesc'),
    eraToast: document.getElementById('eraToast'),
    eraToastName: document.getElementById('eraToastName'),
    eraToastDesc: document.getElementById('eraToastDesc'),
    eraPanel: document.getElementById('eraPanel'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    langToggle: document.getElementById('langToggle'),
    headerSubtitle: document.querySelector('.header p'),

    // New card elements
    attractionCard: document.getElementById('attractionCard'),
    cardEra: document.getElementById('cardEra'),
    cardTitle: document.getElementById('cardTitle'),
    cardShortDesc: document.getElementById('cardShortDesc'),
    cardLocation: document.getElementById('cardLocation'),
    cardExpanded: document.getElementById('cardExpanded'),
    cardImage: document.getElementById('cardImage'),
    cardDescription: document.getElementById('cardDescription'),
    cardMetaList: document.getElementById('cardMetaList'),
    cardBestTime: document.getElementById('cardBestTime'),
    cardWebsite: document.getElementById('cardWebsite'),
    labelBestTime: document.getElementById('labelBestTime'),
    labelWebsite: document.getElementById('labelWebsite'),
};

// ==================== Idle Timer for Expand ====================
let currentCardPoint = null;
let isExpanded = false;
let slideAnimTimer = null;

// ==================== Card Functions ====================

/**
 * Show compact card (title + shortDesc + location).
 * Called on every point change.
 * direction: 'up' | 'down' | null (for initial / click)
 */
export function showCompactCard(p, direction = null) {
    currentCardPoint = p;
    const locale = state.get('locale');
    const era = findEraByKey(getLoc(p, 'eraKey', locale));
    const eraName = era ? era.name[locale] || era.name.en : getLoc(p, 'eraKey', locale);

    // Collapse if currently expanded
    if (isExpanded) {
        collapseCard();
    }

    // ALWAYS update content immediately — never defer to setTimeout
    fillCompactContent(p, eraName, locale);

    // Clean up any lingering animation classes
    clearTimeout(slideAnimTimer);
    ui.attractionCard.classList.remove('slide-out-up', 'slide-out-down', 'slide-in-up', 'slide-in-down');

    // Apply a quick enter animation if direction is given
    if (direction) {
        const enterDir = direction === 'down' ? 'slide-in-up' : 'slide-in-down';
        // Force reflow so the animation restarts even on rapid presses
        void ui.attractionCard.offsetHeight;
        ui.attractionCard.classList.add(enterDir);

        slideAnimTimer = setTimeout(() => {
            ui.attractionCard.classList.remove(enterDir);
        }, SLIDE_ANIM_DURATION_MS);
    }

    // Make card visible
    ui.attractionCard.classList.add('visible');
}

function fillCompactContent(p, eraName, locale) {
    ui.cardEra.style.display = 'none';
    ui.cardTitle.innerText = getLoc(p, 'name', locale);
    ui.cardShortDesc.innerText = getLoc(p, 'shortDesc', locale) || '';
    // Use range tag for region if available, otherwise fall back to region field
    const rangeTag = p.tags?.find(t => t.startsWith('range:'));
    const regionLabel = rangeTag ? rangeTag.split(':')[1] : getLoc(p, 'region', locale);
    ui.cardLocation.innerText = '📍 ' + getCountry(p, locale) + (regionLabel ? ' · ' + regionLabel : '');
}

/**
 * Expand the card to reveal image + description.
 * Triggered after scroll idle or on map click.
 */
export function expandCard(p) {
    if (!p) p = currentCardPoint;
    if (!p) return;

    const locale = state.get('locale');

    // Set expanded content
    ui.cardDescription.innerText = getLoc(p, 'description', locale) || '';

    if (p.image) {
        ui.cardImage.src = p.image;
        ui.cardImage.alt = getLoc(p, 'name', locale);
        ui.cardImage.style.display = 'block';
    } else {
        ui.cardImage.style.display = 'none';
    }

    // Travel Metadata (mostly for nature sites)
    if (p.bestTimeToVisit || p.officialWebsite) {
        ui.cardMetaList.style.display = 'block';
        ui.labelBestTime.innerText = t('bestTime', locale) + ': ';
        ui.cardBestTime.innerText = p.bestTimeToVisit || '-';
        
        ui.labelWebsite.innerText = t('website', locale) + ': ';
        if (p.officialWebsite) {
            ui.cardWebsite.href = p.officialWebsite;
            ui.cardWebsite.innerText = p.officialWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
            ui.cardWebsite.style.display = 'inline';
        } else {
            ui.cardWebsite.style.display = 'none';
        }
    } else {
        ui.cardMetaList.style.display = 'none';
    }

    // Trigger accordion reveal
    ui.cardExpanded.classList.add('revealed');
    isExpanded = true;
}

/**
 * Collapse the expanded section.
 */
export function collapseCard() {
    ui.cardExpanded.classList.remove('revealed');
    isExpanded = false;
}

/**
 * Trigger card expansion immediately.
 */
export function startExpandTimer(p) {
    expandCard(p);
}

// ==================== Legacy-compatible exports ====================

// Update era panel
export function updateEraPanel(currentPoint, locale = 'zh') {
    if (!currentPoint) return;
    const eraCat = getLoc(currentPoint, 'eraKey');
    const era = findEraByKey(eraCat);

    if (era) {
        ui.eraTitle.innerText = era.name[locale] || era.name.en;
        ui.eraDesc.innerText = era.milestone[locale] || era.milestone.en;
    } else {
        ui.eraTitle.innerText = eraCat;
        ui.eraDesc.innerText = '';
    }
}

// Get milestone text for toast
export function getEraMilestone(eraCat, locale = 'zh') {
    const era = findEraByKey(eraCat);
    if (!era) return '';
    return era.milestone[locale] || era.milestone.en;
}

// Show era transition toast
let eraToastTimer = null;
export function showEraToast(eraCat) {
    const locale = state.get('locale');
    const era = findEraByKey(eraCat);
    const toast = ui.eraToast;

    // Set content: subtle name + large description
    ui.eraToastName.innerText = era ? era.name[locale] || era.name.en : eraCat;
    ui.eraToastDesc.innerText = era ? era.milestone[locale] || era.milestone.en : '';

    // Clear any previous hide timer
    if (eraToastTimer) clearTimeout(eraToastTimer);

    // Show: container opacity + child slide-in via .visible class
    toast.style.opacity = 1;
    // Force reflow so re-adding class restarts the child transitions
    toast.classList.remove('visible');
    void toast.offsetHeight;
    toast.classList.add('visible');

    eraToastTimer = setTimeout(() => {
        toast.classList.remove('visible');
        toast.style.opacity = 0;
    }, TOAST_DURATION_MS);
}

// Show/hide era panel based on view mode
export function setViewMode(mode) {
    if (mode === 'history') {
        ui.eraPanel.style.opacity = 1;
        ui.attractionCard.style.display = '';
    } else if (mode === 'city') {
        ui.eraPanel.style.opacity = 0;
        ui.attractionCard.classList.remove('visible');
        ui.attractionCard.style.display = 'none';
        collapseCard();
    } else if (mode === 'nature') {
        ui.eraPanel.style.opacity = 0;
        ui.attractionCard.style.display = '';
    }
}

// Update language toggle button
export function updateLangToggle(locale) {
    ui.langToggle.innerText = t('langLabel', locale);
}

// Update static UI labels
export function updateStaticLabels(locale) {
    ui.headerSubtitle.innerText = t('subtitle', locale);
}

// Update mode button labels
export function updateModeButtons(locale) {
    const modeKeys = ['modeHistory', 'modeCity', 'modeNature'];
    ui.modeBtns.forEach((btn, i) => {
        btn.innerText = t(modeKeys[i], locale);
    });
}

// Setup event listeners
export function setupEventListeners(handlers) {
    ui.modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            ui.modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            handlers.onModeChange(e.target.dataset.mode);
        });
    });

    ui.langToggle.addEventListener('click', handlers.onLangToggle);

    // Keyboard handler
    window.addEventListener('keydown', (e) => {
        const mode = state.get('viewMode');
        if (mode !== 'history' && mode !== 'nature') return;
        handlers.onKeydown?.(e);
    });
}

// Get UI reference
export function getUI() {
    return ui;
}
