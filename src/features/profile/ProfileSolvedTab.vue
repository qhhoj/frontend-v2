<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { SolvedGroup } from '@/api/types/users';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import QueryState from '@/components/QueryState.vue';
import { useSolvedQuery } from '@/features/users/users.queries';
import { useLocaleStore } from '@/stores/locale.store';
import { formatNumber, scoreBelowFull } from '@/lib/format';
import ProfileTabSkeleton from './ProfileTabSkeleton.vue';

/** The problems a user has solved, grouped by tag; each row shows the points earned of the maximum. */
const route = useRoute();
const locale = useLocaleStore();
const username = computed(() => String(route.params.username));
const { data, error, isPending, refetch } = useSolvedQuery(username);
const groups = computed<SolvedGroup[]>(() => data.value?.groups ?? []);
const isFullScore = (points: number, total: number) => points >= total;
</script>

<template>
  <QueryState :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton><ProfileTabSkeleton :rows="3" kind="groups" /></template>
    <Card v-if="!groups.length" as="div">
      <EmptyState>{{ $t('profileTabs.noSolved') }}</EmptyState>
    </Card>
    <div v-else class="flex flex-col gap-4">
      <section
        v-for="(group, index) in groups"
        :key="group.name"
        :aria-labelledby="`solved-group-${index}`"
      >
        <Card as="div" class="flex flex-col gap-3 p-4 sm:p-5">
          <h2 :id="`solved-group-${index}`" class="font-display text-base font-bold">
            {{ group.name }}
            <span class="ml-2 text-sm font-normal text-muted">
              {{
                $t('profileTabs.groupLine', {
                  count: group.problems.length,
                  points: formatNumber(group.points, locale.locale, 1),
                })
              }}
            </span>
          </h2>
          <ul class="flex flex-col divide-y divide-line">
            <li
              v-for="problem in group.problems"
              :key="problem.code"
              class="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <div class="flex min-w-0 flex-col">
                <RouterLink
                  :to="{ name: 'problem', params: { code: problem.code } }"
                  class="font-semibold text-accent-text hover:underline"
                >
                  {{ problem.name }}
                </RouterLink>
                <span class="font-mono text-caption leading-4 text-muted">{{ problem.code }}</span>
              </div>
              <span
                class="rounded-pill px-2.5 py-1 font-mono text-caption leading-4 font-semibold"
                :class="
                  isFullScore(problem.points, problem.total)
                    ? 'bg-verdict-ac-bg text-verdict-ac'
                    : 'bg-partial-bg-2'
                "
              >
                {{
                  formatNumber(scoreBelowFull(problem.points, problem.total, 1), locale.locale, 1)
                }}/{{ formatNumber(problem.total, locale.locale, 1) }}
              </span>
            </li>
          </ul>
        </Card>
      </section>
    </div>
  </QueryState>
</template>
