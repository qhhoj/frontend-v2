<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import { lastPageOf, pageWindow, queryWithPage } from '@/lib/paging';

/**
 * Numbered page links (`?page=`, or the given `queryKey`), keeping every other query key; hidden when one page holds
 * everything. `align="end"` puts them at the right (a pager above a list); `stepper` shows only the arrows around
 * "page / last" ("Trang N" when the list has no total, a `hasMore` meta), the short pager above a list or for a list
 * whose total is unknown. Cells are the control height: 44 px, or `compact` 36 px (44 px on touch) under an admin table.
 */
const props = withDefaults(
  defineProps<{
    meta: NumberedPageMeta;
    label: string;
    queryKey?: string;
    align?: 'center' | 'end';
    /** Admin density: 36 px cells on a fine pointer (44 px on a coarse one), 12 px radius. */
    compact?: boolean;
    stepper?: boolean;
  }>(),
  {
    queryKey: 'page',
    align: 'center',
    compact: false,
    stepper: false,
  },
);
const route = useRoute();
const { t } = useI18n();
const last = computed(() => lastPageOf(props.meta));
const slots = computed(() => pageWindow(props.meta.page, last.value));
const hasPrevious = computed(() => props.meta.page > 1);
const hasNext = computed(() => props.meta.page < last.value);
/** Without a total the last page is only "one more"; the stepper then names the page alone. */
const position = computed(() =>
  'total' in props.meta
    ? t('pager.position', { page: props.meta.page, last: last.value })
    : t('pager.positionOpen', { page: props.meta.page }),
);
const linkTo = (page: number) => ({ query: queryWithPage(route.query, props.queryKey, page) });
const CELL = computed(() =>
  props.compact
    ? 'inline-flex min-h-(--qh-control-sm) min-w-(--qh-control-sm) items-center justify-center rounded-cell px-2 font-mono text-sm font-semibold tabular-nums'
    : 'inline-flex min-h-(--qh-control) min-w-(--qh-control) items-center justify-center rounded-pill px-3 font-semibold',
);
// A disabled arrow keeps its shape but reads as muted text with no hover fill (token colours only, no opacity).
const ARROW = computed(
  () =>
    `${CELL.value} border border-line text-content hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:bg-transparent aria-disabled:text-muted aria-disabled:hover:bg-transparent`,
);
</script>

<template>
  <nav
    v-if="last > 1"
    :aria-label="label"
    class="flex flex-wrap items-center gap-1.5"
    :class="align === 'end' ? 'justify-end' : 'justify-center'"
  >
    <RouterLink v-if="hasPrevious" v-slot="{ href, navigate }" custom :to="linkTo(meta.page - 1)">
      <a :href="href" :aria-label="$t('pager.previous')" :class="ARROW" @click="navigate">
        <ChevronLeft aria-hidden="true" class="size-4" />
      </a>
    </RouterLink>
    <span v-else role="link" :aria-label="$t('pager.previous')" aria-disabled="true" :class="ARROW">
      <ChevronLeft aria-hidden="true" class="size-4" />
    </span>
    <span v-if="stepper" data-testid="pager-position" class="px-1 font-mono text-sm tabular-nums">{{
      position
    }}</span>
    <template v-for="(slot, index) in slots" v-else :key="index">
      <span v-if="slot === 'gap'" aria-hidden="true" class="px-1 text-muted">…</span>
      <RouterLink v-else v-slot="{ href, navigate }" custom :to="linkTo(slot)">
        <a
          :href="href"
          :aria-current="slot === meta.page ? 'page' : undefined"
          :class="[
            CELL,
            slot === meta.page ? 'bg-accent-soft text-accent-soft-text' : 'hover:bg-surface-hover',
          ]"
          @click="navigate"
        >
          {{ slot }}
        </a>
      </RouterLink>
    </template>
    <RouterLink v-if="hasNext" v-slot="{ href, navigate }" custom :to="linkTo(meta.page + 1)">
      <a :href="href" :aria-label="$t('pager.next')" :class="ARROW" @click="navigate">
        <ChevronRight aria-hidden="true" class="size-4" />
      </a>
    </RouterLink>
    <span v-else role="link" :aria-label="$t('pager.next')" aria-disabled="true" :class="ARROW">
      <ChevronRight aria-hidden="true" class="size-4" />
    </span>
  </nav>
</template>
