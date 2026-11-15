<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import PageLayout from '@/components/ui/PageLayout.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionList from './list/SubmissionList.vue';
import { GLOBAL_SCOPE } from './list/submission-scope';
import { useMineByDefault } from './list/use-mine-by-default';
import { useSubmissionStatsQuery } from './submissions.queries';

const { isDeciding } = useMineByDefault();
const locale = useLocaleStore();
const { data: stats } = useSubmissionStatsQuery();
</script>

<template>
  <PageLayout>
    <template #header>
      <PageHeader :title="$t('submissions.title')">
        <template #meta>
          <!-- The one judge figure; the full status is on the judges page. -->
          <RouterLink
            v-if="stats"
            :to="{ name: 'runtimes' }"
            data-testid="judge-status"
            class="inline-flex items-center gap-1.5 hover:text-content hover:underline"
          >
            <span
              aria-hidden="true"
              class="size-2 rounded-pill"
              :class="stats.judgesOnline > 0 ? 'bg-positive' : 'bg-negative'"
            />
            <span class="font-mono tabular-nums"
              >{{ formatNumber(stats.judgesOnline, locale.locale) }}/{{
                formatNumber(stats.judgesTotal, locale.locale)
              }}</span
            >
            {{ $t('submissions.stats.judges') }}
          </RouterLink>
        </template>
      </PageHeader>
    </template>
    <SubmissionList :scope="GLOBAL_SCOPE" :enabled="!isDeciding" />
  </PageLayout>
</template>
