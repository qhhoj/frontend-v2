<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';
import { formatAgo, formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../admin-access';
import { ADMIN_SCREENS, adminRouteName } from '../admin-screens';
import { auditSentence } from './audit-sentence';
import { useRecentChangesQuery } from './audit.queries';
import { useAuditLinkOf } from './use-audit-link';

/**
 * The dashboard's activity feed (P-33): the five newest changes as short sentences ("bitcoder đã sửa bài tập trash_02"),
 * for viewers who may open the change log, where the field names and notes are. An object link is 40 px tall; on a
 * coarse pointer its `::after` reaches 2 px past it, for a 44 px hit area.
 */
const RECENT_LIMIT = 5;
const session = useSessionStore();
const locale = useLocaleStore();
const i18n = useI18n();
const canSeeLog = computed(() => canUseAdmin(session.user, ADMIN_SCREENS.log));
const recent = useRecentChangesQuery(RECENT_LIMIT, canSeeLog);
const entries = computed(() => recent.data.value?.items ?? []);
const textOf = (key: string) => (i18n.te(key) ? i18n.t(key) : null);
const linkOf = useAuditLinkOf();
/** Relative times move on while the dashboard stays open. */
const now = useNow(60_000);
const rows = computed(() =>
  entries.value.map((entry) => ({
    entry,
    sentence: auditSentence(entry, textOf),
    link: linkOf(entry),
  })),
);
</script>

<template>
  <section
    v-if="canSeeLog"
    aria-labelledby="admin-recent-changes-title"
    class="flex min-w-0 flex-col gap-3"
    data-testid="admin-recent-changes"
  >
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id="admin-recent-changes-title" class="font-display text-base font-semibold">
        {{ $t('admin.audit.recent.title') }}
      </h2>
      <RouterLink
        :to="{ name: adminRouteName('log') }"
        class="inline-flex min-h-11 items-center text-sm font-semibold text-accent-text hover:underline"
      >
        {{ $t('admin.audit.recent.all') }}
      </RouterLink>
    </div>
    <QueryState
      :loading="recent.isPending.value"
      :error="recent.error.value"
      @retry="recent.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-56 w-full" /></template>
      <Card
        v-if="rows.length > 0"
        as="ol"
        variant="flat"
        class="m-0 list-none divide-y divide-line overflow-hidden p-0"
      >
        <li
          v-for="{ entry, sentence, link } in rows"
          :key="entry.id"
          data-testid="audit-entry"
          class="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm"
        >
          <i18n-t keypath="admin.audit.sentence" tag="span" class="min-w-0 break-words">
            <template #actor>
              <span class="font-semibold">{{ sentence.actor ?? $t('admin.audit.system') }}</span>
            </template>
            <template #verb>{{ sentence.verb }}</template>
            <template #noun>{{ sentence.noun }}</template>
            <template #object>
              <RouterLink
                v-if="link"
                :to="link"
                class="relative -my-2.5 inline-block py-2.5 font-mono font-semibold text-accent-text hover:underline pointer-coarse:after:absolute pointer-coarse:after:-inset-y-0.5 pointer-coarse:after:inset-x-0"
                >{{ sentence.object }}</RouterLink
              >
              <span v-else class="font-mono" :class="entry.object.deleted && 'line-through'">{{
                sentence.object
              }}</span>
              <span v-if="entry.object.deleted" class="text-meta text-muted">
                ({{ $t('admin.audit.deleted') }})</span
              >
            </template>
          </i18n-t>
          <time
            :datetime="entry.at"
            :title="formatDate(entry.at, 'datetime', locale.locale)"
            class="shrink-0 text-meta text-muted tabular-nums"
          >
            {{ formatAgo(entry.at, now, locale.locale) }}
          </time>
        </li>
      </Card>
      <Card v-else as="p" variant="flat" class="px-4 py-6 text-center text-sm text-muted">
        {{ $t('admin.audit.recent.empty') }}
      </Card>
    </QueryState>
  </section>
</template>
