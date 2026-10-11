<script setup lang="ts">
import { computed, ref } from 'vue';
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
import AdminBulkBar from '../ui/AdminBulkBar.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { useSelection } from '../ui/use-selection';
import AdminCommentCard from './AdminCommentCard.vue';
import CommentEditDialog from './CommentEditDialog.vue';
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
const selection = useSelection(
  () => items.value.filter((item) => !item.comment.deleted).map((item) => item.comment.id),
  BULK_HIDE_MAX,
);
const { selected } = selection;

const bulk = useBulkHide();
/** The last bulk run: how many were changed, and each refused id with the reason code. */
const outcome = ref<{ hidden: boolean; done: number; refused: Map<string, string> } | null>(null);

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
const editingId = ref<string | null>(null);
const isEditOpen = ref(false);
const isEdited = ref(false);
function openEdit(id: string) {
  isEdited.value = false;
  editingId.value = id;
  isEditOpen.value = true;
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
  <div class="mx-auto flex w-full max-w-[1080px] flex-col gap-6">
    <AdminPageHeader :title="$t('admin.comments.all.title')" :lead="$t('admin.comments.all.lead')">
      <template #actions>
        <RouterLink :to="{ name: adminRouteName('commentReports') }" :class="ADMIN_BUTTON_CLASS">
          {{ $t('admin.comments.all.reportsLink') }}
        </RouterLink>
      </template>
    </AdminPageHeader>

    <CommentFiltersForm :filters="filters" @apply="applyFilters" />

    <AdminBulkBar
      :label="$t('admin.comments.all.bulk.label')"
      :count-text="$t('admin.comments.all.bulk.count', { count: selected.size }, selected.size)"
      :all-selected="selection.allSelected.value"
      :can-select="items.some((item) => !item.comment.deleted)"
      @toggle-all="selection.toggleAll()"
    >
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
    </AdminBulkBar>

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
    <AdminStatus v-if="isEdited" kind="done" :text="$t('admin.comments.edit.done')" />
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
            @update:selected="selection.setSelected(item.comment.id, $event)"
            @set-hidden="setHidden([item.comment.id], $event)"
            @edit="openEdit(item.comment.id)"
          />
        </li>
      </ol>
      <NumberedPager v-if="data" :meta="data.meta" :label="$t('admin.comments.all.pager')" />
    </QueryState>
    <CommentEditDialog
      v-model:visible="isEditOpen"
      :comment-id="editingId"
      @saved="isEdited = true"
    />
  </div>
</template>
