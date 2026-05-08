import { state } from './state.js';
import { t, loc } from './i18n.js';
import { flyTo, showCityPoints } from './mapEngine.js';
import { createDetailOverlay, closeActiveOverlay } from './detailOverlay.js';
import { createKeyboardNavigation } from './keyboardNavigation.js';

// ==================== Ecosystem Icons ====================
const ECOSYSTEM_ICONS = {
    'Forest': '🌲',
    'Mountain': '⛰️',
    'Coastal': '🌊',
    'Volcanic': '🌋',
    'Cave': '🦇',
    'Glacial': '🏔️',
    'Wetland': '🦆',
    'Lakes': '💧',
    'Geological': '💎',
    'Fossil': '🦴'
};

const ECOSYSTEM_COLORS = {
    'Forest': '#4CAF50',
    'Mountain': '#8D6E63',
    'Coastal': '#29B6F6',
    'Volcanic': '#FF7043',
    'Cave': '#7E57C2',
    'Glacial': '#80DEEA',
    'Wetland': '#66BB6A',
    'Lakes': '#42A5F5',
    'Geological': '#FFB74D',
    'Fossil': '#A1887F'
};

// ==================== State ====================
let allSites = [];
let groupedSites = {};
let activeCardId = null;
let activeFilter = null;
let detailController = null;
let panelEl = null;
let searchInput = null;

// ==================== i18n labels ====================
const labels = {
    zh: {
        panelTitle: '自然探索',
        panelSubtitle: '探索欧洲自然遗产',
        searchPlaceholder: '搜索自然遗产...',
        description: '简介',
        country: '国家',
        category: '类别',
        ecosystem: '生态类型',
        noResults: '未找到匹配的遗产地',
        sites: '处遗产',
        allTypes: '全部',
        natural: '自然遗产',
        mixed: '混合遗产',
        ecosystemTypes: {
            'Forest': '森林', 'Mountain': '山脉', 'Coastal': '海岸',
            'Volcanic': '火山', 'Cave': '洞穴', 'Glacial': '冰川',
            'Wetland': '湿地', 'Lakes': '湖泊', 'Geological': '地质',
            'Fossil': '化石'
        }
    },
    en: {
        panelTitle: 'Nature',
        panelSubtitle: 'Explore European Natural Heritage',
        searchPlaceholder: 'Search heritage sites...',
        description: 'Description',
        country: 'Country',
        category: 'Category',
        ecosystem: 'Ecosystem',
        noResults: 'No heritage sites found',
        sites: 'sites',
        allTypes: 'All',
        natural: 'Natural',
        mixed: 'Mixed',
        ecosystemTypes: {
            'Forest': 'Forest', 'Mountain': 'Mountain', 'Coastal': 'Coastal',
            'Volcanic': 'Volcanic', 'Cave': 'Cave', 'Glacial': 'Glacial',
            'Wetland': 'Wetland', 'Lakes': 'Lakes', 'Geological': 'Geological',
            'Fossil': 'Fossil'
        }
    }
};

function label(key) {
    const locale = state.get('locale');
    return labels[locale]?.[key] || labels.en[key] || key;
}

function ecosystemLabel(type) {
    const locale = state.get('locale');
    return labels[locale]?.ecosystemTypes?.[type] || type;
}

// ==================== Init ====================

export function initNatureExplorer(natureData) {
    panelEl = document.getElementById('natureExplorer');
    allSites = natureData.sites || [];
    groupSites();
}

function groupSites() {
    groupedSites = {};
    const filtered = activeFilter
        ? allSites.filter(s => s.ecosystemType === activeFilter)
        : allSites;
    filtered.forEach(site => {
        const type = site.ecosystemType || 'Other';
        if (!groupedSites[type]) groupedSites[type] = [];
        groupedSites[type].push(site);
    });
}

// ==================== Show / Hide ====================

export function showNaturePanel() {
    if (!panelEl) return;
    renderPanel();
    panelEl.classList.add('visible');
    syncMapWithSites();
}

export function hideNaturePanel() {
    if (!panelEl) return;
    panelEl.classList.remove('visible');
    closeNatureDetail();
}

// ==================== Render Panel ====================

