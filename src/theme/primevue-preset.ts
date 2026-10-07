import type { PrimeVuePTOptions } from 'primevue/config';

/** PrimeVue runs unstyled; its parts get the same semantic utilities as our components, so a theme never edits this file. */
export const primeVuePreset: PrimeVuePTOptions = {
  select: {
    root: {
      class:
        'relative inline-flex h-11 min-w-0 cursor-pointer items-center rounded-pill border border-line bg-surface-strong pl-4 text-sm text-content',
    },
    label: { class: 'flex-1 truncate py-2' },
    dropdown: { class: 'flex w-10 items-center justify-center text-muted' },
    overlay: { class: 'mt-2 rounded-tile border border-line bg-surface-solid p-1 text-content' },
    listContainer: { class: 'max-h-72 overflow-auto' },
    list: { class: 'm-0 list-none p-0' },
    option: ({ context }) => ({
      class: [
        'flex min-h-11 cursor-pointer items-center rounded-cell px-3 text-sm',
        context.focused && 'bg-surface-hover',
        context.selected && 'font-semibold text-accent-text',
      ],
    }),
  },
  menu: {
    root: { class: 'min-w-52 rounded-tile border border-line bg-surface-solid p-1 text-content' },
    list: { class: 'm-0 list-none p-0' },
    item: ({ context }) => ({ class: ['rounded-cell', context.focused && 'bg-surface-hover'] }),
    itemLink: {
      class:
        'flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm text-content no-underline',
    },
    itemIcon: { class: 'text-muted' },
    separator: { class: 'my-1 border-t border-line' },
  },
  popover: {
    root: { class: 'z-50 mt-2 rounded-tile border border-line bg-surface-solid p-4 text-content' },
  },
};
