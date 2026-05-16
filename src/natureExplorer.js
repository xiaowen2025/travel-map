import { state } from './state.js';
import { t, getLoc, loc } from './i18n.js';
import { flyTo, showAllPoints, updateMarkers, showGeographyPoints } from './mapEngine.js';
import { createDetailOverlay } from './detailOverlay.js';
import {
    showCompactCard, collapseCard, startExpandTimer
} from './ui.js';

// ==================== Ecosystem Config ====================
const ECOSYSTEM_ICONS = {
    'Forest': '🌲', 'Mountain': '⛰️', 'Coastal': '🌊',
    'Volcanic': '🌋', 'Cave': '🦇', 'Glacial': '🏔️',
    'Wetland': '🦆', 'Lakes': '💧', 'Geological': '💎', 'Fossil': '🦴'
};

const ECOSYSTEM_COLORS = {
    'Forest': '#4ade80',
    'Mountain': '#E8CA88',
    'Coastal': '#38bdf8',
    'Volcanic': '#f87171',
    'Cave': '#a78bfa',
    'Glacial': '#cbd5e1',
    'Wetland': '#fbbf24',
    'Lakes': '#60a5fa',
    'Geological': '#fb923c',
    'Fossil': '#d97706'
};

const getFeature = (site) => site.tags?.find(t => t.startsWith('feature:'))?.split(':')[1] || 'Other';

// ==================== i18n labels ====================
const labels = {
    zh: {
        panelTitle: '自然风光',
        panelSubtitle: '探索欧洲壮丽的自然遗产',
        searchPlaceholder: '搜索自然景观...',
        all: '全部',
        ecosystem: '生态系统',
        country: '国家',
        noResults: '未找到匹配的自然景观',
        sites: '处景观',
        description: '详情介绍',
        bestTimeToVisit: '最佳游览时间',
        officialWebsite: '官方网站'
    },
    en: {
        panelTitle: 'Nature Explorer',
        panelSubtitle: 'Discover Europe\'s natural heritage',
        searchPlaceholder: 'Search natural sites...',
        all: 'All',
        ecosystem: 'Ecosystem',
        country: 'Country',
        noResults: 'No natural sites found',
        sites: 'sites',
        description: 'Description',
        bestTimeToVisit: 'Best Time to Visit',
        officialWebsite: 'Official Website'
    }
};

function label(key) {
    const locale = state.get('locale');
    return labels[locale]?.[key] || labels.en[key] || key;
}

// ==================== State ====================
let isActive = false;
let allSites = [];
let activeSiteId = null;
let detailController = null;
let panelEl = null;
let currentFilter = 'all';

// ==================== State Subscriptions ====================

state.addEventListener('change:currentPointIndex', (e) => {
    if (!isActive) return;

    const { value, oldValue } = e.detail;
    const data = state.get('natureData');
    if (!data) return;

    const isScroll = oldValue !== undefined && Math.abs(value - oldValue) === 1;
    const direction = isScroll ? (value > oldValue ? 'down' : 'up') : null;

    updateMarkers(value, data);

    const currentPoint = data[value];
    if (currentPoint?.coordinates[0] !== 0) {
        flyTo(currentPoint.coordinates, 5, isScroll);
    }

    // Update side panel highlight
    setActiveSite(currentPoint.id, false); // false to avoid scrolling panel if we're keyboard navigating? 
    // Actually, we probably want to scroll the panel too.
    const card = panelEl?.querySelector(`.attraction-card[data-id="${currentPoint.id}"]`);
    if (card && isScroll) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Card: compact
    collapseCard();
    showCompactCard(currentPoint, direction);
    startExpandTimer(currentPoint);
});

state.addEventListener('change:activePointId', (e) => {
    if (!isActive) return;
    const { value } = e.detail;
    if (value === null) {
        updateMarkers(state.get('currentPointIndex'), state.get('natureData'));
    }
});

// ==================== Lifecycle ====================

export function initNatureExplorer(natureData) {
    panelEl = document.getElementById('natureExplorer');
    allSites = Array.isArray(natureData) ? natureData : (natureData.sites || []);
    allSites = allSites.map(site => ({
        ...site,
        eraKey: getFeature(site)
    }));
    state.set('natureData', allSites);
}

export function showNatureExplorer() {
    isActive = true;
    if (panelEl) {
        renderPanel();
        panelEl.classList.add('visible');
    }
    
    // Show geography layer
    const geographyData = state.get('geographyData');
    const locale = state.get('locale');
    showGeographyPoints(geographyData, locale);

    const data = state.get('natureData');
    if (data) {
        // Use existing index or reset to 0
        const idx = state.get('currentPointIndex') || 0;
        if (idx >= data.length) state.set('currentPointIndex', 0);
        else {
            // Trigger update manually for initial show
            updateMarkers(idx, data);
            const currentPoint = data[idx];
            if (currentPoint) {
                showCompactCard(currentPoint);
                startExpandTimer(currentPoint);
                setActiveSite(currentPoint.id);
            }
        }
    }
}

