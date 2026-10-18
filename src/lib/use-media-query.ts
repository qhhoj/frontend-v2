import { readonly, ref, toValue, watchEffect } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

/** The phone layout: below Tailwind's `md` breakpoint. */
export const PHONE_QUERY = '(max-width: 767.98px)';

/** Follows a media query (a getter switches queries); false where `matchMedia` does not exist. */
export function useMediaQuery(query: MaybeRefOrGetter<string>) {
  const matches = ref(false);
  if (typeof matchMedia !== 'function') return readonly(matches);
  watchEffect((onCleanup) => {
    const media = matchMedia(toValue(query));
    matches.value = media.matches;
    const update = (event: { matches: boolean }) => (matches.value = event.matches);
    media.addEventListener('change', update);
    onCleanup(() => media.removeEventListener('change', update));
  });
  return readonly(matches);
}
