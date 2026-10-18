import { useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';

/** Clicks that start on a link or control keep their own action; the rest of the row opens the target. */
const OWN_ACTION = 'a, button, input, label, select, textarea, summary';
/** A drag that selects text ends in a click too: it must not navigate away from the selection. */
const isSelectingText = () => (window.getSelection()?.toString() ?? '') !== '';

/** Makes a whole table row a link target without covering its text, so the text stays selectable. */
export function useRowOpen() {
  const router = useRouter();
  const openNewTab = (location: RouteLocationRaw) =>
    window.open(router.resolve(location).href, '_blank', 'noopener');
  function open(event: MouseEvent, location: RouteLocationRaw) {
    if ((event.target as Element).closest(OWN_ACTION) || isSelectingText()) return;
    if (event.ctrlKey || event.metaKey) openNewTab(location);
    else void router.push(location);
  }
  /** A middle click opens a new tab, as it does on the name link. */
  function openInTab(event: MouseEvent, location: RouteLocationRaw) {
    if (event.button !== 1 || (event.target as Element).closest(OWN_ACTION)) return;
    openNewTab(location);
  }
  return { open, openInTab };
}
