// ==================== Scroll Manager ====================
export class ScrollManager {
    #enabled = false;
    #timeout = null;

    constructor({
        scrollThreshold = 400,
        passive = true
    } = {}) {
        this.scrollThreshold = scrollThreshold;
        this.passive = passive;
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
