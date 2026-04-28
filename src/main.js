import * as echarts from 'echarts';
import './style.css';

// ==================== i18n ====================
const locales = {
    zh: {
        title: 'EUROPE',
        subtitle: 'A Journey Through Time',
        modeHistory: '历史纪元',
        modeCity: '城市探索',
        modeNature: '自然风光',
        scrollHint: '滚轮穿梭时空',
        eraDescDefault: '使用滚轮穿梭于欧洲历史的长河',
        loadingText: 'Loading Map & History...',
        loadError: '无法加载数据。',
        langLabel: 'EN'
    },
    en: {
        title: 'EUROPE',
        subtitle: 'A Journey Through Time',
        modeHistory: 'Eras',
        modeCity: 'Cities',
        modeNature: 'Nature',
        scrollHint: 'Scroll to Travel',
        eraDescDefault: 'Use mouse wheel to travel through European history',
        loadingText: 'Loading Map & History...',
        loadError: 'Failed to load data.',
        langLabel: '中文'
    }
};

/**
 * Retrieve the locale-appropriate value from a point object.
 * In English mode, tries `field_en` first; falls back to Chinese if missing or placeholder.
 */
function getLoc(point, field) {
    if (state.locale === 'en') {
        const enVal = point[`${field}_en`];
        if (enVal && !enVal.startsWith('[EN]')) return enVal;
    }
    return point[field];
}

function t(key) {
    return locales[state.locale][key] || key;
}

// ==================== DOM & ECharts ====================
const chartDom = document.getElementById('map-container');
const myChart = echarts.init(chartDom);

// State
const state = {
    data: null,
    currentPointIndex: 0,
    viewMode: 'history',
    activePointId: null,
    currentEraCategory: '',
    locale: 'zh'
};

const ui = {
    eraTitle: document.getElementById('eraTitle'),
    detailPanel: document.getElementById('detailPanel'),
    closeDetail: document.getElementById('closeDetail'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    langToggle: document.getElementById('langToggle')
};

myChart.showLoading({
    text: t('loadingText'),
    color: '#E8CA88',
    textColor: '#fff',
    maskColor: 'rgba(15, 16, 20, 0.8)'
});

Promise.all([
    fetch('data/europe.geo.json').then(r => r.json()),
    fetch('data/attractions.json').then(r => r.json())
]).then(([geoJson, attractionsData]) => {
    myChart.hideLoading();
    echarts.registerMap('europe', geoJson);

    state.data = attractionsData.timelinePoints;

    initMap();
    updateTimelineView();
    bindEvents();

}).catch(err => {
    console.error("Load failed:", err);
    chartDom.innerHTML = `<p style='padding:50px;color:red;'>${t('loadError')}</p>`;
});

function initMap() {
    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(20, 20, 20, 0.85)',
            borderColor: '#E8CA88',
            padding: 12,
            textStyle: { color: '#fff' },
            formatter: function (params) {
                if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
                    const p = params.data.rawData;
                    if (!p) return params.name;
                    return `<div style="padding: 2px;">
                                <div style="font-size:12px;color:#E8CA88;">${getLoc(p, 'era')}</div>
                                <div style="font-weight:bold;font-size:16px;margin:4px 0;">📍 ${getLoc(p, 'name')}</div>
                                <div style="font-size:12px;color:#aaa;">${getLoc(p, 'location')}</div>
                            </div>`;
                }
            }
        },
        geo: {
            map: 'europe',
            roam: 'move',
            zoom: 1.6,
            center: [10, 52],
            label: { emphasis: { show: false } },
            itemStyle: {
                areaColor: '#1c1e26',
                borderColor: '#3a3d4a',
                borderWidth: 1
            },
            emphasis: {
                itemStyle: {
                    areaColor: '#2d313d',
                    borderWidth: 0,
                    shadowBlur: 15,
                    shadowColor: 'rgba(0,0,0,0.8)'
                }
            }
        },
        series: [
            {
                name: 'HistoryPoints',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                symbolSize: 12,
                rippleEffect: { brushType: 'stroke', scale: 3 },
                label: {
                    show: true, position: 'right', formatter: '{b}',
                    color: '#E8CA88', fontSize: 13, distance: 10
                },
                itemStyle: {
                    color: '#E8CA88', shadowBlur: 10, shadowColor: '#E8CA88'
                },
                data: []
            },
            {
                name: 'OtherPoints',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 1,
                symbolSize: 6,
                label: { show: false },
                itemStyle: { color: 'rgba(232, 202, 136, 0.3)' },
                data: []
            }
        ]
    };
    myChart.setOption(option);
}

