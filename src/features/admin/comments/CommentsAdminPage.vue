<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { COMMENT_PAGE_TYPES } from '@/api/types/comments';
import { adminRouteName } from '../admin-screens';
import AdminField from '../ui/AdminField.vue';
import AdminFilterTabs from '../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../ui/AdminFilterTabs.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { failureTextOf } from '../ui/admin-errors';
import { INPUT, buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import AdminCommentsTable from './AdminCommentsTable.vue';
import CommentEditDialog from './CommentEditDialog.vue';
import { COMMENT_STATES, apiQueryOf, filtersFromQuery, queryOfFilters } from './admin-comments';
import type { CommentFilters } from './admin-comments';
import { useAdminCommentsQuery, useBulkHide } from './admin-comments.queries';

/** Legacy `CommentAdmin`: every comment of the site (`judge.change_comment`), searched and hidden or shown in bulk. */
const { t } = useI18n();
const toast = useAdminToast();
const route = useRoute();
const router = useRouter();
const filters = computed(() => filtersFromQuery(route.query));
const { data, isPending, error, refetch } = useAdminCommentsQuery(() => apiQueryOf(route.query));
const items = computed(() => data.value?.items ?? []);

/** Every filter lives in the URL, so a search can be shared and the back button undoes it; a change starts at page 1. */
function applyFilters(patch: Partial<CommentFilters>) {
  void router.push({
    name: adminRouteName('comments'),
    query: queryOfFilters({ ...filters.value, ...patch }),
  });
}
const searchModel = computed({
  get: () => filters.value.search,
  set: (search: string) => applyFilters({ search }),
});
const stateTabs = computed<AdminFilterTab[]>(() =>
  COMMENT_STATES.map((state) => ({
    key: state,
    label: t(`admin.comments.all.states.${state}`),
    to: {
      name: adminRouteName('comments'),
      query: queryOfFilters({ ...filters.value, state }),
    },
  })),
);
const authorText = ref(filters.value.author);
watch(
  () => filters.value.author,
  (author) => (authorText.value = author),
);
const applyAuthor = () => {
  if (authorText.value.trim() !== filters.value.author) applyFilters({ author: authorText.value });
};
const chips = computed(() => [
  ...(filters.value.author
    ? [
        {
          key: 'author',
          label: t('admin.comments.all.chips.author', { name: filters.value.author }),
        },
      ]
    : []),
  ...(filters.value.pageType
    ? [{ key: 'pageType', label: t(`admin.comments.all.pageTypes.${filters.value.pageType}`) }]
    : []),
]);
const removeChip = (key: string) => applyFilters({ [key]: '' });
const clearFilters = () => applyFilters({ search: '', author: '', pageType: '', state: 'all' });
const isFiltered = computed(() => Object.keys(queryOfFilters(filters.value)).length > 0);

/** Ticked comments of the shown page; a new page or filter starts with none. */
const selected = ref(new Set<string>());
watch(
  () => route.query,
  () => (selected.value = new Set()),
);
const bulk = useBulkHide();
/** Each refused id with the reason code, from the last run. */
const refused = ref(new Map<string, string>());

async function setHidden(ids: string[], hidden: boolean) {
  refused.value = new Map();
  const results = await bulk.run({ ids, hidden });
  if (!results) return;
  refused.value = new Map(results.filter((row) => row.code).map((row) => [row.id, row.code!]));
  const counts = { done: results.length - refused.value.size, refused: refused.value.size };
  toast.show({
    text: t(
      hidden ? 'admin.comments.all.result.hidden' : 'admin.comments.all.result.shown',
      counts,
    ),
    tone: counts.refused ? 'error' : 'success',
  });
  selected.value = new Set();
}
/** A deleted comment has nothing to hide or show: it is left out of a bulk run. */
const selectedLive = () =>
  items.value
    .filter((item) => selected.value.has(item.comment.id) && !item.comment.deleted)
    .map((item) => item.comment.id);
const runBulk = (hidden: boolean) => {
  if (!bulk.isPending.value) void setHidden(selectedLive(), hidden);
};

const editingId = ref<string | null>(null);
const isEditOpen = ref(false);
function openEdit(id: string) {
  editingId.value = id;
  isEditOpen.value = true;
}
const onEdited = () => toast.show({ text: t('admin.comments.edit.done') });

/** A refused comment's reason, on its row: a hidden parent (409), else gone or unreadable (404). */
const refusalOf = (id: string) => {
  const code = refused.value.get(id);
  if (!code) return null;
  return t(
    code === 'conflict'
      ? 'admin.comments.all.refused.parentHidden'
      : 'admin.comments.all.refused.gone',
  );
};
const resultText = computed(() => {
  const meta = data.value?.meta;
  return meta && 'total' in meta ? t('admin.comments.all.total', { count: meta.total }) : undefined;
});
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <AdminPageHeader :title="$t('admin.comments.all.title')" :lead="$t('admin.comments.all.lead')">
      <template #actions>
        <RouterLink :to="{ name: adminRouteName('commentReports') }" :class="buttonClass()">
          {{ $t('admin.comments.all.reportsLink') }}
        </RouterLink>
      </template>
    </AdminPageHeader>

    <AdminFilterBar
      v-model:search="searchModel"
      :search-label="$t('admin.comments.all.filters.searchPlaceholder')"
      :result-text="resultText"
      :chips="chips"
      :filter-count="chips.length"
      @remove="removeChip"
      @clear-all="clearFilters"
    >
      <template #view>
        <AdminFilterTabs
          :tabs="stateTabs"
          :current="filters.state"
          :label="$t('admin.comments.all.filters.state')"
        />
      </template>
      <template #filters>
        <AdminField :label="$t('admin.comments.all.filters.author')" input-id="comments-author">
          <input
            id="comments-author"
            v-model="authorText"
            maxlength="100"
            autocomplete="off"
            :class="INPUT"
            :placeholder="$t('admin.comments.all.filters.authorPlaceholder')"
            @change="applyAuthor"
            @keydown.enter.prevent="applyAuthor"
          />
        </AdminField>
        <AdminField
          :label="$t('admin.comments.all.filters.pageType')"
          input-id="comments-page-type"
        >
          <select
            id="comments-page-type"
            :value="filters.pageType"
            :class="INPUT"
            @change="
              applyFilters({
                pageType: ($event.target as HTMLSelectElement).value as CommentFilters['pageType'],
              })
            "
          >
            <option value="">{{ $t('admin.comments.all.pageTypes.any') }}</option>
            <option v-for="type in COMMENT_PAGE_TYPES" :key="type" :value="type">
              {{ $t(`admin.comments.all.pageTypes.${type}`) }}
            </option>
          </select>
        </AdminField>
      </template>
    </AdminFilterBar>

    <AdminNotice
      v-if="bulk.failure.value"
      tone="danger"
      :title="failureTextOf(bulk.failure.value)"
    />

    <AdminCommentsTable
      v-model:selected="selected"
      :items="items"
      :meta="data?.meta"
      :loading="isPending"
      :error="error"
      :busy="bulk.isPending.value"
      :filtered="isFiltered"
      :refusal-of="refusalOf"
      @retry="refetch()"
      @clear-filters="clearFilters"
      @set-hidden="(id, hidden) => setHidden([id], hidden)"
      @edit="openEdit"
    >
      <template #bulk>
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="bulk.isPending.value || undefined"
          @click="runBulk(true)"
        >
          {{ $t('admin.comments.all.bulk.hide') }}
        </button>
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="bulk.isPending.value || undefined"
          @click="runBulk(false)"
        >
          {{ $t('admin.comments.all.bulk.show') }}
        </button>
      </template>
    </AdminCommentsTable>
    <CommentEditDialog v-model:visible="isEditOpen" :comment-id="editingId" @saved="onEdited" />
  </div>
</template>
