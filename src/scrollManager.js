import { SCROLL_THROTTLE_MS } from './constants.js';

// ==================== Scroll Manager ====================
export class ScrollManager {
    #enabled = false;
    #timeout = null;
    #excludeSelector = null;

    constructor({
        scrollThreshold = SCROLL_THROTTLE_MS,
        passive = true,
        excludeSelector = null
    } = {}) {
        this.scrollThreshold = scrollThreshold;
        this.passive = passive;
        this.#excludeSelector = excludeSelector;
    }

    enable() {
        this.#enabled = true;
    }

    disable() {
        this.#enabled = false;
    }

    onScroll(callback) {
        const handler = (e) => {
            if (!this.#enabled) return;
            if (this.#timeout) return;
            if (e.ctrlKey) return; // Ignore zoom gestures
            if (this.#excludeSelector && e.target.closest(this.#excludeSelector)) return;

            this.#timeout = setTimeout(() => {
                const direction = e.deltaY > 0 ? 'down' : 'up';
                callback(direction);
                this.#timeout = null;
            }, this.scrollThreshold);
        };

        window.addEventListener('wheel', handler, { passive: this.passive });

        return () => {
            window.removeEventListener('wheel', handler);
        };
    }
}
