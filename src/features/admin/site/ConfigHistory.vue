<script setup lang="ts">
import { ref } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { BUTTON } from '../ui/controls';
import { useConfigHistoryQuery } from './config-history.queries';

/** One key's changes, newest first: who, when, and the value before and after (also for a deleted key). */
const props = defineProps<{ configKey: string }>();
const page = ref(1);
const locale = useLocaleStore();
const { data, isPending, error, refetch } = useConfigHistoryQuery(() => props.configKey, page);
const valueOf = (change: unknown) => (typeof change === 'string' ? change : null);
const hasMore = () =>
  data.value ? page.value * data.value.meta.pageSize < data.value.meta.total : false;
</script>

<template>
  <section class="flex flex-col gap-3" :aria-label="$t('admin.site.config.history.title')">
    <h3 class="font-display text-base font-bold">{{ $t('admin.site.config.history.title') }}</h3>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-24 w-full" /></template>
      <p v-if="!data?.items.length" class="text-sm text-muted">
        {{ $t('admin.site.config.history.empty') }}
      </p>
      <ol v-else class="flex flex-col gap-3">
        <li
          v-for="revision in data.items"
          :key="revision.id"
          class="flex flex-col gap-1.5 rounded-row border border-line p-3 text-sm"
        >
          <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="font-semibold">{{
              $t(`admin.site.config.history.actions.${revision.action}`)
            }}</span>
            <AdminUserLabel
              v-if="revision.editor"
              :username="revision.editor.username"
              :rating="revision.editor.rating"
            />
            <span class="text-muted">{{ formatDate(revision.at, 'datetime', locale.locale) }}</span>
          </p>
          <template v-for="side in ['before', 'after'] as const" :key="side">
            <div
              v-if="valueOf(revision.changes.value?.[side]) !== null"
              class="flex flex-col gap-0.5"
            >
              <span class="text-xs font-semibold text-muted">{{
                $t(`admin.site.config.history.${side}`)
              }}</span>
              <pre
                class="max-h-32 overflow-auto rounded-row bg-surface-strong px-2 py-1 font-mono text-xs break-words whitespace-pre-wrap"
                >{{
                  valueOf(revision.changes.value?.[side]) ||
                  $t('admin.site.config.history.emptyValue')
                }}</pre>
            </div>
          </template>
        </li>
      </ol>
      <div v-if="page > 1 || hasMore()" class="flex gap-2">
        <button v-if="page > 1" type="button" :class="BUTTON.secondary" @click="page -= 1">
          {{ $t('admin.site.config.history.newer') }}
        </button>
        <button v-if="hasMore()" type="button" :class="BUTTON.secondary" @click="page += 1">
          {{ $t('admin.site.config.history.older') }}
        </button>
      </div>
    </QueryState>
  </section>
</template>
