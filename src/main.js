import * as echarts from 'echarts';
import './style.css';
import { state } from './state.js';
import { t, getLoc, locales } from './i18n.js';
import { initMap, hideLoading, registerMap, setupBaseOption, flyTo, updateMarkers, highlightRelated, showAllPoints, resizeChart, getChart } from './mapEngine.js';
import { ScrollManager } from './scrollManager.js';
import {
    setViewMode, updateLangToggle, updateStaticLabels,
    updateModeButtons, setupEventListeners, collapseCard
} from './ui.js';
import { initCityExplorer, showCityPanel, hideCityPanel, refreshCityPanel, onMapCityClick } from './cityExplorer.js';
import {
    initHistoryExplorer, showHistoryExplorer, hideHistoryExplorer,
    refreshHistoryExplorer, handleScroll, handleKeydown as historyKeydown,
    onMapHistoryClick
} from './historyExplorer.js';

// ==================== Initialize ====================
const chartDom = document.getElementById('map-container');
const myChart = initMap(chartDom);

// ==================== Scroll Manager ====================
const scrollManager = new ScrollManager({ scrollThreshold: 400 });

// ==================== Data Loading ====================
async function loadData(locale) {
    const [geoJson, attractionsData, erasData, destinationsData] = await Promise.all([
        fetch('data/europe.geo.json').then(r => r.json()),
        fetch('data/attractions.json').then(r => r.json()),
        fetch('data/eras.json').then(r => r.json()),
        fetch('data/destinations.json').then(r => r.json())
    ]);
    return { geoJson, attractionsData, erasData, destinationsData };
}

// viewMode change → update UI visibility + map display
state.addEventListener('change:viewMode', (e) => {
    const { value } = e.detail;
    const data = state.get('data');
    setViewMode(value);

    if (value === 'history') {
        hideCityPanel();
        scrollManager.enable();
        showHistoryExplorer();
    } else if (value === 'city') {
        hideHistoryExplorer();
        scrollManager.disable();
        showCityPanel();
    } else {
        hideCityPanel();
        hideHistoryExplorer();
        scrollManager.disable();
        
        const locale = state.get('locale');
        const filtered = data.filter(p => p.category === 'natural').map(p => ({
            name: getLoc(p, 'name', locale),
            value: p.coordinates,
            rawData: p
        }));
        showAllPoints(filtered);
    }
});

// Navigation functions moved to historyExplorer.js

function handleModeChange(mode) {
    state.set('viewMode', mode);
}

async function handleLangToggle() {
    const newLocale = state.get('locale') === 'zh' ? 'en' : 'zh';
    state.set('locale', newLocale);

    updateLangToggle(newLocale);
    updateStaticLabels(newLocale);
    updateModeButtons(newLocale);

    refreshHistoryExplorer();
    refreshCityPanel();
}

function handleKeydown(e) {
    if (state.get('viewMode') === 'history') {
        historyKeydown(e);
    } else if (e.key === 'Escape') {
        collapseCard();
    }
}

function handleMapClick(params) {
    if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
        const p = params.data.rawData;
        if (!p) return;

        const mode = state.get('viewMode');
        if (mode === 'history') {
            onMapHistoryClick(p);
        } else if (mode === 'city') {
            onMapCityClick(p.name, p.country);
        }
    }
}

function handleMapDataAndInit(geoJson, attractionsData) {
    hideLoading();
    registerMap(geoJson);
    setupBaseOption();

    state.set('data', attractionsData.timelinePoints);

    // Enable scroll manager for history mode
    // Enable history view by default
    initHistoryExplorer();
    if (state.get('viewMode') === 'history') {
        scrollManager.enable();
        showHistoryExplorer();
    }

    // Map click event
    myChart.on('click', handleMapClick);

    // Resize handler
    window.addEventListener('resize', resizeChart);
}

// ==================== Boot ====================
loadData(state.get('locale')).then(({ geoJson, attractionsData, erasData, destinationsData }) => {
    // Store eras data in state for UI to use
    state.set('erasData', erasData);

    // Initialize city explorer with destinations data
    initCityExplorer(destinationsData.destinations);

    handleMapDataAndInit(geoJson, attractionsData);

    // Setup UI event listeners
    setupEventListeners({
        onModeChange: handleModeChange,
        onLangToggle: handleLangToggle,
        onKeydown: handleKeydown
    });

    // Setup scroll manager
    scrollManager.onScroll((direction) => {
        if (state.get('viewMode') === 'history') {
            handleScroll(direction);
        }
    });
    scrollManager.enable();

}).catch(err => {
    console.error("Load failed:", err);
    chartDom.innerHTML = `<p style='padding:50px;color:red;'>${t('loadError')}</p>`;
});
