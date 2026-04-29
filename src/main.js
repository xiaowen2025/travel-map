import * as echarts from 'echarts';
import './style.css';
import { state } from './state.js';
import { t, getLoc, locales } from './i18n.js';
import { initMap, hideLoading, registerMap, setupBaseOption, flyTo, updateMarkers, highlightRelated, showAllPoints, resizeChart, getChart } from './mapEngine.js';
import { ScrollManager } from './scrollManager.js';
import { updateEraPanel, showEraToast, showDetailPanel, closeDetailPanel, setViewMode, updateLangToggle, updateStaticLabels, updateModeButtons, setupEventListeners } from './ui.js';

// ==================== Initialize ====================
const chartDom = document.getElementById('map-container');
const myChart = initMap(chartDom);

// ==================== Scroll Manager ====================
const scrollManager = new ScrollManager({ scrollThreshold: 400 });

// ==================== Data Loading ====================
async function loadData(locale) {
    const localeFile = locale === 'en' ? 'data/attractions.en.json' : 'data/attractions.json';
    const [geoJson, attractionsData] = await Promise.all([
        fetch('data/europe.geo.json').then(r => r.json()),
        fetch(localeFile).then(r => r.json())
    ]);
    return { geoJson, attractionsData };
}

// ==================== State Subscriptions ====================

// currentPointIndex change → update map markers + camera + UI
state.addEventListener('change:currentPointIndex', (e) => {
    const { value, oldValue } = e.detail;
    const data = state.get('data');
    if (!data) return;

    const isScroll = e.detail._meta?.isScroll ?? false;

    // Update markers
    updateMarkers(value, data);

    // Camera fly-to
    const currentPoint = data[value];
    if (currentPoint?.coordinates[0] !== 0) {
        flyTo(currentPoint.coordinates, 3.5, isScroll);
    }

    // Update era panel
    updateEraPanel(currentPoint);

    // Show era toast on transition
    const currentEraCat = getLoc(currentPoint, 'eraCategory');
    const oldEraCat = oldValue !== undefined ? getLoc(data[oldValue], 'eraCategory') : null;
    if (isScroll && currentEraCat !== state.get('currentEraCategory')) {
        state.set('currentEraCategory', currentEraCat);
        showEraToast(currentEraCat);
    } else if (!isScroll) {
        state.set('currentEraCategory', currentEraCat);
    }

    // Auto-open detail panel on scroll
    if (isScroll) {
        showDetailPanel(currentPoint);
    }
});

// viewMode change → update UI visibility + map display
state.addEventListener('change:viewMode', (e) => {
    const { value } = e.detail;
    const data = state.get('data');
    setViewMode(value);

    if (value === 'history') {
        updateMarkers(state.get('currentPointIndex'), data);
    } else {
        const filtered = data.filter(p => {
            if (value === 'city') return p.category === 'city';
            if (value === 'nature') return p.category === 'natural';
            return false;
        }).map(p => ({
            name: getLoc(p, 'name'),
            value: p.coordinates,
            rawData: p
        }));
        showAllPoints(filtered);
    }
});

// activePointId change → highlight related points or reset
state.addEventListener('change:activePointId', (e) => {
    const { value } = e.detail;
    if (value === null) {
        updateMarkers(state.get('currentPointIndex'), state.get('data'));
    }
});

// ==================== Handlers ====================

function handleNext() {
    const data = state.get('data');
    if (!data) return;
    if (state.get('currentPointIndex') < data.length - 1) {
        state.set('currentPointIndex', state.get('currentPointIndex') + 1, { _meta: { isScroll: true } });
    }
}

function handlePrev() {
    const data = state.get('data');
    if (!data) return;
    if (state.get('currentPointIndex') > 0) {
        state.set('currentPointIndex', state.get('currentPointIndex') - 1, { _meta: { isScroll: true } });
    }
}

function handleCloseDetail() {
    closeDetailPanel();
    updateMarkers(state.get('currentPointIndex'), state.get('data'));
}

function handleModeChange(mode) {
    state.set('viewMode', mode);
}

async function handleLangToggle() {
    const newLocale = state.get('locale') === 'zh' ? 'en' : 'zh';
    state.set('locale', newLocale);

    updateLangToggle(newLocale);
    updateStaticLabels(newLocale);
    updateModeButtons(newLocale);

    // Reload data
    const { attractionsData } = await loadData(newLocale);
    state.set('data', attractionsData.timelinePoints);
    state.set('currentPointIndex', 0);
    state.set('currentEraCategory', '');

    const chart = getChart();
    chart?.showLoading({
        text: t('loadingText', newLocale),
        color: '#E8CA88',
        textColor: '#fff',
        maskColor: 'rgba(15, 16, 20, 0.8)'
    });

    // Re-init map with new data
    setTimeout(() => {
        chart?.hideLoading();
        updateMarkers(0, attractionsData.timelinePoints);
    }, 100);
}

function handleKeydown(e) {
    const data = state.get('data');
    if (!data || data.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const currentEra = data[state.get('currentPointIndex')].eraCategory;
        for (let i = state.get('currentPointIndex') + 1; i < data.length; i++) {
            if (data[i].eraCategory !== currentEra) {
                state.set('currentPointIndex', i, { _meta: { isScroll: true } });
                break;
            }
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentEra = data[state.get('currentPointIndex')].eraCategory;
        let eraStart = state.get('currentPointIndex');
        while (eraStart > 0 && data[eraStart - 1].eraCategory === currentEra) {
            eraStart--;
        }
        if (eraStart > 0) {
            const prevEra = data[eraStart - 1].eraCategory;
            let prevStart = eraStart - 1;
            while (prevStart > 0 && data[prevStart - 1].eraCategory === prevEra) {
                prevStart--;
            }
            state.set('currentPointIndex', prevStart, { _meta: { isScroll: true } });
        }
    } else if (e.key === 'Escape') {
        handleCloseDetail();
    }
}

function handleMapClick(params) {
    if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
        const p = params.data.rawData;
        if (!p) return;
        showDetailPanel(p);
        highlightRelated(p, state.get('data'));
    }
}

function handleMapDataAndInit(geoJson, attractionsData) {
    hideLoading();
    registerMap(geoJson);
    setupBaseOption();

    state.set('data', attractionsData.timelinePoints);

    // Enable scroll manager for history mode
    if (state.get('viewMode') === 'history') {
        scrollManager.enable();
    }

    // Initial render
    updateMarkers(0, attractionsData.timelinePoints);

    // Map click event
    myChart.on('click', handleMapClick);

    // Resize handler
    window.addEventListener('resize', resizeChart);
}

// ==================== Boot ====================
loadData(state.get('locale')).then(({ geoJson, attractionsData }) => {
    handleMapDataAndInit(geoJson, attractionsData);

    // Setup UI event listeners
    setupEventListeners({
        onCloseDetail: handleCloseDetail,
        onModeChange: handleModeChange,
        onLangToggle: handleLangToggle,
        onKeydown: handleKeydown
    });

    // Setup scroll manager
    scrollManager.onScroll((direction) => {
        if (state.get('viewMode') !== 'history') return;
        if (direction === 'down') {
            handleNext();
        } else {
            handlePrev();
        }
    });
    scrollManager.enable();

}).catch(err => {
    console.error("Load failed:", err);
    chartDom.innerHTML = `<p style='padding:50px;color:red;'>${t('loadError')}</p>`;
});
