/**
 * Shared keyboard navigation for card-based panels.
 * Provides ArrowUp/Down card navigation, ArrowLeft/Right group navigation, and Escape handling.
 *
 * @param {Object} config
 * @param {Function} config.getCards - Returns array of card elements
 * @param {Function} config.getGroups - Returns array of group elements (for Left/Right nav)
 * @param {Function} config.onSelect - Called with selected card element when ArrowUp/Down
 * @param {Function} config.onGroupSelect - Called with first card of selected group when ArrowLeft/Right
 * @param {Function} config.onEscape - Called when Escape is pressed
 * @param {boolean} config.wrap - Whether to wrap at ends (default: true)
 */
export function createKeyboardNavigation({
    getCards,
    getGroups,
    onSelect,
    onGroupSelect,
    onEscape,
    wrap = true
}) {
    function handleKeydown(e) {
        const cards = getCards();
        if (!cards || cards.length === 0) return;

        const currentIndex = Array.from(cards).findIndex(
            card => card.classList.contains('active')
        );

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            let nextIndex;
            if (currentIndex < cards.length - 1) {
                nextIndex = currentIndex + 1;
            } else if (wrap) {
                nextIndex = 0;
            } else {
                return;
            }
            onSelect(cards[nextIndex], nextIndex);

        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            let nextIndex;
            if (currentIndex > 0) {
                nextIndex = currentIndex - 1;
            } else if (wrap) {
                nextIndex = cards.length - 1;
            } else {
                return;
            }
            onSelect(cards[nextIndex], nextIndex);

        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (!getGroups) return;
            const groups = getGroups();
            if (!groups || groups.length === 0) return;

            const currentGroupIndex = Array.from(groups).findIndex(
                group => group.contains(cards[currentIndex])
            );

            let nextGroupIndex;
            if (currentGroupIndex < groups.length - 1) {
                nextGroupIndex = currentGroupIndex + 1;
            } else if (wrap) {
                nextGroupIndex = 0;
            } else {
                return;
            }
            onGroupSelect(groups[nextGroupIndex], nextGroupIndex);

        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (!getGroups) return;
            const groups = getGroups();
            if (!groups || groups.length === 0) return;

            const currentGroupIndex = Array.from(groups).findIndex(
                group => group.contains(cards[currentIndex])
            );

            let nextGroupIndex;
            if (currentGroupIndex > 0) {
                nextGroupIndex = currentGroupIndex - 1;
            } else if (wrap) {
                nextGroupIndex = groups.length - 1;
            } else {
                return;
            }
            onGroupSelect(groups[nextGroupIndex], nextGroupIndex);

        } else if (e.key === 'Escape') {
            e.preventDefault();
            onEscape?.();
        }
    }

    return { handleKeydown };
}