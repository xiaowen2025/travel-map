import { state } from './state.js';
import { t, loc } from './i18n.js';
import { flyTo, showCityPoints } from './mapEngine.js';
import { getCountryByFullName, getCountryCode } from './countries.js';

// ==================== Country Flags ====================
// Flag emojis must be manually assigned (no standard JSON source)
const COUNTRY_FLAGS = {
    'Italy': '🇮🇹', 'Spain': '🇪🇸', 'France': '🇫🇷', 'Austria': '🇦🇹',
    'Belgium': '🇧🇪', 'Denmark': '🇩🇰', 'Germany': '🇩🇪', 'Monaco': '🇲🇨',
    'Russia': '🇷🇺', 'Greece': '🇬🇷', 'Portugal': '🇵🇹', 'Norway': '🇳🇴',
    'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Turkey': '🇹🇷', 'Ukraine': '🇺🇦',
    'United Kingdom': '🇬🇧', 'Luxembourg': '🇱🇺', 'Malta': '🇲🇹',
    'Iceland': '🇮🇸', 'Serbia': '🇷🇸'
};

// ==================== Helpers ====================

/**
 * Get city type as a string
 */
function getCityType(dest) {
    const t = dest.type;
    if (!t) return '';
    if (typeof t === 'object') return t.en || '';
    return t || '';
}

/**
 * Check if destination is a city type
 */
function isCity(dest) {
    return getCityType(dest) === 'City';
}

// ==================== State ====================
let allCities = [];
let groupedCities = {};
let activeCardId = null;
let detailController = null;
let panelEl = null;
let searchInput = null;
let collapsedGroups = new Set();

// ==================== i18n labels ====================
const labels = {
    zh: {
        panelTitle: '城市探索',
        panelSubtitle: '探索欧洲各国城市',
        searchPlaceholder: '搜索城市...',
        tourists: '年游客',
        costOfLiving: '生活成本',
        safety: '安全',
        language: '语言',
        religion: '宗教',
        currency: '货币',
        history: '历史',
        description: '简介',
        culturalSignificance: '文化意义',
        famousFoods: '特色美食',
        bestTimeToVisit: '最佳旅行时间',
        noResults: '未找到匹配的城市',
        cities: '座城市'
    },
    en: {
        panelTitle: 'City Explorer',
        panelSubtitle: 'Discover cities across Europe',
        searchPlaceholder: 'Search cities...',
        tourists: 'tourists/yr',
        costOfLiving: 'Cost of Living',
        safety: 'Safety',
        language: 'Language',
        religion: 'Religion',
        currency: 'Currency',
        history: 'History',
        description: 'Description',
        culturalSignificance: 'Cultural Significance',
        famousFoods: 'Famous Foods',
        bestTimeToVisit: 'Best Time to Visit',
        noResults: 'No cities found',
        cities: 'cities'
    }
};

function label(key) {
    const locale = state.get('locale');
    return labels[locale]?.[key] || labels.en[key] || key;
}

function countryName(country) {
    const locale = state.get('locale');
    if (locale === 'zh') return getCountryByFullName(country, 'zh');
    return country;
}

// ==================== Init ====================

export function initCityExplorer(destinations) {
    panelEl = document.getElementById('cityExplorer');
    allCities = destinations.filter(isCity);
    groupCities();
}

function groupCities() {
    groupedCities = {};
    allCities.forEach(city => {
        const country = city.Country || 'Other';
        if (!groupedCities[country]) groupedCities[country] = [];
        groupedCities[country].push(city);
    });
}

// ==================== Show / Hide ====================

export function showCityPanel() {
    if (!panelEl) return;
    renderPanel();
    panelEl.classList.add('visible');
    syncMapWithCities();
}

export function hideCityPanel() {
    if (!panelEl) return;
    panelEl.classList.remove('visible');
    closeCityDetail();
}

// ==================== Render Panel ====================

function renderPanel() {
    const locale = state.get('locale');

    panelEl.innerHTML = `
        <div class="city-panel-header">
            <h2 class="city-panel-title">${label('panelTitle')}</h2>
            <p class="city-panel-subtitle">${allCities.length} ${label('cities')} · ${Object.keys(groupedCities).length} countries</p>
            <div class="city-search-wrapper">
                <span class="city-search-icon">🔍</span>
                <input type="text" class="city-search" id="citySearchInput"
                       placeholder="${label('searchPlaceholder')}" autocomplete="off">
            </div>
        </div>
        <div id="cityListContainer"></div>
        <div class="city-panel-footer"></div>
    `;

    searchInput = panelEl.querySelector('#citySearchInput');
    searchInput.addEventListener('input', onSearch);

    renderCityList();
}

