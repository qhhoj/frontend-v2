import type { PrimeVuePTOptions } from 'primevue/config';

/** PrimeVue runs unstyled; its parts get the same semantic utilities as our components, so a theme never edits this file. */
export const primeVuePreset: PrimeVuePTOptions = {
  select: {
    root: {
      class:
        'relative inline-flex min-w-0 cursor-pointer items-center rounded-pill border border-line bg-surface-strong pl-4 text-sm text-content has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
    },
    label: { class: 'flex-1 truncate py-2 focus-visible:outline-none' },
    dropdown: { class: 'flex w-10 items-center justify-center text-muted' },
    overlay: {
      class: 'mt-2 rounded-tile border border-line-strong bg-surface-solid p-1 text-content',
    },
    listContainer: { class: 'max-h-72 overflow-auto' },
    header: { class: 'p-1 pb-2' },
    /** The overlay's search box: PrimeVue wraps it with its magnifier in an icon field, which unstyled lays out as two blocks. */
    pcFilterContainer: { root: { class: 'relative block' } },
    pcFilter: {
      root: {
        class:
          'h-11 w-full rounded-row border border-line-strong bg-surface-solid pr-3 pl-10 text-sm text-content placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
      },
    },
    pcFilterIconContainer: {
      root: {
        class:
          'pointer-events-none absolute top-1/2 left-3.5 flex size-4 -translate-y-1/2 items-center text-muted',
      },
    },
    emptyMessage: { class: 'px-3 py-2 text-sm text-muted' },
    list: { class: 'm-0 list-none p-0' },
    option: ({ context }) => ({
      class: [
        'flex min-h-11 cursor-pointer items-center rounded-cell px-3 text-sm',
        context.focused && 'bg-surface-hover outline-2 -outline-offset-2 outline-focus',
        context.selected && 'font-semibold text-accent-text',
      ],
    }),
  },
  menu: {
    root: {
      class: 'min-w-52 rounded-tile border border-line-strong bg-surface-solid p-1 text-content',
    },
    list: { class: 'm-0 list-none rounded-tile p-0' },
    item: ({ context }) => ({
      class: [
        'rounded-cell',
        context.focused && 'bg-surface-hover outline-2 -outline-offset-2 outline-focus',
      ],
    }),
    itemLink: {
      class:
        'flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm text-content no-underline',
    },
    itemIcon: { class: 'text-muted' },
    separator: { class: 'my-1 border-t border-line' },
  },
  popover: {
    root: {
      class: 'z-50 mt-2 rounded-tile border border-line-strong bg-surface-solid p-4 text-content',
    },
  },
  dialog: {
    root: {
      class:
        'flex max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] flex-col rounded-panel border border-line-strong bg-surface-solid text-content',
    },
    header: { class: 'flex shrink-0 items-start justify-between gap-3 px-6 pt-5' },
    title: { class: 'font-display text-xl font-semibold' },
    pcCloseButton: {
      root: {
        class:
          'inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover',
      },
    },
    /** A dialog taller than the screen (root capped at 100dvh - 2rem) scrolls here, so the header (close button) and footer stay on screen. */
    content: { class: 'min-h-0 overflow-y-auto px-6 py-4' },
    footer: { class: 'flex shrink-0 justify-end gap-2.5 px-6 pb-5' },
    mask: { class: 'fixed inset-0 z-50 flex items-center justify-center bg-ground/70 p-4' },
  },
};
