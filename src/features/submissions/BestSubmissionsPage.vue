<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import { useProblemQuery } from '@/features/problems/problems.queries';
import { pageFromQuery } from '@/lib/paging';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionTable from './SubmissionTable.vue';
import SubmissionTableSkeleton from './SubmissionTableSkeleton.vue';
import { SUBMISSION_PAGE_SIZE, useBestSubmissionsQuery } from './submissions.queries';

/** A problem's best submissions: each user's best one, ranked (points, time, memory, earliest), `?page=` paged. */
const route = useRoute();
const { t } = useI18n();
const locale = useLocaleStore();
const code = computed(() => String(route.params.code));
const page = computed(() => pageFromQuery(route.query.page));
const { data: problem } = useProblemQuery(
  code,
  computed(() => locale.locale),
);
const { data: list, isPending, error, refetch } = useBestSubmissionsQuery(code, page);
const rankStart = computed(() => ((list.value?.meta.page ?? 1) - 1) * SUBMISSION_PAGE_SIZE + 1);
usePageTitle(() =>
  problem.value ? `${t('submissions.best.title')} · ${problem.value.name}` : null,
);
</script>

<template>
  <div class="page-column">
    <header class="flex flex-col gap-1">
      <RouterLink
        :to="{ name: 'problem', params: { code } }"
        class="inline-flex min-h-11 items-center gap-1.5 self-start text-sm text-accent-text hover:underline"
      >
        <ArrowLeft aria-hidden="true" class="size-4" />{{ problem?.name ?? code }}
      </RouterLink>
      <h1 class="page-title">{{ $t('submissions.best.title') }}</h1>
      <p class="text-muted">{{ $t('submissions.best.lead') }}</p>
    </header>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SubmissionTableSkeleton :show-problem="false" /></template>
      <GlassCard v-if="!list?.items.length" as="div">
        <EmptyState>{{ $t('submissions.best.empty') }}</EmptyState>
      </GlassCard>
      <template v-else>
        <SubmissionTable :submissions="list.items" :show-problem="false" :rank-start="rankStart" />
        <NumberedPager :meta="list.meta" :label="$t('submissions.best.pager')" />
      </template>
    </QueryState>
  </div>
</template>
