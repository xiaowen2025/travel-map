import { state } from './state.js';
import { t, getLoc } from './i18n.js';

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
export function updateEraPanel(currentPoint) {
    if (!currentPoint) return;
    ui.eraTitle.innerText = getLoc(currentPoint, 'eraCategory');
    ui.eraDesc.innerText = getLoc(currentPoint, 'era');
}

// Show era transition toast
export function showEraToast(eraCategory) {
    const toast = ui.eraToast;
    toast.innerText = eraCategory;
    toast.style.opacity = 1;
    setTimeout(() => { toast.style.opacity = 0; }, 2500);
}

// Show detail panel
export function showDetailPanel(p) {
    state.set('activePointId', p.id);
    ui.detailEra.innerText = getLoc(p, 'eraCategory') + ' | ' + getLoc(p, 'era');
    ui.detailTitle.innerText = getLoc(p, 'name');
    ui.detailLoc.innerText = '📍 ' + getLoc(p, 'location');
    ui.detailHighlight.innerText = getLoc(p, 'shortDesc') || '';
    ui.detailDesc.innerText = getLoc(p, 'description') || '';

    if (p.image) {
        ui.detailImage.src = 'assets/' + p.image;
        ui.detailImage.alt = getLoc(p, 'name');
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