function renderPanel() {
    const locale = state.get('locale');

    // Count ecosystem types
    const typeCounts = {};
    allSites.forEach(s => {
        const type = s.ecosystemType || 'Other';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    panelEl.innerHTML = `
        <div class="nature-panel-header">
            <h2 class="nature-panel-title">${label('panelTitle')}</h2>
            <p class="nature-panel-subtitle">${allSites.length} ${label('sites')} · UNESCO World Heritage</p>
            <div class="nature-search-wrapper">
                <span class="nature-search-icon">🔍</span>
                <input type="text" class="nature-search" id="natureSearchInput"
                       placeholder="${label('searchPlaceholder')}" autocomplete="off">
            </div>
            <div class="nature-filter-row" id="natureFilterRow">
                <button class="nature-filter-chip ${!activeFilter ? 'active' : ''}" data-filter="">
                    ${label('allTypes')} <span class="nature-filter-count">${allSites.length}</span>
                </button>
                ${Object.entries(typeCounts).sort((a,b) => b[1]-a[1]).map(([type, count]) => `
                    <button class="nature-filter-chip ${activeFilter === type ? 'active' : ''}" data-filter="${type}">
                        ${ECOSYSTEM_ICONS[type] || '🌍'} ${ecosystemLabel(type)}
                        <span class="nature-filter-count">${count}</span>
                    </button>
                `).join('')}
            </div>
        </div>
        <div id="natureListContainer"></div>
        <div class="nature-panel-footer"></div>
    `;

    searchInput = panelEl.querySelector('#natureSearchInput');
    searchInput.addEventListener('input', onSearch);

    // Filter chip clicks
    panelEl.querySelectorAll('.nature-filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const filter = chip.dataset.filter || null;
            activeFilter = filter;
            groupSites();
            renderPanel();
            syncMapWithSites();
        });
    });

    renderSiteList();
}

function renderSiteList(filter = '') {
    const container = panelEl.querySelector('#natureListContainer');
    if (!container) return;

    const locale = state.get('locale');
    const filterLower = filter.toLowerCase();

    // Sort ecosystem types
    const sortedTypes = Object.keys(groupedSites).sort();

    let html = '';
    let hasAny = false;
    let cardIndex = 0;

    for (const type of sortedTypes) {
        const sites = groupedSites[type];
        const icon = ECOSYSTEM_ICONS[type] || '🌍';
        const color = ECOSYSTEM_COLORS[type] || '#4CAF50';

        // Filter sites
        const filtered = filter
            ? sites.filter(s => {
                const name = loc(s.name, locale).toLowerCase();
                const country = (s.country || '').toLowerCase();
                const shortDesc = loc(s.shortDesc, locale).toLowerCase();
                return name.includes(filterLower) ||
                       country.includes(filterLower) ||
                       shortDesc.includes(filterLower);
            })
            : sites;

        if (filtered.length === 0) continue;
        hasAny = true;

        html += `<div class="nature-type-group">`;
        html += `<div class="nature-type-header">
                    <span class="nature-type-icon">${icon}</span>
                    <span class="nature-type-name" style="color: ${color}">${ecosystemLabel(type)}</span>
                    <span class="nature-type-count">${filtered.length}</span>
                 </div>`;

        for (const site of filtered) {
            const name = loc(site.name, locale);
            const shortDesc = loc(site.shortDesc, locale);
            const country = site.country || '';
            const id = site.id;
            const delay = Math.min(cardIndex * 35, 500);
            const categoryBadge = site.category === 'Mixed' ? '🔷' : '🟢';

            html += `<div class="attraction-card ${activeCardId === id ? 'active' : ''}"
                          data-site-id="${id}"
                          data-lng="${site.coordinates[0]}"
                          data-lat="${site.coordinates[1]}"
                          style="animation-delay: ${delay}ms">
                        ${site.image ? `<div class="card-image-wrapper"><img class="card-image" src="${site.image}" alt="${name}" loading="lazy"></div>` : ''}
                        <div class="card-header">
                            <div>
                                <h4 class="card-title">${name}</h4>
                                <p class="card-meta">${categoryBadge} ${country}</p>
                            </div>
                        </div>
                        ${shortDesc ? `<p class="card-short-desc">${shortDesc.substring(0, 100)}${shortDesc.length > 100 ? '...' : ''}</p>` : ''}
                     </div>`;
            cardIndex++;
        }

        html += `</div>`;
    }

    if (!hasAny) {
        html = `<div class="nature-no-results">
                    <span class="nature-no-results-icon">🌍</span>
                    ${label('noResults')}
                </div>`;
    }

    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll('.attraction-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.siteId;
            const lng = parseFloat(card.dataset.lng);
            const lat = parseFloat(card.dataset.lat);

            setActiveCard(id);
            flyTo([lng, lat], 5, true);

            const site = allSites.find(s => s.id === id);
            if (site) showNatureDetail(site);
        });
    });
}

