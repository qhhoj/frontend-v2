<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import SeeAllLink from '@/components/SeeAllLink.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useRecentSubmissionsQuery } from './home.queries';

/** The three newest submissions, a section of the personal card. */
const VISIBLE = 3;
const props = defineProps<{ username: string }>();
const {
  data: submissions,
  isPending,
  error,
  refetch,
} = useRecentSubmissionsQuery(() => props.username);
const locale = useLocaleStore();
const now = useNow(60_000);
const visible = computed(() => (submissions.value ?? []).slice(0, VISIBLE));
</script>

<template>
  <section data-testid="recent-submissions" class="flex min-w-0 flex-col">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h2 class="text-title leading-5.5 font-semibold">{{ $t('home.recentSubmissions') }}</h2>
      <SeeAllLink :to="{ name: 'submissions', query: { user: username } }">{{
        $t('common.viewAll')
      }}</SeeAllLink>
    </div>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ul class="flex flex-col gap-2">
          <li
            v-for="row in VISIBLE"
            :key="row"
            class="flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-row bg-surface px-3.5 py-3"
          >
            <SkeletonBlock round class="size-10 shrink-0" />
            <span class="min-w-32 flex-1">
              <span class="block font-semibold"><SkeletonBlock text class="w-2/3" /></span>
              <span class="block text-meta"><SkeletonBlock text class="w-1/3" /></span>
            </span>
            <span class="ml-auto font-mono text-meta"><SkeletonBlock text class="w-24" /></span>
          </li>
        </ul>
      </template>

      <EmptyState v-if="!visible.length" compact class="justify-center">{{
        $t('home.noSubmissions')
      }}</EmptyState>
      <ul v-else class="flex flex-col gap-2">
        <li v-for="item in visible" :key="item.id">
          <RouterLink
            :to="{ name: 'submission', params: { id: item.id } }"
            class="flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-row bg-surface px-3.5 py-3 text-content hover:bg-surface-hover"
          >
            <VerdictBadge :verdict="submissionVerdictOf(item)" />
            <span class="min-w-32 flex-1">
              <span class="block truncate font-semibold">{{ item.problem?.name ?? '—' }}</span>
              <span class="flex min-w-0 items-center gap-1 text-meta text-muted"
                >{{ $t(submissionVerdictOf(item).labelKey) }} ·
                <LanguageLabel v-if="item.language" :language="item.language" /><template v-else
                  >—</template
                ></span
              >
            </span>
            <span class="ml-auto text-right font-mono text-meta text-muted">
              {{ item.time !== null ? `${item.time.toFixed(2)}s · ` : ''
              }}{{ formatRelative(item.date, now, locale.locale) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </QueryState>
  </section>
</template>
