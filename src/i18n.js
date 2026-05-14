// ==================== i18n ====================
const locales = {
    zh: {
        title: 'EUROPE',
        subtitle: 'A Journey Through Time',
        modeHistory: '历史纪元',
        modeCity: '城市探索',
        modeNature: '自然风光',
        loadingText: 'Loading Map & History...',
        loadError: '无法加载数据。',
        langLabel: 'EN',
        bestTime: '最佳时间',
        duration: '建议时长',
        tickets: '门票',
        website: '官网'
    },
    en: {
        title: 'EUROPE',
        subtitle: 'A Journey Through Time',
        modeHistory: 'Eras',
        modeCity: 'Cities',
        modeNature: 'Nature',
        loadingText: 'Loading Map & History...',
        loadError: 'Failed to load data.',
        langLabel: '中文',
        bestTime: 'Best Time',
        duration: 'Duration',
        tickets: 'Tickets',
        website: 'Official'
    }
};

/**
 * Retrieve the locale-appropriate value from a point object.
 * Supports both plain values and { en, zh } i18n structure.
 */
function getLoc(point, field, locale = 'zh') {
    const value = point[field];
    if (value === null || value === undefined) return value;
    if (typeof value === 'object' && ('en' in value || 'zh' in value)) {
        return value[locale] ?? value.en;
    }
    return value;
}

/**
 * Retrieve the locale-appropriate value from a raw value (not a point object).
 * Supports both plain values and { en, zh } i18n structure.
 */
export function loc(value, locale = 'zh') {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && ('en' in value || 'zh' in value)) {
        return value[locale] ?? value.en ?? '';
    }
    return value;
}

export function t(key, locale = 'zh') {
    return locales[locale]?.[key] || locales.zh[key] || key;
}

export { locales, getLoc };
