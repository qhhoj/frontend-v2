<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { BULK_HIDE_MAX } from '@/api/types/comments';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { adminRouteName } from '../admin-screens';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import AdminCommentCard from './AdminCommentCard.vue';
import CommentFiltersForm from './CommentFiltersForm.vue';
import { apiQueryOf, filtersFromQuery, queryOfFilters } from './admin-comments';
import type { CommentFilters } from './admin-comments';
import { useAdminCommentsQuery, useBulkHide } from './admin-comments.queries';

/** Legacy `CommentAdmin`: every comment of the site (`judge.change_comment`), searched and hidden or shown in bulk. */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const filters = computed(() => filtersFromQuery(route.query));
const { data, isPending, error, refetch } = useAdminCommentsQuery(() => apiQueryOf(route.query));
const items = computed(() => data.value?.items ?? []);
const selectable = computed(() => items.value.filter((item) => !item.comment.deleted));
const selected = ref(new Set<string>());
watch(items, () => (selected.value = new Set()));

const bulk = useBulkHide();
/** The last bulk run: how many were changed, and each refused id with the reason code. */
const outcome = ref<{ hidden: boolean; done: number; refused: Map<string, string> } | null>(null);

const allSelected = computed(
  () => selectable.value.length > 0 && selected.value.size === selectable.value.length,
);
function toggleAll() {
  selected.value = allSelected.value
    ? new Set()
    : new Set(selectable.value.slice(0, BULK_HIDE_MAX).map((item) => item.comment.id));
}
function setSelected(id: string, isOn: boolean) {
  const next = new Set(selected.value);
  if (isOn) next.add(id);
  else next.delete(id);
  selected.value = next;
}

function applyFilters(next: CommentFilters) {
  void router.push({ name: adminRouteName('comments'), query: queryOfFilters(next) });
}

async function setHidden(ids: string[], hidden: boolean) {
  outcome.value = null;
  const results = await bulk.run({ ids, hidden });
  if (!results) return;
  const refused = new Map(results.filter((row) => row.code).map((row) => [row.id, row.code!]));
  outcome.value = { hidden, done: results.length - refused.size, refused };
}
/** A refused comment's reason, on its card: a hidden parent (409), else gone or unreadable (404). */
const refusalOf = (id: string) => {
  const code = outcome.value?.refused.get(id);
  if (!code) return null;
  return t(
    code === 'conflict'
      ? 'admin.comments.all.refused.parentHidden'
      : 'admin.comments.all.refused.gone',
  );
};
</script>

<template>
  <div class="mx-auto flex max-w-[1080px] flex-col gap-6">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.comments.crumbs.content') },
        { label: $t('admin.comments.all.crumb') },
      ]"
      :title="$t('admin.comments.all.title')"
      :lead="$t('admin.comments.all.lead')"
    >
      <template #actions>
        <RouterLink :to="{ name: adminRouteName('commentReports') }" :class="ADMIN_BUTTON_CLASS">
          {{ $t('admin.comments.all.reportsLink') }}
        </RouterLink>
      </template>
    </AdminPageHeader>

    <CommentFiltersForm :filters="filters" @apply="applyFilters" />

    <div
      class="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-panel border border-line bg-surface-solid p-3 shadow-lg"
      role="group"
      :aria-label="$t('admin.comments.all.bulk.label')"
    >
      <label class="inline-flex min-h-11 items-center gap-2 font-semibold">
        <input
          type="checkbox"
          class="size-5 accent-[var(--qh-accent)]"
          :checked="allSelected"
          :disabled="selectable.length === 0"
          @change="toggleAll"
        />
        {{ $t('admin.comments.all.bulk.selectPage') }}
      </label>
      <span class="text-sm text-muted" aria-live="polite">
        {{ $t('admin.comments.all.bulk.count', { count: selected.size }, selected.size) }}
      </span>
      <div class="ml-auto flex flex-wrap gap-2">
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-disabled="selected.size === 0 || bulk.isPending.value || undefined"
          @click="selected.size && !bulk.isPending.value && setHidden([...selected], true)"
        >
          {{ $t('admin.comments.all.bulk.hide') }}
        </button>
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-disabled="selected.size === 0 || bulk.isPending.value || undefined"
          @click="selected.size && !bulk.isPending.value && setHidden([...selected], false)"
        >
          {{ $t('admin.comments.all.bulk.show') }}
        </button>
      </div>
    </div>

    <AdminStatus
      v-if="outcome"
      :kind="outcome.refused.size ? 'refused' : 'done'"
      :text="
        $t(
          outcome.hidden ? 'admin.comments.all.result.hidden' : 'admin.comments.all.result.shown',
          { done: outcome.done, refused: outcome.refused.size },
        )
      "
    />
    <AdminStatus
      v-if="bulk.failure.value"
      kind="refused"
      :text="failureTextOf(bulk.failure.value)"
    />

    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-48 w-full" /></template>
      <GlassCard v-if="items.length === 0" as="div">
        <EmptyState>{{ $t('admin.comments.all.empty') }}</EmptyState>
      </GlassCard>
      <ol v-else class="flex flex-col gap-3">
        <li v-for="item in items" :key="item.comment.id">
          <AdminCommentCard
            :item="item"
            :selected="selected.has(item.comment.id)"
            :busy="bulk.isPending.value"
            :refusal="refusalOf(item.comment.id)"
            @update:selected="setSelected(item.comment.id, $event)"
            @set-hidden="setHidden([item.comment.id], $event)"
          />
        </li>
      </ol>
      <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.comments.all.pager')" />
    </QueryState>
  </div>
</template>
