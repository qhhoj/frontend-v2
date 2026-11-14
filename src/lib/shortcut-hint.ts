/** The hint on a search button: ⌘K on Apple systems, Ctrl K elsewhere (both work everywhere). */
export const shortcutHint = (platform = navigator.platform): string =>
  /Mac|iPhone|iPad/.test(platform) ? '⌘K' : 'Ctrl K';
