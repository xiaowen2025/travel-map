let activeController = null;

const ANIMATION_DURATION = 400;

/**
 * Create and manage a detail overlay with consistent animation and behavior.
 *
 * @param {Object} config
 * @param {Function} config.renderContent - Returns HTML string for the overlay content
 * @param {Function} config.onClose - Callback when overlay is closed
 * @param {string} config.overlayClass - Additional CSS class for the overlay (default: '')
 * @param {string} config.cardClass - Additional CSS class for the card (default: '')
 * @returns {Object} Controller with show(), close(), isVisible
 */
export function createDetailOverlay({ renderContent, onClose, overlayClass = '', cardClass = '' }) {
    let overlay = null;
    let isShowing = false;
    let escHandlerRef = null;

    function close() {
        if (!overlay) return;
        overlay.classList.remove('visible');

        if (escHandlerRef) {
            window.removeEventListener('keydown', escHandlerRef);
            escHandlerRef = null;
        }

        setTimeout(() => {
            overlay?.remove();
            overlay = null;
            isShowing = false;
            if (activeController === controller) {
                activeController = null;
            }
            onClose?.();
        }, ANIMATION_DURATION);
    }

    function show() {
        // Close any existing overlay first
        if (activeController && activeController !== controller) {
            activeController.close();
        }

        // Remove any previous overlay from DOM
        document.querySelector('.detail-overlay')?.remove();

        // Create new overlay
        overlay = document.createElement('div');
        overlay.className = `detail-overlay ${overlayClass}`.trim();

        overlay.innerHTML = `
            <div class="detail-card ${cardClass}">
                ${renderContent()}
            </div>
        `;

        document.body.appendChild(overlay);
        activeController = controller;
        isShowing = true;

        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        // Close button handler
        overlay.querySelector('.detail-close')?.addEventListener('click', close);

        // Click-outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        // Escape key handler
        escHandlerRef = (e) => {
            if (e.key === 'Escape') {
                close();
            }
        };
        window.addEventListener('keydown', escHandlerRef);
    }

    const controller = {
        show,
        close,
        get isVisible() { return isShowing; }
    };

    return controller;
}

/**
 * Close any active overlay (called when panel deactivates)
 */
export function closeActiveOverlay() {
    activeController?.close();
    activeController = null;
}