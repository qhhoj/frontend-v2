<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useRecentSubmissionsQuery } from './home.queries';

/** The five newest submissions of the viewer, one dense row each; the query is shared with "Tiếp tục", so it is one request. */
const VISIBLE = 5;
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
  <Card data-testid="recent-submissions" padding="lg" :title="$t('home.recentSubmissions')">
    <template #actions>
      <SeeAllLink :to="{ name: 'submissions', query: { user: username } }">{{
        $t('common.viewAll')
      }}</SeeAllLink>
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <ul class="flex flex-col divide-y divide-line">
          <li v-for="row in VISIBLE" :key="row" class="flex items-center gap-3 py-2">
            <SkeletonBlock round class="size-7 shrink-0" />
            <span class="min-w-0 flex-1"><SkeletonBlock text class="w-2/3" /></span>
            <SkeletonBlock text class="w-16" />
          </li>
        </ul>
      </template>
      <EmptyState v-if="!visible.length" compact class="justify-center">{{
        $t('home.noSubmissions')
      }}</EmptyState>
      <ul v-else class="flex flex-col divide-y divide-line">
        <li v-for="item in visible" :key="item.id">
          <RouterLink
            :to="{ name: 'submission', params: { id: item.id } }"
            class="flex items-center gap-3 py-2 text-content hover:bg-surface-hover touch:py-3"
          >
            <VerdictChip :verdict="submissionVerdictOf(item)" />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold">{{ item.problem?.name ?? '—' }}</span>
              <span class="flex min-w-0 items-center gap-1 text-meta text-muted"
                >{{ $t(submissionVerdictOf(item).labelKey) }} ·
                <LanguageLabel v-if="item.language" :language="item.language" /><template v-else
                  >—</template
                ></span
              >
            </span>
            <span class="shrink-0 text-right font-mono text-meta text-muted">
              {{ formatRelative(item.date, now, locale.locale) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </QueryState>
  </Card>
</template>
