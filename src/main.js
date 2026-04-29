import * as echarts from 'echarts';
import './style.css';
import { state } from './state.js';
import { t, getLoc, locales } from './i18n.js';
import { initMap, hideLoading, registerMap, setupBaseOption, flyTo, updateMarkers, highlightRelated, showAllPoints, resizeChart, getChart } from './mapEngine.js';
import { ScrollManager } from './scrollManager.js';
import {
    updateEraPanel, showEraToast,
    showCompactCard, expandCard, collapseCard,
    startExpandTimer, clearExpandTimer,
    setViewMode, updateLangToggle, updateStaticLabels,
    updateModeButtons, setupEventListeners
} from './ui.js';

// ==================== Initialize ====================
const chartDom = document.getElementById('map-container');
const myChart = initMap(chartDom);

// ==================== Scroll Manager ====================
const scrollManager = new ScrollManager({ scrollThreshold: 400 });

// ==================== Data Loading ====================
async function loadData(locale) {
    const [geoJson, attractionsData, erasData] = await Promise.all([
        fetch('data/europe.geo.json').then(r => r.json()),
        fetch('data/attractions.json').then(r => r.json()),
        fetch('data/eras.json').then(r => r.json())
    ]);
    return { geoJson, attractionsData, erasData };
}

// ==================== State Subscriptions ====================

// currentPointIndex change → update map markers + camera + card
state.addEventListener('change:currentPointIndex', (e) => {
    const { value, oldValue } = e.detail;
    const data = state.get('data');
    if (!data) return;

    // Determine scroll direction for card animation
    const isScroll = oldValue !== undefined && Math.abs(value - oldValue) === 1;
    const direction = isScroll ? (value > oldValue ? 'down' : 'up') : null;

    // Update markers
    updateMarkers(value, data);

    // Camera fly-to
    const currentPoint = data[value];
    if (currentPoint?.coordinates[0] !== 0) {
        flyTo(currentPoint.coordinates, 3.5, isScroll);
    }

    // Update era panel
    updateEraPanel(currentPoint, state.get('locale'));

    // Show era toast on transition
    const locale = state.get('locale');
    const currentEraCat = getLoc(currentPoint, 'eraCategory', locale);
    const oldEraCat = oldValue !== undefined ? getLoc(data[oldValue], 'eraCategory', locale) : null;
    if (isScroll && currentEraCat !== state.get('currentEraCategory')) {
        state.set('currentEraCategory', currentEraCat);
        showEraToast(currentEraCat);
    } else if (!isScroll) {
        state.set('currentEraCategory', currentEraCat);
    }

    // --- Card: compact + idle timer ---
    // Clear previous expand timer
    clearExpandTimer();

    // Collapse any expanded state immediately
    collapseCard();

    // Show compact card with slide animation
    showCompactCard(currentPoint, direction);

    // Start expand timer (will auto-expand after idle)
    startExpandTimer(currentPoint);
});

// viewMode change → update UI visibility + map display
state.addEventListener('change:viewMode', (e) => {
    const { value } = e.detail;
    const data = state.get('data');
    setViewMode(value);

    if (value === 'history') {
        updateMarkers(state.get('currentPointIndex'), data);
        // Show card for current point
        const currentPoint = data[state.get('currentPointIndex')];
        if (currentPoint) {
            showCompactCard(currentPoint);
            startExpandTimer(currentPoint);
        }
    } else {
        const locale = state.get('locale');
        const filtered = data.filter(p => {
            if (value === 'city') return p.category === 'city';
            if (value === 'nature') return p.category === 'natural';
            return false;
        }).map(p => ({
            name: getLoc(p, 'name', locale),
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
        state.set('currentPointIndex', state.get('currentPointIndex') + 1);
    }
}

function handlePrev() {
    const data = state.get('data');
    if (!data) return;
    if (state.get('currentPointIndex') > 0) {
        state.set('currentPointIndex', state.get('currentPointIndex') - 1);
    }
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

    // Re-render current UI with new locale (data stays the same)
    const data = state.get('data');
    const currentPointIndex = state.get('currentPointIndex');
    const currentPoint = data[currentPointIndex];
    updateMarkers(currentPointIndex, data);
    if (currentPoint) {
        updateEraPanel(currentPoint, newLocale);
        // Re-render card with new locale
        showCompactCard(currentPoint);
        startExpandTimer(currentPoint);
    }
}

function handleKeydown(e) {
    const data = state.get('data');
    if (!data || data.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (state.get('currentPointIndex') < data.length - 1) {
            state.set('currentPointIndex', state.get('currentPointIndex') + 1);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.get('currentPointIndex') > 0) {
            state.set('currentPointIndex', state.get('currentPointIndex') - 1);
        }
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const currentEra = data[state.get('currentPointIndex')].eraCategory;
        for (let i = state.get('currentPointIndex') + 1; i < data.length; i++) {
            if (data[i].eraCategory !== currentEra) {
                state.set('currentPointIndex', i);
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
            state.set('currentPointIndex', prevStart);
        }
    } else if (e.key === 'Escape') {
        collapseCard();
    }
}

function handleMapClick(params) {
    if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
        const p = params.data.rawData;
        if (!p) return;

        // On map click, immediately show and expand (no timer)
        state.set('activePointId', p.id);
        clearExpandTimer();
        showCompactCard(p);
        expandCard(p);
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

    // Show initial card
    const firstPoint = attractionsData.timelinePoints[0];
    if (firstPoint) {
        showCompactCard(firstPoint);
        startExpandTimer(firstPoint);
    }

    // Map click event
    myChart.on('click', handleMapClick);

    // Resize handler
    window.addEventListener('resize', resizeChart);
}

// ==================== Boot ====================
loadData(state.get('locale')).then(({ geoJson, attractionsData, erasData }) => {
    // Store eras data in state for UI to use
    state.set('erasData', erasData);

    handleMapDataAndInit(geoJson, attractionsData);

    // Setup UI event listeners
    setupEventListeners({
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