function renderCityList(filter = '') {
    const container = panelEl.querySelector('#cityListContainer');
    if (!container) return;

    const locale = state.get('locale');
    const filterLower = filter.toLowerCase();

    // Sort countries alphabetically
    const sortedCountries = Object.keys(groupedCities).sort((a, b) => {
        const nameA = countryName(a);
        const nameB = countryName(b);
        return nameA.localeCompare(nameB);
    });

    let html = '';
    let hasAny = false;
    let cardIndex = 0;

    for (const country of sortedCountries) {
        const cities = groupedCities[country];
        const flag = COUNTRY_FLAGS[country] || '🏳️';

        // Filter cities
        const countryZh = getCountryByFullName(country, 'zh').toLowerCase();
        const filtered = filter
            ? cities.filter(c => {
                const name = (c.name || c.Destination || '').toLowerCase();
                const region = (c.Region || '').toLowerCase();
                const countryLower = country.toLowerCase();
                return name.includes(filterLower) ||
                       region.includes(filterLower) ||
                       countryLower.includes(filterLower) ||
                       countryZh.includes(filterLower);
            })
            : cities;

        if (filtered.length === 0) continue;
        hasAny = true;

        const isCollapsed = collapsedGroups.has(country);

        html += `<div class="city-country-group" data-country="${country}">`;
        html += `<div class="city-country-header ${isCollapsed ? 'collapsed' : ''}" data-country="${country}">
                    <span class="city-country-flag">${flag}</span>
                    <span class="city-country-name">${countryName(country)}</span>
                    <span class="city-country-count">${filtered.length}</span>
                    <span class="city-country-chevron">▼</span>
                 </div>`;

        html += `<div class="city-country-list ${isCollapsed ? 'collapsed' : ''}" data-country="${country}" style="max-height: ${isCollapsed ? 0 : filtered.length * 100}px;">`;

        for (const city of filtered) {
            const name = city.name || city.Destination;
            const region = city.Region || '';
            const tourists = city['Approximate Annual Tourists'] || '';
            const foods = city['Famous Foods'] || '';
            const costValue = loc(city['Cost of Living'], locale);
            const id = `${country}-${name}`.replace(/\s/g, '_');
            const delay = Math.min(cardIndex * 40, 600);

            html += `<div class="city-card ${activeCardId === id ? 'active' : ''}"
                          data-city-id="${id}"
                          data-country="${country}"
                          data-name="${name}"
                          data-lat="${city.Latitude}"
                          data-lng="${city.Longitude}"
                          style="animation-delay: ${delay}ms">
                        <div class="city-card-top">
                            <div>
                                <h4 class="city-card-name">${name}</h4>
                                <p class="city-card-region">${region}</p>
                            </div>
                            ${tourists ? `<span class="city-card-tourists">👥 ${tourists}</span>` : ''}
                        </div>
                        <div class="city-card-meta-row">
                            ${foods ? `<span class="city-card-chip"><span class="city-card-chip-icon">🍽️</span>${foods.split(',').slice(0, 2).join(', ')}</span>` : ''}
                            ${costValue ? `<span class="city-card-chip"><span class="city-card-chip-icon">💰</span>${costValue}</span>` : ''}
                        </div>
                     </div>`;
            cardIndex++;
        }

        html += `</div>`; // city-country-list
        html += `<div class="city-country-divider"></div>`;
        html += `</div>`; // city-country-group
    }

    if (!hasAny) {
        html = `<div class="city-no-results">
                    <span class="city-no-results-icon">🏙️</span>
                    ${label('noResults')}
                </div>`;
    }

    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll('.city-card').forEach(card => {
        card.addEventListener('click', () => {
            const name = card.dataset.name;
            const country = card.dataset.country;
            const lat = parseFloat(card.dataset.lat);
            const lng = parseFloat(card.dataset.lng);
            const id = card.dataset.cityId;

            // Highlight active card
            setActiveCard(id);

            // Fly map to city
            flyTo([lng, lat], 5, true);

            // Show detail
            const city = allCities.find(c =>
                (c.name === name || c.Destination === name) && c.Country === country
            );
            if (city) showCityDetail(city);
        });
    });

    // Attach collapse/expand events on country headers
    container.querySelectorAll('.city-country-header').forEach(header => {
        header.addEventListener('click', () => {
            const country = header.dataset.country;
            const list = container.querySelector(`.city-country-list[data-country="${country}"]`);
            if (!list) return;

            if (collapsedGroups.has(country)) {
                collapsedGroups.delete(country);
                header.classList.remove('collapsed');
                list.classList.remove('collapsed');
                list.style.maxHeight = list.scrollHeight + 'px';
            } else {
                collapsedGroups.add(country);
                header.classList.add('collapsed');
                list.classList.add('collapsed');
            }
        });
    });
}

