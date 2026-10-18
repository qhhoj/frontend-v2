<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDate } from '@/lib/format-date';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { CARD } from '../ui/controls';
import { changeLabelOf, changesOf } from './organization-history';
import { useOrganizationHistoryQuery } from './organization-history.queries';

/** Legacy `VersionAdmin` history: who created, edited or removed a member, and what changed. */
const props = defineProps<{ slug: string }>();
const route = useRoute();
const locale = useLocaleStore();
const page = computed(() => pageFromQuery(route.query.history));
const history = useOrganizationHistoryQuery(() => props.slug, page);
const rows = computed(() => history.data.value?.items ?? []);
const ACTION_TONE: Record<string, ChipTone> = {
  create: 'positive',
  edit: 'accent',
  kick: 'negative',
  delete: 'negative',
};
</script>

<template>
  <section
    data-testid="org-history"
    :aria-labelledby="`org-history-${slug}`"
    class="flex min-w-0 flex-col gap-3"
  >
    <header>
      <h3 :id="`org-history-${slug}`" class="font-display text-base font-semibold">
        {{ $t('admin.organizations.history.title') }}
      </h3>
      <p class="m-0 text-sm text-muted">{{ $t('admin.organizations.history.lead') }}</p>
    </header>
    <div :class="[CARD, 'px-4']">
      <QueryState
        :loading="history.isPending.value"
        :error="history.error.value"
        @retry="history.refetch()"
      >
        <template #skeleton><SkeletonBlock class="my-4 h-32 w-full rounded-row" /></template>
        <ol v-if="rows.length > 0" class="flex flex-col divide-y divide-line">
          <li v-for="revision in rows" :key="revision.id" class="flex flex-col gap-2 py-3">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <AdminChip :tone="ACTION_TONE[revision.action]">{{
                $t(`admin.organizations.history.actions.${revision.action}`)
              }}</AdminChip>
              <AdminUserLabel
                v-if="revision.editor"
                :username="revision.editor.username"
                :rating="revision.editor.rating"
              />
              <span v-else class="text-muted">{{
                $t('admin.organizations.history.goneEditor')
              }}</span>
              <time :datetime="revision.at" class="ml-auto font-mono text-xs text-muted">{{
                formatDate(revision.at, 'datetime', locale.locale)
              }}</time>
            </div>
            <dl class="flex flex-col gap-1.5">
              <div
                v-for="change in changesOf(revision)"
                :key="change.field"
                class="grid gap-1 sm:grid-cols-[10rem_1fr]"
              >
                <dt class="text-sm font-semibold">{{ changeLabelOf(change.field) }}</dt>
                <dd class="flex min-w-0 flex-col gap-1">
                  <span
                    v-for="(text, index) in change.removed"
                    :key="`removed-${index}`"
                    class="rounded-row bg-verdict-wa-bg px-2 py-0.5 font-mono text-xs break-words whitespace-pre-wrap text-verdict-wa"
                    >− {{ text }}</span
                  >
                  <span
                    v-for="(text, index) in change.added"
                    :key="`added-${index}`"
                    class="rounded-row bg-verdict-ac-bg px-2 py-0.5 font-mono text-xs break-words whitespace-pre-wrap text-verdict-ac"
                    >+ {{ text }}</span
                  >
                  <span v-if="change.hidden > 0" class="text-xs text-muted">{{
                    $t('admin.organizations.history.moreLines', { n: change.hidden })
                  }}</span>
                </dd>
              </div>
            </dl>
          </li>
        </ol>
        <p v-else class="py-4 text-sm text-muted">
          {{ $t('admin.organizations.history.empty') }}
        </p>
        <NumberedPager
          v-if="history.data.value"
          class="border-t border-line py-2"
          compact
          :meta="history.data.value.meta"
          :label="$t('admin.organizations.history.pager')"
          query-key="history"
        />
      </QueryState>
    </div>
  </section>
</template>