function setActiveCard(id) {
    activeCardId = id;
    if (!panelEl) return;
    panelEl.querySelectorAll('.attraction-card').forEach(card => {
        card.classList.toggle('active', card.dataset.siteId === id);
    });
}

// ==================== Search ====================

function onSearch(e) {
    const query = e.target.value.trim();
    if (query) {
        activeFilter = null;
        groupSites();
    }
    renderSiteList(query);
}

// ==================== Detail Modal ====================

function showNatureDetail(site) {
    if (detailController) {
        detailController.close();
    }

    const locale = state.get('locale');
    const name = loc(site.name, locale);
    const shortDesc = loc(site.shortDesc, locale);
    const description = loc(site.description, locale);
    const country = site.country || '';
    const category = site.category || 'Natural';
    const ecosystem = site.ecosystemType || '';
    const icon = ECOSYSTEM_ICONS[ecosystem] || '🌍';
    const color = ECOSYSTEM_COLORS[ecosystem] || '#4CAF50';

    const renderContent = () => `
        <button class="detail-close nature-detail-close">✕</button>
        <div class="nature-detail-header">
            <div class="nature-detail-ecosystem" style="color: ${color}">
                ${icon} ${ecosystemLabel(ecosystem)} · ${category}
            </div>
            <h2 class="nature-detail-name">${name}</h2>
            <p class="nature-detail-country">📍 ${country}</p>
        </div>
        ${site.image ? `
            <div class="nature-detail-image-wrapper">
                <img class="nature-detail-image" src="${site.image}" alt="${name}" loading="lazy">
            </div>
        ` : ''}
        <div class="nature-detail-body">
            ${shortDesc ? `<p class="nature-detail-short-desc">${shortDesc}</p>` : ''}
            ${description ? `
                <div class="nature-detail-desc-section">
                    <p class="nature-detail-desc-label">📖 ${label('description')}</p>
                    <p class="nature-detail-desc-text">${description}</p>
                </div>
            ` : ''}
            <div class="nature-detail-meta">
                <div class="nature-meta-chip" style="border-color: ${color}30; color: ${color}">
                    ${icon} ${ecosystemLabel(ecosystem)}
                </div>
                <div class="nature-meta-chip">
                    ${category === 'Mixed' ? '🔷' : '🟢'} ${category}
                </div>
            </div>
        </div>
    `;

    detailController = createDetailOverlay({
        renderContent,
        onClose: () => { detailController = null; }
    });
    detailController.show();
}

function closeNatureDetail() {
    detailController?.close();
}

// ==================== Map Sync ====================

function syncMapWithSites() {
    const locale = state.get('locale');
    const sitesToShow = activeFilter
        ? allSites.filter(s => s.ecosystemType === activeFilter)
        : allSites;

    const points = sitesToShow.map(s => {
        const color = ECOSYSTEM_COLORS[s.ecosystemType] || '#4CAF50';
        return {
            name: loc(s.name, locale),
            value: s.coordinates,
            symbolSize: 10,
            color: color,
            showLabel: true,
            rawData: {
                id: s.id,
                name: s.name,
                coordinates: s.coordinates,
                country: s.country
            }
        };
    });

    showCityPoints(points);
}

// ==================== Re-render on locale change ====================

export function refreshNaturePanel() {
    if (!panelEl || !panelEl.classList.contains('visible')) return;
    renderPanel();
    syncMapWithSites();
}

// ==================== Map click → panel highlight ====================

export function onMapNatureClick(siteName) {
    const site = allSites.find(s =>
        s.name?.en === siteName || s.name?.zh === siteName || s.id === siteName
    );
    if (!site) return;

    setActiveCard(site.id);

    const card = panelEl?.querySelector(`.attraction-card[data-site-id="${site.id}"]`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    showNatureDetail(site);
}

// ==================== Keyboard Navigation ====================

export function handleKeydown(e) {
    if (!panelEl || !panelEl.classList.contains('visible')) return;

    const getCards = () => panelEl.querySelectorAll('.attraction-card');
    const getGroups = () => panelEl.querySelectorAll('.nature-type-group');

    const onSelect = (card) => {
        const site = allSites.find(s => s.id === card.dataset.siteId);
        if (site) {
            setActiveCard(site.id);
            flyTo(site.coordinates, 5, true);
            showNatureDetail(site);
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const onGroupSelect = (group) => {
        const firstCard = group.querySelector('.attraction-card');
        if (firstCard) {
            onSelect(firstCard);
        }
    };

    const { handleKeydown: navHandler } = createKeyboardNavigation({
        getCards,
        getGroups,
        onSelect,
        onGroupSelect,
        onEscape: closeNatureDetail
    });

    navHandler(e);
}