export function hideNatureExplorer() {
    isActive = false;
    if (panelEl) {
        panelEl.classList.remove('visible');
    }
    collapseCard();
    closeNatureDetail();

    // Hide geography layer
    showGeographyPoints(null);
}

export function refreshNatureExplorer() {
    if (!isActive) return;
    renderPanel();
    
    // Refresh geography layer for locale change
    const geographyData = state.get('geographyData');
    const locale = state.get('locale');
    showGeographyPoints(geographyData, locale);

    const data = state.get('natureData');
    const idx = state.get('currentPointIndex');
    if (data && data[idx]) {
        updateMarkers(idx, data);
        showCompactCard(data[idx]);
        startExpandTimer(data[idx]);
        setActiveSite(data[idx].id);
    }
}

// ==================== Navigation ====================

function navigateTo(index) {
    if (!isActive) return;
    const data = state.get('natureData');
    if (!data || index < 0 || index >= data.length) return;
    state.set('currentPointIndex', index);
}

export function handleScroll(direction) {
    if (!isActive) return;
    if (direction === 'down') {
        navigateTo(state.get('currentPointIndex') + 1);
    } else {
        navigateTo(state.get('currentPointIndex') - 1);
    }
}

export function handleKeydown(e) {
    if (!isActive) return;
    const data = state.get('natureData');
    if (!data || data.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateTo(state.get('currentPointIndex') + 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateTo(state.get('currentPointIndex') - 1);
    } else if (e.key === 'Escape') {
        collapseCard();
        closeNatureDetail();
    }
}

// ==================== Render Panel ====================

function renderPanel() {
    const locale = state.get('locale');
    const ecosystems = [...new Set(allSites.map(getFeature))].sort();

    panelEl.innerHTML = `
        <div class="nature-panel-header">
            <h2 class="nature-panel-title">${label('panelTitle')}</h2>
            <p class="nature-panel-subtitle">${allSites.length} ${label('sites')}</p>
            <div class="nature-search-wrapper">
                <span class="nature-search-icon">🔍</span>
                <input type="text" class="nature-search" id="natureSearchInput"
                       placeholder="${label('searchPlaceholder')}" autocomplete="off">
            </div>
            <div class="nature-filter-row">
                <div class="nature-filter-chip ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                    ${label('all')}
                </div>
                ${ecosystems.map(eco => `
                    <div class="nature-filter-chip ${currentFilter === eco ? 'active' : ''}" data-filter="${eco}">
                        <span class="nature-type-icon">${ECOSYSTEM_ICONS[eco] || '🌍'}</span>
                        ${eco}
                    </div>
                `).join('')}
            </div>
        </div>
        <div id="natureListContainer"></div>
        <div class="nature-panel-footer"></div>
    `;

    const searchInput = panelEl.querySelector('#natureSearchInput');
    searchInput.addEventListener('input', (e) => renderNatureList(e.target.value.trim(), currentFilter));

    panelEl.querySelectorAll('.nature-filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            currentFilter = chip.dataset.filter;
            panelEl.querySelectorAll('.nature-filter-chip').forEach(c => c.classList.toggle('active', c === chip));
            renderNatureList(searchInput.value.trim(), currentFilter);
        });
    });

    renderNatureList();
}

