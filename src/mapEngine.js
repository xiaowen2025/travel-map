import * as echarts from 'echarts';
import { state } from './state.js';
import { getLoc } from './i18n.js';
import { getCountry, getCountryByFullName } from './countries.js';
import {
    MAP_ZOOM_INITIAL,
    MAP_ZOOM_FLYTO,
    MAP_ANIMATION_DURATION_MS,
    SYMBOL_SIZE_ACTIVE,
    SYMBOL_SIZE_SELECTED,
    SYMBOL_SIZE_HISTORY,
    SYMBOL_SIZE_OTHER,
    SYMBOL_SIZE_DEFAULT,
    SYMBOL_SIZE_GEOGRAPHY,
    LABEL_FONT_SIZE_NORMAL,
    LABEL_FONT_SIZE_CITY,
    LABEL_FONT_SIZE_EMPHASIS,
    LABEL_FONT_SIZE_GEOGRAPHY,
} from './constants.js';

let myChart = null;
let countryCentroids = [];

export function initMap(chartDom) {
    myChart = echarts.init(chartDom);
    myChart.showLoading({
        text: 'Loading Map & History...',
        color: '#E8CA88',
        textColor: '#fff',
        maskColor: 'rgba(15, 16, 20, 0.8)'
    });
    return myChart;
}

export function getChart() {
    return myChart;
}

export function hideLoading() {
    myChart?.hideLoading();
}

export function registerMap(geoJson) {
    echarts.registerMap('europe', geoJson, {
        nameProperty: 'NAME'
    });

    // Calculate centroids for labels
    countryCentroids = geoJson.features.map(f => {
        const name = f.properties.NAME;
        let coords = [0, 0];
        
        // Use provided LON/LAT if available, otherwise simple average
        if (f.properties.LON && f.properties.LAT) {
            coords = [f.properties.LON, f.properties.LAT];
        } else {
            // Very simple centroid: average of all points in first polygon
            const ring = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
            let sumX = 0, sumY = 0;
            ring.forEach(p => { sumX += p[0]; sumY += p[1]; });
            coords = [sumX / ring.length, sumY / ring.length];
        }
        
        return { name, value: coords };
    });
}

export function setupBaseOption() {
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
                    const locale = state.get('locale');
                    if (!p) return params.name;
                    const eraLabel = getLoc(p, 'era', locale);
                    const eraHtml = eraLabel ? `<div style="font-size:12px;color:#E8CA88;">${eraLabel}</div>` : '';
                    // Get range from tags (e.g. "range:Alps")
                    const rangeTag = p.tags?.find(t => t.startsWith('range:'));
                    const rangeLabel = rangeTag ? rangeTag.split(':')[1] : getLoc(p, 'region', locale);
                    const locationHtml = rangeLabel ? `, ${rangeLabel}` : '';
                    return `<div style="padding: 2px;">
                                ${eraHtml}
                                <div style="font-weight:bold;font-size:16px;margin:4px 0;">📍 ${getLoc(p, 'name', locale)}</div>
                                <div style="font-size:12px;color:#aaa;">${getCountry(p, locale)}${locationHtml}</div>
                            </div>`;
                }
            }
        },
        geo: {
            map: 'europe',
            roam: true,
            zoom: MAP_ZOOM_INITIAL,
            center: [10, 52],
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
                name: 'CountryLabels',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: [],
                symbolSize: 0,
                label: {
                    show: false,
                    position: 'inside',
                    color: '#E8CA88',
                    fontSize: 11,
                    fontWeight: 'normal',
                    textBorderColor: 'rgba(0, 0, 0, 0.8)',
                    textBorderWidth: 1.5,
                    formatter: function (params) {
                        const locale = state.get('locale');
                        return getCountryByFullName(params.name, locale);
                    }
                },
                silent: true,
                zlevel: 1
            },
            {
                name: 'HistoryPoints',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                symbolSize: SYMBOL_SIZE_HISTORY,
                rippleEffect: { brushType: 'stroke', scale: 3 },
                label: {
                    show: true, position: 'right', formatter: '{b}',
                    color: '#E8CA88', fontSize: LABEL_FONT_SIZE_NORMAL, distance: 10
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
                symbolSize: SYMBOL_SIZE_OTHER,
                label: { show: false },
                itemStyle: { color: 'rgba(232, 202, 136, 0.3)' },
                data: []
            },
            {
                name: 'GeographyPoints',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 3,
                symbolSize: 6,
                itemStyle: {
                    color: 'transparent'
                },
                label: {
                    show: true,
                    position: 'bottom',
                    formatter: '{b}',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: LABEL_FONT_SIZE_GEOGRAPHY,
                    distance: 3,
                    textBorderColor: 'rgba(15, 16, 20, 0.9)',
                    textBorderWidth: 2
                },
                silent: true,
                data: []
            },
            {
                name: 'GeographyLines',
                type: 'lines',
                coordinateSystem: 'geo',
                polyline: true,
                zlevel: 2,
                silent: true,
                lineStyle: {
                    opacity: 0.5
                },
                data: []
            }
        ]
    };
    myChart.setOption(option);
}

// Fly camera to coordinates
export function flyTo(coords, zoom = MAP_ZOOM_FLYTO, animated = false) {
    if (!coords || coords[0] === 0) return;
    myChart.setOption({
        geo: {
            center: coords,
            zoom: zoom
        }
    }, { animationDurationUpdate: animated ? MAP_ANIMATION_DURATION_MS : 0 });
}

