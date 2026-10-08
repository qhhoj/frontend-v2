<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { SimilarityGroup } from '@/api/types/similarity';

defineProps<{ groups: SimilarityGroup[] }>();

const { t } = useI18n();
const locale = useLocaleStore();
const count = (value: number) => formatNumber(value, locale.locale);
const yesNo = (flag: boolean) =>
  t(flag ? 'admin.similarity.groups.yes' : 'admin.similarity.groups.no');
const pairsOf = (group: SimilarityGroup) =>
  group.failed ? t('admin.similarity.groups.failed') : count(group.pairCount);
</script>

<template>
  <div
    class="overflow-x-auto"
    role="region"
    tabindex="0"
    :aria-label="$t('admin.similarity.groups.label')"
  >
    <table class="w-full min-w-[640px] text-sm">
      <thead class="text-left text-muted">
        <tr>
          <th scope="col" class="p-2">{{ $t('admin.similarity.groups.problem') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.similarity.groups.family') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.similarity.groups.tokenizer') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.similarity.groups.submissions') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.similarity.groups.compared') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.similarity.groups.skipped') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.similarity.groups.truncated') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.similarity.groups.pairs') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="group in groups"
          :key="`${group.problemId}-${group.language}`"
          class="border-t border-line"
        >
          <td class="p-2 font-mono">{{ group.problemCode }}</td>
          <td class="p-2 font-mono">{{ group.language }}</td>
          <td class="p-2">{{ group.tokenizer }}</td>
          <td class="p-2">{{ count(group.submissionCount) }}</td>
          <td class="p-2">{{ count(group.comparedCount) }}</td>
          <td class="p-2">{{ count(group.skippedEmpty) }} / {{ count(group.skippedTooLarge) }}</td>
          <td class="p-2">{{ yesNo(group.truncated) }}</td>
          <td class="p-2">{{ pairsOf(group) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
