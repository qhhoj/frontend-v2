<script setup lang="ts">
import ProgressBar from '@/components/ui/ProgressBar.vue';
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import type { ContestLanguageStats } from '@/api/types/contests';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { formatPercent, languageShare } from './stats-summary';

const props = defineProps<{ languages: ContestLanguageStats[] }>();
const locale = useLocaleStore();
/** Each language with its share of all submissions, computed once per row. */
const rows = computed(() =>
  props.languages.map((language) => ({
    language,
    share: languageShare(language, props.languages),
  })),
);
const count = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <section class="flex flex-col gap-2">
    <h2 class="font-display text-section leading-7 font-bold">
      {{ $t('contests.stats.languageTitle') }}
    </h2>
    <Card
      as="div"
      tabindex="0"
      role="region"
      :aria-label="$t('contests.stats.region')"
      class="overflow-x-auto focus-visible:-outline-offset-2"
    >
      <table data-testid="language-stats" class="w-full min-w-[480px] border-collapse">
        <thead>
          <tr class="text-left text-meta text-muted">
            <th scope="col" class="px-4 py-3 font-medium">
              {{ $t('contests.stats.columns.language') }}
            </th>
            <th scope="col" class="px-4 py-3 font-medium">
              {{ $t('contests.stats.columns.share') }}
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              {{ $t('contests.stats.columns.count') }}
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              {{ $t('contests.stats.columns.ac') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="{ language, share } in rows"
            :key="language.languageId"
            class="border-t border-line"
          >
            <th scope="row" class="px-4 py-3 text-left font-semibold">{{ language.name }}</th>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <ProgressBar :value="share" :max="1" :label="language.name" class="flex-1" />
                <span class="w-16 text-right font-mono text-sm">
                  {{ formatPercent(share * 100, locale.locale) }}
                </span>
              </div>
            </td>
            <td class="px-4 py-3 text-right font-mono">{{ count(language.count) }}</td>
            <td class="px-4 py-3 text-right font-mono font-semibold">
              {{ formatPercent(language.acRate, locale.locale) }}
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  </section>
</template>
