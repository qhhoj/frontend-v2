import { computed, inject, provide, ref } from 'vue';
import type { InjectionKey, Ref } from 'vue';

/**
 * One primary button per page. The workbench's cards on the "Kết quả" and "Khác" tabs each have one main action; while the save bar
 * shows ("Lưu" is then the page's primary) those actions turn secondary. The workbench provides whether the bar shows.
 */
const SAVE_BAR_SHOWN: InjectionKey<Ref<boolean>> = Symbol('contest-save-bar-shown');

export const provideSaveBarShown = (isShown: Ref<boolean>) => provide(SAVE_BAR_SHOWN, isShown);

/** The tone of a card's main action: primary, or secondary while the save bar shows. A card outside the workbench is primary. */
export function useCardPrimaryTone() {
  const isShown = inject(SAVE_BAR_SHOWN, ref(false));
  return computed(() => (isShown.value ? 'secondary' : 'primary'));
}
