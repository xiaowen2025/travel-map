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

export function t(key, locale = 'zh') {
    return locales[locale]?.[key] || locales.zh[key] || key;
}

export { locales, getLoc };
