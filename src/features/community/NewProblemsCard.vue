<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import PageSection from '@/components/ui/PageSection.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useHomeQuery } from './community.queries';

/** The home's newest problems: the code and date after each name (wide screens) and the points; always one line per problem. */
const props = defineProps<{ limit: number }>();
const locale = useLocaleStore();
const { data: home, isPending, error, refetch } = useHomeQuery();
const problems = computed(() => (home.value?.newProblems ?? []).slice(0, props.limit));
</script>

<template>
  <PageSection
    data-testid="new-problems"
    :title="$t('blog.newProblems')"
    :see-all="{ to: { name: 'problems' }, label: $t('common.viewAll') }"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <div v-for="row in 4" :key="row" class="flex flex-col gap-1.5">
            <SkeletonBlock pill class="h-4 w-3/4" />
            <SkeletonBlock pill class="h-3 w-1/3" />
          </div>
        </div>
      </template>
      <ul class="flex flex-col divide-y divide-line">
        <li
          v-for="problem in problems"
          :key="problem.code"
          class="box-link flex items-baseline justify-between gap-3 py-1.5 first:pt-0 last:pb-0"
        >
          <StretchedLink
            :to="{ name: 'problem', params: { code: problem.code } }"
            class="min-w-0 truncate font-semibold"
            >{{ problem.name }}</StretchedLink
          >
          <span class="ml-auto hidden shrink-0 text-caption text-muted sm:inline">
            {{
              $t('blog.problemLine', {
                code: problem.code,
                date: formatDate(problem.date, 'short', locale.locale),
              })
            }}
          </span>
          <span class="shrink-0 font-mono text-sm tabular-nums text-muted">
            {{ $t('blog.problemPoints', { points: formatNumber(problem.points, locale.locale) }) }}
          </span>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>
