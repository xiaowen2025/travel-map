// ==================== State Manager with Pub/Sub ====================
class StateManager {
    #state = {
        data: null,
        currentPointIndex: 0,
        viewMode: 'history',
        activePointId: null,
        currentEraCategory: '',
        locale: 'zh'
    };

    #listeners = new Map();

    get(key) {
        return this.#state[key];
    }

    set(key, value) {
        const oldValue = this.#state[key];
        if (oldValue === value) return;
        this.#state[key] = value;
        this.#notify(`change:${key}`, { key, value, oldValue });
        this.#notify('change', { key, value, oldValue });
    }

    getAll() {
        return { ...this.#state };
    }

    // Backward-compatible API: alias addEventListener -> subscribe
    addEventListener(event, callback) {
        return this.#subscribe(event, callback);
    }

    // Backward-compatible API: alias removeEventListener -> unsubscribe
    removeEventListener(event, callback) {
        this.#unsubscribe(event, callback);
    }

    // Pub/sub implementation
    #subscribe(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(callback);
        // Return unsubscribe function
        return () => this.#unsubscribe(event, callback);
    }

    #unsubscribe(event, callback) {
        const listeners = this.#listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    #notify(event, data) {
        const listeners = this.#listeners.get(event);
        if (listeners) {
            // Create mock event object for backward compatibility
            const mockEvent = { detail: data };
            listeners.forEach(cb => cb(mockEvent));
        }
    }
}

export const state = new StateManager();
