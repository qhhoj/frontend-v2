import { onScopeDispose, readonly, ref } from 'vue';

/** The phone layout: below Tailwind's `md` breakpoint. */
export const PHONE_QUERY = '(max-width: 767.98px)';

/** Follows a media query; false where `matchMedia` does not exist. */
export function useMediaQuery(query: string) {
  const matches = ref(false);
  if (typeof matchMedia !== 'function') return readonly(matches);
  const media = matchMedia(query);
  matches.value = media.matches;
  const update = (event: { matches: boolean }) => (matches.value = event.matches);
  media.addEventListener('change', update);
  onScopeDispose(() => media.removeEventListener('change', update));
  return readonly(matches);
}