function updateTimelineView(isScroll = false) {
    if (state.viewMode !== 'history') return;
    if (!state.data || state.data.length === 0) return;

    const currentPoint = state.data[state.currentPointIndex];

    ui.eraTitle.innerText = getLoc(currentPoint, 'eraCategory');
    document.getElementById('eraDesc').innerText = getLoc(currentPoint, 'era');

    // Era transition toast
    const currentEraCat = getLoc(currentPoint, 'eraCategory');
    if (isScroll && currentEraCat !== state.currentEraCategory) {
        state.currentEraCategory = currentEraCat;
        const toast = document.getElementById('eraToast');
        toast.innerText = currentEraCat;
        toast.style.opacity = 1;
        setTimeout(() => { toast.style.opacity = 0; }, 2500);
    } else if (!isScroll) {
        state.currentEraCategory = currentEraCat;
    }

    // Classify nodes
    const activePoints = [];
    const historyPoints = [];

    state.data.forEach((p, index) => {
        const pointData = {
            name: getLoc(p, 'name'),
            value: p.coordinates,
            rawData: p
        };

        if (index === state.currentPointIndex) {
            pointData.symbolSize = 18;
            activePoints.push(pointData);
        } else if (index < state.currentPointIndex) {
            historyPoints.push(pointData);
        }
    });

    myChart.setOption({
        series: [
            { name: 'HistoryPoints', data: activePoints },
            { name: 'OtherPoints', data: historyPoints }
        ]
    });

    // Camera fly-to
    if (isScroll && currentPoint.coordinates[0] !== 0) {
        myChart.setOption({
            geo: {
                center: currentPoint.coordinates,
                zoom: 3.5
            }
        }, { animationDurationUpdate: 1200 });
    } else if (!isScroll && currentPoint.coordinates[0] !== 0) {
        myChart.setOption({
            geo: { center: currentPoint.coordinates, zoom: 3.5 }
        });
    }

    // Auto-open detail panel on scroll
    if (isScroll) {
        showDetailPanel(currentPoint);
    }
}

function bindEvents() {
    // Scroll-driven timeline
    let scrollTimeout = null;
    window.addEventListener('wheel', (e) => {
        if (state.viewMode !== 'history') return;

        if (scrollTimeout) return;

        scrollTimeout = setTimeout(() => {
            if (e.deltaY > 0) {
                if (state.currentPointIndex < state.data.length - 1) {
                    state.currentPointIndex++;
                    updateTimelineView(true);
                }
            } else {
                if (state.currentPointIndex > 0) {
                    state.currentPointIndex--;
                    updateTimelineView(true);
                }
            }
            scrollTimeout = null;
        }, 400);
    }, { passive: true });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
        if (state.viewMode !== 'history') return;
        if (!state.data || state.data.length === 0) return;

        if (e.key === 'ArrowDown') {
            // Next attraction
            e.preventDefault();
            if (state.currentPointIndex < state.data.length - 1) {
                state.currentPointIndex++;
                updateTimelineView(true);
            }
        } else if (e.key === 'ArrowUp') {
            // Previous attraction
            e.preventDefault();
            if (state.currentPointIndex > 0) {
                state.currentPointIndex--;
                updateTimelineView(true);
            }
        } else if (e.key === 'ArrowRight') {
            // Jump to next era/chapter
            e.preventDefault();
            const currentEra = state.data[state.currentPointIndex].eraCategory;
            for (let i = state.currentPointIndex + 1; i < state.data.length; i++) {
                if (state.data[i].eraCategory !== currentEra) {
                    state.currentPointIndex = i;
                    updateTimelineView(true);
                    break;
                }
            }
        } else if (e.key === 'ArrowLeft') {
            // Jump to previous era/chapter
            e.preventDefault();
            const currentEra = state.data[state.currentPointIndex].eraCategory;
            // First, find the start of the current era
            let eraStart = state.currentPointIndex;
            while (eraStart > 0 && state.data[eraStart - 1].eraCategory === currentEra) {
                eraStart--;
            }
            if (eraStart > 0) {
                // Jump to the start of the previous era
                const prevEra = state.data[eraStart - 1].eraCategory;
                let prevStart = eraStart - 1;
                while (prevStart > 0 && state.data[prevStart - 1].eraCategory === prevEra) {
                    prevStart--;
                }
                state.currentPointIndex = prevStart;
                updateTimelineView(true);
            }
        } else if (e.key === 'Escape') {
            // Close detail panel
            ui.detailPanel.classList.remove('open');
            state.activePointId = null;
            updateTimelineView(false);
        }
    });

    // Map click
    myChart.on('click', function (params) {
        if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
            const p = params.data.rawData;
            if (!p) return;

            showDetailPanel(p);
            highlightRelated(p);
        }
    });

    // Close detail panel
    ui.closeDetail.addEventListener('click', () => {
        ui.detailPanel.classList.remove('open');
        state.activePointId = null;
        updateTimelineView(false);
    });

    // Mode switch
    ui.modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            ui.modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const mode = e.target.dataset.mode;
            state.viewMode = mode;

            if (mode === 'history') {
                document.getElementById('eraPanel').style.opacity = 1;
                document.querySelector('.scroll-indicator').style.opacity = 1;
                updateTimelineView(false);
            } else {
                document.getElementById('eraPanel').style.opacity = 0;
                document.querySelector('.scroll-indicator').style.opacity = 0;

                const allPoints = state.data
                    .filter(p => mode === 'city' ? p.category === 'city' : p.category === 'natural')
                    .map(p => ({
                        name: getLoc(p, 'name'),
                        value: p.coordinates,
                        rawData: p
                    }));

                myChart.setOption({
                    series: [
                        { name: 'HistoryPoints', data: allPoints },
                        { name: 'OtherPoints', data: [] }
                    ]
                });
            }
        });
    });

    // Language toggle
    ui.langToggle.addEventListener('click', switchLanguage);

    window.addEventListener('resize', () => myChart.resize());
}

