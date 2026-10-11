import { inject, provide } from 'vue';
import type { InjectionKey, Ref } from 'vue';

/** The posts a moderator ticked for a bulk hide, shared by the page (its bulk bar) and the table (its boxes) of whichever tab shows. */
export interface PostSelection {
  /** Ids of the visible posts the table shows now: what "select page" picks from. */
  shown: Ref<string[]>;
  isSelected: (id: string) => boolean;
  setSelected: (id: string, isOn: boolean) => void;
}

const KEY: InjectionKey<PostSelection> = Symbol('post-selection');

export const providePostSelection = (selection: PostSelection) => provide(KEY, selection);

/** Null outside the moderation page (the table is then read-only). */
export const usePostSelection = (): PostSelection | null => inject(KEY, null);
