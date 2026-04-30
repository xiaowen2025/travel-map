import * as echarts from 'echarts';
import { state } from './state.js';
import { getLoc } from './i18n.js';
import { getCountry } from './countries.js';

let myChart = null;

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
    echarts.registerMap('europe', geoJson);
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
                    return `<div style="padding: 2px;">
                                <div style="font-size:12px;color:#E8CA88;">${getLoc(p, 'era', locale)}</div>
                                <div style="font-weight:bold;font-size:16px;margin:4px 0;">📍 ${getLoc(p, 'name', locale)}</div>
                                <div style="font-size:12px;color:#aaa;">${getCountry(p, locale)}${getLoc(p, 'region', locale) ? ', ' + getLoc(p, 'region', locale) : ''}</div>
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

// Fly camera to coordinates
export function flyTo(coords, zoom = 3.5, animated = false) {
    if (!coords || coords[0] === 0) return;
    myChart.setOption({
        geo: {
            center: coords,
            zoom: zoom
        }
    }, { animationDurationUpdate: animated ? 1200 : 0 });
}

// Update map markers based on current point index
export function updateMarkers(currentPointIndex, data) {
    if (!data || data.length === 0) return;

    const locale = state.get('locale');
    const activePoints = [];
    const historyPoints = [];

    data.forEach((p, index) => {
        const pointData = {
            name: getLoc(p, 'name', locale),
            value: p.coordinates,
            rawData: p
        };

        if (index === currentPointIndex) {
            pointData.symbolSize = 18;
            activePoints.push(pointData);
        } else if (index < currentPointIndex) {
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
                    return params.data.symbolSize || 8;
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: function(params) {
                        return params.data.showLabel ? params.name : '';
                    },
                    color: '#E8CA88',
                    fontSize: 12,
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
                    label: { show: true, formatter: '{b}', fontSize: 14, fontWeight: 'bold' },
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

// Resize handler
export function resizeChart() {
    myChart?.resize();
}