function renderNatureList(search = '', filter = 'all') {
    const container = panelEl.querySelector('#natureListContainer');
    if (!container) return;

    const locale = state.get('locale');
    const searchLower = search.toLowerCase();

    let filtered = allSites.filter(site => {
        const feat = getFeature(site);
        const matchesSearch = !search ||
            getLoc(site, 'name', locale).toLowerCase().includes(searchLower) ||
            site.country.toLowerCase().includes(searchLower) ||
            feat.toLowerCase().includes(searchLower);
        
        const matchesFilter = filter === 'all' || feat === filter;
        
        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="nature-no-results">
                <span class="nature-no-results-icon">🍃</span>
                ${label('noResults')}
            </div>
        `;
        return;
    }

    // Group by ecosystem if in "all" view, otherwise just show list
    let html = '';
    if (filter === 'all' && !search) {
        const grouped = {};
        filtered.forEach(site => {
            const feat = getFeature(site);
            if (!grouped[feat]) grouped[feat] = [];
            grouped[feat].push(site);
        });

        Object.keys(grouped).sort().forEach(eco => {
            html += `
                <div class="nature-type-group">
                    <div class="nature-type-header">
                        <span class="nature-type-icon">${ECOSYSTEM_ICONS[eco] || '🌍'}</span>
                        <span class="nature-type-name">${eco}</span>
                        <span class="nature-type-count">${grouped[eco].length}</span>
                    </div>
                    ${grouped[eco].map(site => renderSiteCard(site, locale)).join('')}
                </div>
            `;
        });
    } else {
        html = `<div style="padding: 0 20px;">${filtered.map(site => renderSiteCard(site, locale)).join('')}</div>`;
    }

    container.innerHTML = html;

    // Click events
    container.querySelectorAll('.attraction-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const index = allSites.findIndex(s => s.id === id);
            if (index !== -1) {
                navigateTo(index);
            }
        });
    });
}

function renderSiteCard(site, locale) {
    const id = site.id;
    const isActiveCard = activeSiteId === id;

    return `
        <div class="attraction-card ${isActiveCard ? 'active' : ''}" data-id="${id}">
            <div class="card-header">
                <h4 class="card-title">${getLoc(site, 'name', locale)}</h4>
            </div>
            <p class="card-meta">${site.country}</p>
            ${getLoc(site, 'shortDesc', locale) ? `<p class="card-short-desc">${getLoc(site, 'shortDesc', locale)}</p>` : ''}
        </div>
    `;
}

function setActiveSite(id, scrollIntoView = true) {
    activeSiteId = id;
    if (!panelEl) return;
    panelEl.querySelectorAll('.attraction-card').forEach(card => {
        card.classList.toggle('active', card.dataset.id === id);
    });
    
    if (scrollIntoView) {
        const activeCard = panelEl.querySelector(`.attraction-card[data-id="${id}"]`);
        activeCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ==================== Detail Overlay ====================

function showNatureDetail(site) {
    if (detailController) detailController.close();

    const locale = state.get('locale');
    const name = getLoc(site, 'name', locale);
    const eco = getFeature(site);
    const icon = ECOSYSTEM_ICONS[eco] || '🌍';
    const description = getLoc(site, 'description', locale);
    const shortDesc = getLoc(site, 'shortDesc', locale);

    const renderContent = () => `
        <button class="nature-detail-close">✕</button>
        <div class="nature-detail-header">
            <div class="nature-detail-ecosystem">${icon} ${eco}</div>
            <h2 class="nature-detail-name">${name}</h2>
            <p class="nature-detail-country">${site.country}</p>
        </div>
        ${site.image ? `
            <div class="nature-detail-image-wrapper">
                <img src="${site.image}" alt="${name}" class="nature-detail-image">
            </div>
        ` : ''}
        <div class="nature-detail-body">
            ${shortDesc ? `<p class="nature-detail-short-desc">${shortDesc}</p>` : ''}
            ${description ? `
                <div class="nature-detail-desc-section">
                    <p class="nature-detail-desc-label">${label('description')}</p>
                    <p class="nature-detail-desc-text">${description}</p>
                </div>
            ` : ''}

            <div class="nature-travel-info">
                <div class="travel-info-item">
                    <span class="info-label">${label('bestTimeToVisit')}</span>
                    <span class="info-value">${site.bestTimeToVisit || '-'}</span>
                </div>
                ${site.officialWebsite ? `
                <div class="travel-info-item">
                    <span class="info-label">${label('officialWebsite')}</span>
                    <span class="info-value">
                        <a href="${site.officialWebsite}" target="_blank" class="nature-website-link">
                            ${site.officialWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} ↗
                        </a>
                    </span>
                </div>
                ` : ''}
            </div>

            <div class="nature-detail-meta">
                <span class="nature-meta-chip">${icon} ${eco}</span>
                <span class="nature-meta-chip">📍 ${site.country}</span>
                ${site.tags && site.tags.some(t => t.startsWith('unesco:')) ? `<span class="nature-meta-chip">🏛️ UNESCO ${site.tags.find(t => t.startsWith('unesco:')).split(':')[1].replace('-', ' ')}</span>` : ''}
            </div>
        </div>
    `;

    detailController = createDetailOverlay({
        renderContent,
        onClose: () => { detailController = null; },
        overlayClass: 'nature-detail-overlay',
        cardClass: 'nature-detail-card'
    });
    detailController.show();
}

function closeNatureDetail() {
    detailController?.close();
}

// ==================== Map Sync ====================

function syncMapWithNature() {
    const locale = state.get('locale');
    const points = allSites.map(s => {
        const feat = getFeature(s);
        return {
            name: getLoc(s, 'name', locale),
            value: s.coordinates,
            symbolSize: 10,
            itemStyle: {
                color: ECOSYSTEM_COLORS[feat] || '#E8CA88',
                shadowColor: ECOSYSTEM_COLORS[feat] || '#E8CA88',
                shadowBlur: 10
            },
            rawData: s
        };
    });

    showAllPoints(points);
}

// ==================== Event Listeners ====================

export function onMapNatureClick(p) {
    if (!isActive) return;
    const index = allSites.findIndex(s => s.id === p.id);
    if (index !== -1) {
        navigateTo(index);
    }
}
