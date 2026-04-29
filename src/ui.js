import { state } from './state.js';
import { t, getLoc } from './i18n.js';
import { getCountry } from './countries.js';

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
    eraPanel: document.getElementById('eraPanel'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    langToggle: document.getElementById('langToggle'),
    scrollIndicator: document.querySelector('.scroll-indicator'),
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
};

// ==================== Idle Timer for Expand ====================
let scrollIdleTimer = null;
let currentCardPoint = null;
let isExpanded = false;
let slideAnimTimer = null;

const EXPAND_DELAY = 800; // ms before auto-expand

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
        }, 300);
    }

    // Make card visible
    ui.attractionCard.classList.add('visible');
}

function fillCompactContent(p, eraName, locale) {
    ui.cardEra.innerText = eraName + ' · ' + getLoc(p, 'era', locale);
    ui.cardTitle.innerText = getLoc(p, 'name', locale);
    ui.cardShortDesc.innerText = getLoc(p, 'shortDesc', locale) || '';
    ui.cardLocation.innerText = '📍 ' + getCountry(p, locale) + (getLoc(p, 'region', locale) ? ' · ' + getLoc(p, 'region', locale) : '');
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
        ui.cardImage.src = 'assets/' + p.image;
        ui.cardImage.alt = getLoc(p, 'name', locale);
        ui.cardImage.style.display = 'block';
    } else {
        ui.cardImage.style.display = 'none';
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
 * Start the idle timer. After EXPAND_DELAY ms without another call,
 * the card will expand.
 */
export function startExpandTimer(p) {
    clearExpandTimer();
    scrollIdleTimer = setTimeout(() => {
        expandCard(p);
    }, EXPAND_DELAY);
}

/**
 * Clear the idle timer (called on every new scroll event).
 */
export function clearExpandTimer() {
    if (scrollIdleTimer) {
        clearTimeout(scrollIdleTimer);
        scrollIdleTimer = null;
    }
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
export function showEraToast(eraCat) {
    const locale = state.get('locale');
    const era = findEraByKey(eraCat);
    const toast = ui.eraToast;
    toast.innerText = era ? era.name[locale] || era.name.en : eraCat;
    toast.style.opacity = 1;
    setTimeout(() => { toast.style.opacity = 0; }, 2500);
}

// Show/hide scroll indicator and era panel based on view mode
export function setViewMode(mode) {
    if (mode === 'history') {
        ui.eraPanel.style.opacity = 1;
        ui.scrollIndicator.style.opacity = 1;
        ui.attractionCard.style.display = '';
    } else {
        ui.eraPanel.style.opacity = 0;
        ui.scrollIndicator.style.opacity = 0;
        // Hide attraction card in non-history modes
        ui.attractionCard.classList.remove('visible');
        ui.attractionCard.style.display = 'none';
        collapseCard();
    }
}

// Update language toggle button
export function updateLangToggle(locale) {
    ui.langToggle.innerText = t('langLabel', locale);
}

// Update static UI labels
export function updateStaticLabels(locale) {
    ui.headerSubtitle.innerText = t('subtitle', locale);
    ui.scrollIndicator.querySelector('span').innerText = t('scrollHint', locale);
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
        if (state.get('viewMode') !== 'history') return;
        handlers.onKeydown?.(e);
    });
}

// Get UI reference
export function getUI() {
    return ui;
}
