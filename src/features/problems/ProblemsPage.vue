<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import CreateShortcut from '@/features/admin/creation/CreateShortcut.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import { useUserPageQuery } from '@/features/users/users.queries';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { lastPageOf } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ProblemFilterChips from './ProblemFilterChips.vue';
import ProblemFilters from './ProblemFilters.vue';
import ProblemTable from './ProblemTable.vue';
import ProblemTableSkeleton from './ProblemTableSkeleton.vue';
import { filterChips } from './problem-filter-chips';
import { useProblemListQuery, useProblemMetaQuery } from './problems.queries';
import { useProblemFilters } from './use-problem-filters';

const router = useRouter();
const { filters, page, update, clearAll } = useProblemFilters();
const locale = useLocaleStore();
const session = useSessionStore();
const lang = computed(() => locale.locale);
const { data: meta } = useProblemMetaQuery();
const { data, isPending, error, refetch, isPlaceholderData } = useProblemListQuery(
  filters,
  lang,
  page,
);
const { data: viewer } = useUserPageQuery(() => session.user?.username ?? '');
const chips = computed(() =>
  filterChips(filters.value, { types: meta.value?.types ?? [], groups: meta.value?.groups ?? [] }),
);

const problems = computed(() => data.value?.items ?? []);

/** A page past the end (a stale link, a shrunk list) or an unusable `?page=` is replaced by the nearest valid one. */
watch([data, isPlaceholderData, () => router.currentRoute.value.query.page], () => {
  if (!data.value || isPlaceholderData.value) return;
  const target = Math.min(page.value, lastPageOf(data.value.meta));
  const { page: raw, ...kept } = router.currentRoute.value.query;
  const canonical = target === 1 ? undefined : String(target);
  if (raw !== canonical)
    void router.replace({ query: canonical ? { ...kept, page: canonical } : kept });
});

/** Another page is a new list: bring its top (not the rail's) into view, below the shell's header. */
const listTop = ref<HTMLElement | null>(null);
watch(page, () => listTop.value?.scrollIntoView({ block: 'start' }), { flush: 'post' });

/** Filtered: how many match. Otherwise the signed-in viewer's progress; anonymous visitors get nothing. */
const summary = computed(() => {
  if (chips.value.length) {
    const total = data.value?.meta.total;
    if (total === undefined) return '';
    return translate('problems.results', { n: formatNumber(total, locale.locale) }, total);
  }
  if (!viewer.value) return '';
  return translate('problems.solvedCount', {
    solved: formatNumber(viewer.value.problemCount, locale.locale),
  });
});
</script>

<template>
  <div class="page-column">
    <header class="flex flex-wrap items-baseline gap-x-3">
      <h1 class="page-title">{{ $t('problems.title') }}</h1>
      <p class="min-h-6 text-sm text-muted">{{ summary }}</p>
      <CreateShortcut kind="problem" class="ml-auto self-center" />
    </header>
    <ProblemFilters
      :filters="filters"
      :types="meta?.types ?? []"
      :groups="meta?.groups ?? []"
      :signed-in="session.user !== null"
      @update="update"
    />
    <ProblemFilterChips :chips="chips" @remove="update" @clear-all="clearAll" />
    <div ref="listTop" class="scroll-mt-20" :aria-busy="isPlaceholderData">
      <GlassCard as="div" class="overflow-hidden">
        <QueryState :loading="isPending" :error="error" @retry="refetch()">
          <template #skeleton><ProblemTableSkeleton /></template>
          <EmptyState v-if="!problems.length">{{ $t('problems.empty') }}</EmptyState>
          <ProblemTable
            v-else
            :problems="problems"
            :sort="filters.sort"
            :signed-in="session.user !== null"
            @sort="update({ sort: $event })"
          />
          <NumberedPager v-if="data" class="p-4" :meta="data.meta" :label="$t('problems.pager')" />
        </QueryState>
      </GlassCard>
    </div>
  </div>
</template>
