// ==================== State Manager with EventDispatcher ====================
class StateManager extends EventTarget {
    #state = {
        data: null,
        currentPointIndex: 0,
        viewMode: 'history',
        activePointId: null,
        currentEraCategory: '',
        locale: 'zh'
    };

    get(key) {
        return this.#state[key];
    }

    set(key, value) {
        const oldValue = this.#state[key];
        if (oldValue === value) return;
        this.#state[key] = value;
        this.dispatchEvent(new CustomEvent(`change:${key}`, { detail: { key, value, oldValue } }));
        this.dispatchEvent(new CustomEvent('change', { detail: { key, value, oldValue } }));
    }

    getAll() {
        return { ...this.#state };
    }
}

export const state = new StateManager();
