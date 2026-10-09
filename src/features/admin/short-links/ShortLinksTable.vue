<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import type { ShortLink } from '@/api/types/short-links';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** Keep `ShortLinksTableSkeleton.vue` in step (same card, row height). Below md only code, target, visits and the action show. */
defineProps<{ links: ShortLink[] }>();
defineEmits<{ remove: [link: ShortLink] }>();
const locale = useLocaleStore();
const CELL = 'px-3 py-2 align-middle';
const WIDE = 'hidden md:table-cell';
const isExpired = (link: ShortLink) =>
  link.expiresAt !== null && new Date(link.expiresAt).getTime() < Date.now();
const dateOrDash = (value: string | null) => (value ? formatDateTime(value, locale.locale) : '—');
</script>

<template>
  <div
    id="short-links-table"
    data-testid="short-links-table"
    tabindex="0"
    role="region"
    :aria-label="$t('admin.shortlinks.table.region')"
    class="glass overflow-x-auto rounded-card focus-visible:-outline-offset-2"
  >
    <table class="w-full border-collapse text-sm">
      <caption class="sr-only">
        {{
          $t('admin.shortlinks.table.caption')
        }}
      </caption>
      <thead>
        <tr class="text-left text-[13px] text-muted">
          <th scope="col" :class="CELL">{{ $t('admin.shortlinks.table.code') }}</th>
          <th scope="col" :class="CELL">{{ $t('admin.shortlinks.table.path') }}</th>
          <th scope="col" :class="[CELL, WIDE]">{{ $t('admin.shortlinks.table.kind') }}</th>
          <th scope="col" :class="[CELL, 'text-right']">
            {{ $t('admin.shortlinks.table.hits') }}
          </th>
          <th scope="col" :class="[CELL, WIDE]">{{ $t('admin.shortlinks.table.lastHit') }}</th>
          <th scope="col" :class="[CELL, WIDE]">{{ $t('admin.shortlinks.table.expires') }}</th>
          <th scope="col" :class="CELL">
            <span class="sr-only">{{ $t('admin.shortlinks.table.actions') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="link in links"
          :key="link.code"
          :data-code="link.code"
          class="border-t border-line"
        >
          <td :class="[CELL, 'font-mono font-semibold']">/s/{{ link.code }}</td>
          <td :class="[CELL, 'max-w-48 truncate font-mono']">
            <RouterLink :to="link.path" class="text-accent-text hover:underline">{{
              link.path
            }}</RouterLink>
          </td>
          <td :class="[CELL, WIDE]">
            {{ $t(link.isAuto ? 'admin.shortlinks.table.auto' : 'admin.shortlinks.table.chosen') }}
          </td>
          <td :class="[CELL, 'text-right font-mono tabular-nums']">
            {{ formatNumber(link.hits, locale.locale) }}
          </td>
          <td :class="[CELL, WIDE, 'whitespace-nowrap text-muted']">
            {{ dateOrDash(link.lastHitAt) }}
          </td>
          <td :class="[CELL, WIDE, 'whitespace-nowrap']">
            <span v-if="isExpired(link)" class="font-semibold text-negative">{{
              $t('admin.shortlinks.table.expired')
            }}</span>
            <template v-else>{{
              link.expiresAt ? dateOrDash(link.expiresAt) : $t('admin.shortlinks.table.never')
            }}</template>
          </td>
          <td :class="CELL">
            <button
              type="button"
              class="inline-flex size-11 items-center justify-center rounded-pill border border-line text-negative hover:bg-surface-hover"
              :aria-label="$t('admin.shortlinks.table.deleteLabel', { code: link.code })"
              @click="$emit('remove', link)"
            >
              <Trash2 aria-hidden="true" class="size-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
