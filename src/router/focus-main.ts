/** Moves focus to the page landmark: after a navigation (router) or when a page swaps its form for a result on the same path. */
export const focusMain = () => document.getElementById('main')?.focus({ preventScroll: true });
