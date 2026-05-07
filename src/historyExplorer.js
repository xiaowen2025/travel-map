import { state } from './state.js';
import { t, getLoc } from './i18n.js';
import { flyTo, updateMarkers, highlightRelated } from './mapEngine.js';
import {
    updateEraPanel, showEraToast,
    showCompactCard, expandCard, collapseCard,
    startExpandTimer
} from './ui.js';

let isActive = false;

// ==================== State Subscriptions ====================

// currentPointIndex change → update map markers + camera + card
state.addEventListener('change:currentPointIndex', (e) => {
    if (!isActive) return;

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
    const currentEraCat = getLoc(currentPoint, 'eraKey', locale);
    if (oldValue !== undefined) {
        if (isScroll && currentEraCat !== state.get('currentEraCategory')) {
            state.set('currentEraCategory', currentEraCat);
            showEraToast(currentEraCat);
        } else if (!isScroll) {
            state.set('currentEraCategory', currentEraCat);
        }
    } else {
        state.set('currentEraCategory', currentEraCat);
    }

    // --- Card: compact ---
    collapseCard();
    showCompactCard(currentPoint, direction);
    startExpandTimer(currentPoint);
});

// activePointId change → highlight related points or reset
state.addEventListener('change:activePointId', (e) => {
    if (!isActive) return;
    
    const { value } = e.detail;
    if (value === null) {
        updateMarkers(state.get('currentPointIndex'), state.get('data'));
    }
});

// ==================== Navigation ====================

function navigateTo(index) {
    if (!isActive) return;
    const data = state.get('data');
    if (!data || index < 0 || index >= data.length) return;
    state.set('currentPointIndex', index);
}

function navigateToEra(direction) {
    if (!isActive) return;
    const data = state.get('data');
    if (!data) return;
    const currentIdx = state.get('currentPointIndex');
    const currentEra = data[currentIdx].eraKey;

    if (direction === 'next') {
        for (let i = currentIdx + 1; i < data.length; i++) {
            if (data[i].eraKey !== currentEra) {
                navigateTo(i);
                break;
            }
        }
    } else {
        let eraStart = currentIdx;
        while (eraStart > 0 && data[eraStart - 1].eraKey === currentEra) {
            eraStart--;
        }
        if (eraStart > 0) {
            const prevEra = data[eraStart - 1].eraKey;
            let prevStart = eraStart - 1;
            while (prevStart > 0 && data[prevStart - 1].eraKey === prevEra) {
                prevStart--;
            }
            navigateTo(prevStart);
        }
    }
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
    const data = state.get('data');
    if (!data || data.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateTo(state.get('currentPointIndex') + 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateTo(state.get('currentPointIndex') - 1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToEra('next');
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToEra('prev');
    } else if (e.key === 'Escape') {
        collapseCard();
    }
}

export function onMapHistoryClick(p) {
    if (!isActive) return;
    
    // On map click, immediately show and expand (no timer)
    state.set('activePointId', p.id);
    showCompactCard(p);
    expandCard(p);
    highlightRelated(p, state.get('data'));
}

// ==================== Lifecycle Methods ====================

export function initHistoryExplorer() {
    // any initialization if needed, data is in state.get('data')
}

export function showHistoryExplorer() {
    isActive = true;
    
    // Re-render UI based on current index
    const data = state.get('data');
    if (data) {
        const currentPointIndex = state.get('currentPointIndex') || 0;
        updateMarkers(currentPointIndex, data);
        
        const currentPoint = data[currentPointIndex];
        if (currentPoint) {
            showCompactCard(currentPoint);
            startExpandTimer(currentPoint);
            updateEraPanel(currentPoint, state.get('locale'));
        }
    }
}

export function hideHistoryExplorer() {
    isActive = false;
    collapseCard();
}

export function refreshHistoryExplorer() {
    if (!isActive) return;
    
    // Re-render current UI with new locale (data stays the same)
    const data = state.get('data');
    const currentPointIndex = state.get('currentPointIndex');
    const currentPoint = data[currentPointIndex];
    updateMarkers(currentPointIndex, data);
    
    if (currentPoint) {
        updateEraPanel(currentPoint, state.get('locale'));
        showCompactCard(currentPoint);
        startExpandTimer(currentPoint);
    }
}
