<script setup lang="ts">
import type { PublishedProblem } from '@/api/types/contest-ops';
import { editorialKey, outcomeKey, reasonKey } from './publish-outcomes';

defineProps<{ items: readonly PublishedProblem[] }>();
</script>

<template>
  <div>
    <table class="w-full text-sm">
      <caption class="sr-only">
        {{
          $t('admin.contestPublish.tableCaption')
        }}
      </caption>
      <thead class="text-left text-muted">
        <tr>
          <th scope="col" class="px-2 py-2">{{ $t('admin.contestPublish.columns.problem') }}</th>
          <th scope="col" class="px-2 py-2">{{ $t('admin.contestPublish.columns.outcome') }}</th>
          <th scope="col" class="hidden px-2 py-2 sm:table-cell">
            {{ $t('admin.contestPublish.columns.editorial') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in items"
          :key="item.problemId"
          data-testid="publish-row"
          class="border-t border-line"
        >
          <td class="px-2 py-2 font-mono">
            {{ item.code ?? $t('admin.contestPublish.privateProblem') }}
          </td>
          <td class="px-2 py-2">
            {{ $t(outcomeKey(item)) }}
            <span v-if="reasonKey(item)" class="block text-muted">{{ $t(reasonKey(item)!) }}</span>
          </td>
          <td class="hidden px-2 py-2 sm:table-cell">
            {{ editorialKey(item) ? $t(editorialKey(item)!) : '—' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
