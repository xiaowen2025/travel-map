import { state } from './state.js';
import { t, getLoc } from './i18n.js';

// Find era by key directly from erasData
function findEraByKey(key) {
    const erasData = state.get('erasData');
    if (!erasData) return null;
    return erasData.eras.find(e => e.key === key);
}

// DOM references
const ui = {
    eraTitle: document.getElementById('eraTitle'),
    detailPanel: document.getElementById('detailPanel'),
    closeDetail: document.getElementById('closeDetail'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    langToggle: document.getElementById('langToggle'),
    eraDesc: document.getElementById('eraDesc'),
    eraToast: document.getElementById('eraToast'),
    eraPanel: document.getElementById('eraPanel'),
    scrollIndicator: document.querySelector('.scroll-indicator'),
    detailEra: document.getElementById('detailEra'),
    detailTitle: document.getElementById('detailTitle'),
    detailLoc: document.getElementById('detailLoc'),
    detailImage: document.getElementById('detailImage'),
    detailHighlight: document.getElementById('detailHighlight'),
    detailDesc: document.getElementById('detailDesc'),
    headerSubtitle: document.querySelector('.header p')
};

// Update era panel
export function updateEraPanel(currentPoint, locale = 'zh') {
    if (!currentPoint) return;
    const eraCat = getLoc(currentPoint, 'eraCategory');
    const era = findEraByKey(eraCat);

    if (era) {
        ui.eraTitle.innerText = era.name[locale] || era.name.en;
        ui.eraDesc.innerText = era.dateRange[locale] || era.dateRange.en;
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

// Show detail panel
export function showDetailPanel(p) {
    state.set('activePointId', p.id);
    const locale = state.get('locale');
    const era = findEraByKey(getLoc(p, 'eraCategory', locale));
    const eraName = era ? era.name[locale] || era.name.en : getLoc(p, 'eraCategory', locale);
    ui.detailEra.innerText = eraName + ' | ' + getLoc(p, 'era', locale);
    ui.detailTitle.innerText = getLoc(p, 'name', locale);
    ui.detailLoc.innerText = '📍 ' + getLoc(p, 'country', locale) + (getLoc(p, 'region', locale) ? ', ' + getLoc(p, 'region', locale) : '');
    ui.detailHighlight.innerText = getLoc(p, 'shortDesc', locale) || '';
    ui.detailDesc.innerText = getLoc(p, 'description', locale) || '';

    if (p.image) {
        ui.detailImage.src = 'assets/' + p.image;
        ui.detailImage.alt = getLoc(p, 'name', locale);
        ui.detailImage.style.display = 'block';
    } else {
        ui.detailImage.style.display = 'none';
    }

    ui.detailPanel.classList.add('open');
}

// Close detail panel
export function closeDetailPanel() {
    ui.detailPanel.classList.remove('open');
    state.set('activePointId', null);
}

// Show/hide scroll indicator and era panel based on view mode
export function setViewMode(mode) {
    if (mode === 'history') {
        ui.eraPanel.style.opacity = 1;
        ui.scrollIndicator.style.opacity = 1;
    } else {
        ui.eraPanel.style.opacity = 0;
        ui.scrollIndicator.style.opacity = 0;
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
    ui.closeDetail.addEventListener('click', handlers.onCloseDetail);

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