function showDetailPanel(p) {
    state.activePointId = p.id;
    document.getElementById('detailEra').innerText = getLoc(p, 'eraCategory') + ' | ' + getLoc(p, 'era');
    document.getElementById('detailTitle').innerText = getLoc(p, 'name');
    document.getElementById('detailLoc').innerText = '📍 ' + getLoc(p, 'location');
    document.getElementById('detailHighlight').innerText = getLoc(p, 'shortDesc') || '';
    document.getElementById('detailDesc').innerText = getLoc(p, 'description') || '';

    // Render image
    const imgEl = document.getElementById('detailImage');
    if (p.image) {
        imgEl.src = 'assets/' + p.image;
        imgEl.alt = getLoc(p, 'name');
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    ui.detailPanel.classList.add('open');
}

// Highlight related points (triggered by click)
function highlightRelated(targetPoint) {
    const activePoints = [];
    const otherPoints = [];

    state.data.forEach(p => {
        const pointData = { name: getLoc(p, 'name'), value: p.coordinates, rawData: p };

        const isRelated = p.id === targetPoint.id || p.eraCategory === targetPoint.eraCategory;

        if (isRelated) {
            if (p.id === targetPoint.id) {
                pointData.symbolSize = 20;
                pointData.itemStyle = { color: '#ff5555', shadowColor: '#ff5555' };
            }
            activePoints.push(pointData);
        } else {
            otherPoints.push(pointData);
        }
    });

    myChart.setOption({
        series: [
            { name: 'HistoryPoints', data: activePoints },
            { name: 'OtherPoints', data: otherPoints }
        ]
    });
}

// ==================== Language Switch ====================
function switchLanguage() {
    state.locale = state.locale === 'zh' ? 'en' : 'zh';

    // Update toggle button text
    ui.langToggle.innerText = t('langLabel');

    // Update static UI labels
    document.querySelector('.header p').innerText = t('subtitle');
    document.querySelector('.scroll-indicator span').innerText = t('scrollHint');

    // Update mode button labels
    const modeKeys = ['modeHistory', 'modeCity', 'modeNature'];
    ui.modeBtns.forEach((btn, i) => {
        btn.innerText = t(modeKeys[i]);
    });

    // Re-render map and panels
    state.currentEraCategory = '';
    updateTimelineView(false);

    // If detail panel is open, refresh its content
    if (state.activePointId && state.data) {
        const activePoint = state.data.find(p => p.id === state.activePointId);
        if (activePoint) showDetailPanel(activePoint);
    }
}