<script setup lang="ts">
import { computed } from 'vue';
import type { Ghost } from '@/api/types/contest-ghosts';
import { ghostStatusKey, PREVIEW_ROW_LIMIT } from './ghost-import';

/** A ghost set as rows: label, caption, filled cells, status (ranked or why not). */
const props = defineProps<{ ghosts: Ghost[]; label: string }>();
const shown = computed(() => props.ghosts.slice(0, PREVIEW_ROW_LIMIT));
</script>

<template>
  <div class="overflow-x-auto" tabindex="0" role="region" :aria-label="label">
    <table class="w-full min-w-[440px] text-sm">
      <thead class="text-left text-muted">
        <tr>
          <th scope="col" class="px-2 py-2">{{ $t('admin.ghosts.preview.columns.label') }}</th>
          <th scope="col" class="px-2 py-2">{{ $t('admin.ghosts.preview.columns.caption') }}</th>
          <th scope="col" class="px-2 py-2">{{ $t('admin.ghosts.preview.columns.cells') }}</th>
          <th scope="col" class="px-2 py-2">{{ $t('admin.ghosts.preview.columns.status') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ghost in shown" :key="ghost.label" class="border-t border-line">
          <td class="px-2 py-2 font-semibold">{{ ghost.label }}</td>
          <td class="px-2 py-2">{{ ghost.caption }}</td>
          <td class="px-2 py-2 font-mono">{{ ghost.cells.length }}</td>
          <td class="px-2 py-2" :class="ghost.isUnranked && 'text-muted'">
            {{ $t(ghostStatusKey(ghost)) }}
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="ghosts.length > shown.length" class="px-2 pt-2 text-sm text-muted">
      {{ $t('admin.ghosts.preview.more', { shown: shown.length, count: ghosts.length }) }}
    </p>
  </div>
</template>