function setActiveCard(id) {
    activeCardId = id;
    if (!panelEl) return;
    panelEl.querySelectorAll('.city-card').forEach(card => {
        card.classList.toggle('active', card.dataset.cityId === id);
    });
}

// ==================== Search ====================

function onSearch(e) {
    const query = e.target.value.trim();
    // Expand all groups during search
    if (query) {
        collapsedGroups.clear();
    }
    renderCityList(query);
}

// ==================== Detail Modal ====================

function showCityDetail(city) {
    if (detailController) {
        detailController.close();
    }

    const locale = state.get('locale');
    const name = city.name || city.Destination;
    const region = city.Region || '';
    const country = city.Country || '';
    const flag = COUNTRY_FLAGS[country] || '🏳️';
    const tourists = city['Approximate Annual Tourists'] || '';
    const description = loc(city.Description, locale);
    const cultural = loc(city['Cultural Significance'], locale);
    const history = loc(city.history, locale);
    const costOfLiving = loc(city['Cost of Living'], locale);
    const safety = loc(city.Safety, locale);
    const language = city.Language || '';
    const religion = loc(city['Majority Religion'], locale);
    const currency = city.Currency || '';
    const foods = city['Famous Foods'] || '';
    const bestTime = loc(city['Best Time to Visit'], locale);

    const renderContent = () => `
        <button class="detail-close city-detail-close">✕</button>
        <div class="city-detail-header">
            <div class="city-detail-country">${flag} ${countryName(country)}</div>
            <h2 class="city-detail-name">${name}</h2>
            <p class="city-detail-region">${tourists ? `${region} · ${tourists} ${label('tourists')}` : region}</p>
        </div>
        <div class="city-detail-body">
            ${description ? `<p class="city-detail-description">${description}</p>` : ''}
            ${cultural ? `<p class="city-detail-cultural">${cultural}</p>` : ''}
            ${history ? `
                <div class="city-detail-history-section">
                    <p class="city-detail-history-label">📖 ${label('history')}</p>
                    <p class="city-detail-history-text">${history}</p>
                </div>
            ` : ''}
            <div class="city-detail-meta-grid">
                ${costOfLiving ? `
                    <div class="city-meta-tile">
                        <span class="city-meta-tile-icon">💰</span>
                        <div class="city-meta-tile-label">${label('costOfLiving')}</div>
                        <div class="city-meta-tile-value">${costOfLiving}</div>
                    </div>
                ` : ''}
                ${safety ? `
                    <div class="city-meta-tile">
                        <span class="city-meta-tile-icon">🛡️</span>
                        <div class="city-meta-tile-label">${label('safety')}</div>
                        <div class="city-meta-tile-value">${safety}</div>
                    </div>
                ` : ''}
                ${language ? `
                    <div class="city-meta-tile">
                        <span class="city-meta-tile-icon">🗣️</span>
                        <div class="city-meta-tile-label">${label('language')}</div>
                        <div class="city-meta-tile-value">${language}</div>
                    </div>
                ` : ''}
                ${religion ? `
                    <div class="city-meta-tile">
                        <span class="city-meta-tile-icon">⛪</span>
                        <div class="city-meta-tile-label">${label('religion')}</div>
                        <div class="city-meta-tile-value">${religion}</div>
                    </div>
                ` : ''}
                ${currency ? `
                    <div class="city-meta-tile">
                        <span class="city-meta-tile-icon">💱</span>
                        <div class="city-meta-tile-label">${label('currency')}</div>
                        <div class="city-meta-tile-value">${currency}</div>
                    </div>
                ` : ''}
            </div>
            ${foods ? `
                <div class="city-detail-food-section">
                    <p class="city-detail-food-label">🍽️ ${label('famousFoods')}</p>
                    <div class="city-detail-food-tags">
                        ${foods.split(',').map(f => `<span class="city-food-tag">${f.trim()}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            ${bestTime ? `
                <div class="city-detail-best-time">
                    <span class="city-detail-best-time-icon">📅</span>
                    <span class="city-detail-best-time-text">${label('bestTimeToVisit')}: ${bestTime}</span>
                </div>
            ` : ''}
        </div>
    `;

    detailController = createDetailOverlay({
        renderContent,
        onClose: () => { detailController = null; },
        overlayClass: 'city-detail-overlay',
        cardClass: 'city-detail-card'
    });
    detailController.show();
}

function closeCityDetail() {
    detailController?.close();
}

// ==================== Map Sync ====================

// Helper to parse tourist numbers like "14 million", "800,000", "2.5 million"
function parseTourists(str) {
    if (!str) return 0;
    const s = str.toLowerCase().replace(/,/g, '');
    let num = parseFloat(s);
    if (isNaN(num)) return 0;
    if (s.includes('million')) num *= 1000000;
    return num;
}

// Sub-region color palette
const REGION_COLORS = {
    'Southern Europe': '#ff9b71', // Italy, Spain, Greece, Portugal, Malta
    'Western Europe': '#88d49e',  // France, Belgium, Germany, Austria, Switzerland, Monaco, Luxembourg
    'Northern Europe': '#7bd5f5', // Denmark, Norway, Sweden, Iceland
    'Eastern Europe': '#d998f5',  // Russia, Ukraine, Serbia, Turkey
    'UK & Ireland': '#f5ad98'     // UK
};

function getRegionColor(country) {
    if (['Italy', 'Spain', 'Greece', 'Portugal', 'Malta'].includes(country)) return REGION_COLORS['Southern Europe'];
    if (['France', 'Belgium', 'Germany', 'Austria', 'Switzerland', 'Monaco', 'Luxembourg'].includes(country)) return REGION_COLORS['Western Europe'];
    if (['Denmark', 'Norway', 'Sweden', 'Iceland'].includes(country)) return REGION_COLORS['Northern Europe'];
    if (['Russia', 'Ukraine', 'Serbia', 'Turkey'].includes(country)) return REGION_COLORS['Eastern Europe'];
    if (['United Kingdom'].includes(country)) return REGION_COLORS['UK & Ireland'];
    return '#E8CA88'; // Default gold
}

function syncMapWithCities() {
    const locale = state.get('locale');
    const points = allCities.map(c => {
        const touristsStr = c['Approximate Annual Tourists'];
        const tourists = parseTourists(touristsStr);
        
        // Calculate size based on tourist volume
        let size = 6;
        if (tourists > 10000000) size = 18;       // > 10M (e.g. Paris, Rome, Barcelona)
        else if (tourists > 5000000) size = 14;   // > 5M
        else if (tourists > 2000000) size = 10;   // > 2M
        else if (tourists > 500000) size = 8;     // > 500k
        
        // Only show labels for major cities to prevent overlap
        const showLabel = tourists >= 3000000 || c.Country === 'Iceland' || c.Country === 'Norway'; // Show smaller ones in sparse areas

        return {
            name: c.name || c.Destination,
            value: [c.Longitude, c.Latitude],
            symbolSize: size,
            color: getRegionColor(c.Country),
            showLabel: showLabel,
            rawData: {
                id: `${c.Country}-${c.name}`,
                name: c.name || c.Destination,
                coordinates: [c.Longitude, c.Latitude],
                country: c.Country
            }
        };
    });
    
    // Sort so smaller dots are rendered on top of larger ones (z-index)
    points.sort((a, b) => b.symbolSize - a.symbolSize);
    
    showCityPoints(points);
}

// ==================== Re-render on locale change ====================

export function refreshCityPanel() {
    if (!panelEl || !panelEl.classList.contains('visible')) return;
    renderPanel();
    syncMapWithCities();
}

// ==================== Map click → panel highlight ====================

export function onMapCityClick(cityName, country) {
    const id = `${country}-${cityName}`.replace(/\s/g, '_');
    setActiveCard(id);

    // Scroll card into view
    const card = panelEl?.querySelector(`.city-card[data-city-id="${id}"]`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Show detail
    const city = allCities.find(c =>
        (c.name === cityName || c.Destination === cityName) && c.Country === country
    );
    if (city) showCityDetail(city);
}
