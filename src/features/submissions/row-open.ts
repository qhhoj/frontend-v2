import { useRouter } from 'vue-router';

/** Clicks that start on a link, button or box keep their own action; the rest of the row opens the submission. */
const OWN_ACTION = 'a, button, input, label';
/** A drag that selects text ends in a click too: it must not navigate away from the selection. */
const isSelectingText = () => (window.getSelection()?.toString() ?? '') !== '';

/** Row click handlers shared by the table and the phone list: click opens the submission, ctrl/cmd or middle click opens a tab. */
export function useRowOpen() {
  const router = useRouter();
  const openInTab = (id: string) =>
    window.open(router.resolve({ name: 'submission', params: { id } }).href, '_blank', 'noopener');
  function openRow(event: MouseEvent, id: string) {
    if ((event.target as Element).closest(OWN_ACTION) || isSelectingText()) return;
    if (event.ctrlKey || event.metaKey) openInTab(id);
    else void router.push({ name: 'submission', params: { id } });
  }
  function openRowInTab(event: MouseEvent, id: string) {
    if (event.button !== 1 || (event.target as Element).closest(OWN_ACTION)) return;
    openInTab(id);
  }
  return { openRow, openRowInTab };
}
