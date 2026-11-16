<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useHomeQuery } from './community.queries';

/** The newest problems; `home` adds the code and date under each name and writes the points out. */
const props = withDefaults(
  defineProps<{ limit: number; variant?: 'rail' | 'home'; embedded?: boolean }>(),
  { variant: 'rail', embedded: false },
);
const locale = useLocaleStore();
const { data: home, isPending, error, refetch } = useHomeQuery();
const problems = computed(() => (home.value?.newProblems ?? []).slice(0, props.limit));
</script>

<template>
  <Card
    :variant="embedded ? 'plain' : 'glass'"
    :padding="embedded ? undefined : 'lg'"
    :title="$t('blog.newProblems')"
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
      <ul class="flex flex-col gap-3">
        <li
          v-for="problem in problems"
          :key="problem.code"
          class="flex items-start justify-between gap-3"
        >
          <div class="flex min-w-0 flex-col">
            <RouterLink
              :to="{ name: 'problem', params: { code: problem.code } }"
              class="font-semibold hover:underline"
            >
              {{ problem.name }}
            </RouterLink>
            <span v-if="variant === 'home'" class="text-caption leading-4 text-muted">
              {{
                $t('blog.problemLine', {
                  code: problem.code,
                  date: formatDate(problem.date, 'short', locale.locale),
                })
              }}
            </span>
          </div>
          <span class="shrink-0 font-mono text-sm tabular-nums text-muted">
            {{
              variant === 'home'
                ? $t('blog.problemPoints', { points: formatNumber(problem.points, locale.locale) })
                : formatNumber(problem.points, locale.locale)
            }}
          </span>
        </li>
      </ul>
    </QueryState>
  </Card>
</template>