// Update map markers based on current point index
export function updateMarkers(currentPointIndex, data) {
    if (!data || data.length === 0) return;

    const locale = state.get('locale');
    const mode = state.get('viewMode');
    const activePoints = [];
    const historyPoints = [];

    data.forEach((p, index) => {
        const pointData = {
            name: getLoc(p, 'name', locale),
            value: p.coordinates,
            rawData: p
        };

        if (index === currentPointIndex) {
            pointData.symbolSize = SYMBOL_SIZE_ACTIVE;
            activePoints.push(pointData);
        } else if (index < currentPointIndex) {
            historyPoints.push(pointData);
        } else if (mode === 'nature') {
            // In nature mode, show future points as well, but styled as other/history
            historyPoints.push(pointData);
        }
    });

    myChart.setOption({
        series: [
            { name: 'HistoryPoints', data: activePoints },
            { name: 'OtherPoints', data: historyPoints }
        ]
    });
}

// Highlight related points (triggered by click)
export function highlightRelated(targetPoint, data) {
    const locale = state.get('locale');
    const activePoints = [];
    const otherPoints = [];

    data.forEach(p => {
        const pointData = { name: getLoc(p, 'name', locale), value: p.coordinates, rawData: p };

        const isRelated = p.id === targetPoint.id || p.eraKey === targetPoint.eraKey;

        if (isRelated) {
            if (p.id === targetPoint.id) {
                pointData.symbolSize = SYMBOL_SIZE_SELECTED;
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

// Show specific points for city mode with dynamic sizes and selective labels
export function showCityPoints(points) {
    const locale = state.get('locale');
    myChart.setOption({
        series: [
            {
                name: 'HistoryPoints',
                type: 'scatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                symbolSize: function (val, params) {
                    return params.data.symbolSize || SYMBOL_SIZE_DEFAULT;
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: function(params) {
                        return params.data.showLabel ? params.name : '';
                    },
                    color: '#E8CA88',
                    fontSize: LABEL_FONT_SIZE_CITY,
                    distance: 6,
                    textBorderColor: 'rgba(15, 16, 20, 0.8)',
                    textBorderWidth: 2
                },
                itemStyle: {
                    color: function(params) {
                        return params.data.color || '#E8CA88';
                    },
                    opacity: 0.8,
                    borderColor: '#fff',
                    borderWidth: 0.5,
                    shadowBlur: 8,
                    shadowColor: 'rgba(0,0,0,0.5)'
                },
                emphasis: {
                    scale: true,
                    label: { show: true, formatter: '{b}', fontSize: LABEL_FONT_SIZE_EMPHASIS, fontWeight: 'bold' },
                    itemStyle: { opacity: 1, borderColor: '#E8CA88', borderWidth: 2 }
                },
                data: points
            },
            { name: 'OtherPoints', data: [] }
        ]
    });
}

// Show all points for nature mode
export function showAllPoints(points) {
    myChart.setOption({
        series: [
            { name: 'HistoryPoints', data: points },
            { name: 'OtherPoints', data: [] }
        ]
    });
}

// Show geography features (mountains, rivers)
export function showGeographyPoints(geographyData, locale) {
    if (!geographyData || !geographyData.features) {
        myChart.setOption({
            series: [
                { name: 'GeographyPoints', data: [] },
                { name: 'GeographyLines', data: [] }
            ]
        });
        return;
    }

    const scatterPoints = [];
    const lineData = [];

    geographyData.features.forEach(f => {
        // Label/Icon point
        scatterPoints.push({
            name: f.name[locale] || f.name.en,
            value: f.coordinates,
            label: {
                show: true,
                formatter: `${f.icon} ${f.name[locale] || f.name.en}`,
                fontSize: f.type === 'mountain' ? LABEL_FONT_SIZE_GEOGRAPHY + 2 : LABEL_FONT_SIZE_GEOGRAPHY,
                color: f.type === 'mountain' ? '#E8CA88' : '#7dd3fc',
                fontWeight: f.type === 'mountain' ? 'bold' : 'normal'
            }
        });

        // Path as lines
        if (f.path && f.path.length > 1) {
            for (let i = 0; i < f.path.length - 1; i++) {
                lineData.push({
                    coords: [f.path[i], f.path[i + 1]],
                    lineStyle: {
                        color: f.type === 'mountain' ? '#E8CA88' : '#38bdf8',
                        width: f.type === 'mountain' ? 3 : 2,
                        opacity: f.type === 'mountain' ? 0.4 : 0.6
                    }
                });
            }
        }
    });

    myChart.setOption({
        series: [
            { name: 'GeographyPoints', data: scatterPoints },
            { name: 'GeographyLines', data: lineData }
        ]
    });
}

// Toggle country labels on the map
export function toggleCountryLabels(show, locale = 'zh') {
    if (!myChart) return;
    myChart.setOption({
        series: [
            {
                name: 'CountryLabels',
                data: show ? countryCentroids : [],
                label: {
                    show: show
                }
            }
        ]
    });
}

// Simple debounce utility
function debounce(fn, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

// Resize handler (debounced)
export const resizeChart = debounce(() => {
    myChart?.resize();
}, 150);
