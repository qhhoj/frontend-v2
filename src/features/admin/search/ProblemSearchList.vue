<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { valuesOf } from '@/features/problems/use-problem-filters';
import { formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import HighlightedText from './HighlightedText.vue';
import IndexSearchBox from './IndexSearchBox.vue';
import { SEARCH_MAX_LENGTH, searchQueryOf } from './index-search';
import { useAdminProblemSearchQuery } from './index-search.queries';

const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const search = computed(() => (valuesOf(route.query.q)[0] ?? '').slice(0, SEARCH_MAX_LENGTH));
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useAdminProblemSearchQuery(search, page);
const commit = (text: string) =>
  void router.replace({ query: searchQueryOf(route.query, { q: text }) });

const shownText = computed(() => formatNumber(data.value?.items.length ?? 0, locale.locale));
const totalText = computed(() => formatNumber(data.value?.meta.total ?? 0, locale.locale));
const { t } = useI18n();
const countText = computed(() => {
  const values = {
    shown: shownText.value,
    total: totalText.value,
    q: search.value,
  };
  if (!search.value) return t('admin.search.problems.count', values);
  return t('admin.search.problems.countFor', values);
});
</script>

<template>
  <section
    class="glass flex min-w-0 flex-col gap-4 rounded-panel p-5"
    aria-labelledby="problem-search-title"
  >
    <h2 id="problem-search-title" class="font-display text-xl font-semibold">
      {{ $t('admin.search.problems.title') }}
    </h2>
    <IndexSearchBox
      :value="search"
      :label="$t('admin.search.problems.label')"
      :placeholder="$t('admin.search.problems.placeholder')"
      :clear-label="$t('admin.search.clear')"
      :hint="$t('admin.search.problems.hint')"
      :status="data ? countText : ''"
      @commit="commit"
    />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock
          data-skeleton-region="problem-search-table"
          class="h-[17.25rem] w-full rounded-row sm:h-[15rem]"
        />
      </template>
      <EmptyState v-if="data && data.items.length === 0" compact>
        <strong>
          {{
            search
              ? $t('admin.search.problems.emptyFor', { q: search })
              : $t('admin.search.problems.empty')
          }}
        </strong>
        <span>{{ $t('admin.search.problems.emptyAdvice') }}</span>
      </EmptyState>
      <div v-else-if="data" class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            {{
              $t('admin.search.problems.title')
            }}
          </caption>
          <thead class="text-xs text-muted uppercase">
            <tr>
              <th scope="col" class="px-3 py-2">
                {{ $t('admin.search.problems.columns.problem') }}
              </th>
              <th scope="col" class="px-3 py-2">
                {{ $t('admin.search.problems.columns.points') }}
              </th>
              <th scope="col" class="px-3 py-2">
                <span class="sr-only">{{ $t('admin.search.edit') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="problem in data.items" :key="problem.id" class="border-t border-line">
              <td class="px-3 py-3">
                <RouterLink
                  :to="{ name: 'admin-problemGeneral', params: { code: problem.code } }"
                  class="font-semibold text-accent hover:underline"
                >
                  <HighlightedText :text="problem.name" :query="search" />
                </RouterLink>
                <div class="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
                  <HighlightedText :text="problem.code" :query="search" />
                  <span
                    v-if="!problem.isPublic"
                    class="rounded-pill border border-line px-2 py-0.5 font-sans"
                    >{{ $t('admin.search.problems.private') }}</span
                  >
                </div>
              </td>
              <td class="px-3 py-3 font-mono">{{ formatNumber(problem.points, locale.locale) }}</td>
              <td class="px-3 py-3 text-right">
                <RouterLink
                  :to="{ name: 'admin-problemGeneral', params: { code: problem.code } }"
                  :class="ADMIN_BUTTON_CLASS"
                  >{{ $t('admin.search.edit') }}</RouterLink
                >
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
          <p class="text-sm text-muted">{{ countText }}</p>
          <NumberedPager :meta="data.meta" :label="$t('admin.search.pager')" />
        </div>
      </div>
    </QueryState>
  </section>
</template>
