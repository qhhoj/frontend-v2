<script setup lang="ts">
import { Link2, Pencil, Plus, Trash2 } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { CONTEST_TAG_PAGE_SIZE, deleteContestTag } from '@/api/contest-tags.api';
import type { ContestTag } from '@/api/types/contest-tags';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { CONTEST_TAGS_KEY, useContestTagsQuery } from '@/features/contests/contest-extras.queries';
import { TAG_COLOR_CLASSES } from '@/features/contests/tag-colors';
import { translate } from '@/i18n';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { failureTextOf } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminRowMenu from '../ui/table/AdminRowMenu.vue';
import type { RowMenuItem } from '../ui/table/AdminRowMenu.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { useAdminMutation } from '../ui/use-admin-mutation';
import ContestTagEditor from './ContestTagEditor.vue';
import TagContestsPanel from './TagContestsPanel.vue';

const { t } = useI18n();
const { data: tags, isPending, error, refetch } = useContestTagsQuery();
const rows = computed(() => tags.value ?? []);
const isFull = computed(() => rows.value.length >= CONTEST_TAG_PAGE_SIZE);

/** The tag in the editor drawer; null with the drawer open is a new tag. */
const editing = ref<ContestTag | null>(null);
const isEditorOpen = ref(false);
function openEditor(tag: ContestTag | null) {
  if (!tag && isFull.value) return;
  editing.value = tag;
  isEditorOpen.value = true;
}
/** The tag whose contests the second drawer manages. */
const assigning = ref<ContestTag | null>(null);
const isAssignOpen = ref(false);
function openAssign(tag: ContestTag) {
  assigning.value = tag;
  isAssignOpen.value = true;
}

const removing = ref<ContestTag | null>(null);
const isRemoveOpen = computed({
  get: () => removing.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) removing.value = null;
  },
});
const removal = useAdminMutation({
  mutate: (tag: ContestTag) => deleteContestTag(tag.slug),
  invalidates: () => [CONTEST_TAGS_KEY],
  successText: (_result, tag) => translate('admin.contestTags.removed', { name: tag.name }),
  onDone: () => {
    removing.value = null;
  },
});
function askRemove(tag: ContestTag) {
  removal.reset();
  removing.value = tag;
}

const columns = computed<AdminColumn[]>(() => [
  { key: 'tag', label: t('admin.contestTags.columns.tag'), priority: 'primary' },
  { key: 'slug', label: t('admin.contestTags.columns.slug'), priority: 'secondary' },
  {
    key: 'contestCount',
    label: t('admin.contestTags.columns.contests'),
    priority: 'secondary',
    align: 'end',
  },
  { key: 'order', label: t('admin.contestTags.columns.order'), priority: 'meta', align: 'end' },
  {
    key: 'description',
    label: t('admin.contestTags.columns.description'),
    priority: 'meta',
    cellClass: 'max-w-96 truncate text-muted',
  },
]);
const menuOf = (tag: ContestTag): RowMenuItem[] => [
  { label: t('admin.contestTags.manageContests'), icon: Link2, run: () => openAssign(tag) },
  { label: t('admin.contestTags.remove'), icon: Trash2, danger: true, run: () => askRemove(tag) },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminPageHeader :title="$t('admin.contestTags.title')" :lead="$t('admin.contestTags.lead')">
      <template #actions>
        <button
          type="button"
          data-testid="tag-create"
          :class="buttonClass('primary')"
          :aria-disabled="isFull || undefined"
          :title="isFull ? $t('admin.contestTags.full') : undefined"
          @click="openEditor(null)"
        >
          <Plus aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('admin.contestTags.create') }}
        </button>
      </template>
    </AdminPageHeader>
    <AdminNotice
      v-if="isFull"
      data-testid="tag-catalogue-full"
      tone="caution"
      :title="$t('admin.contestTags.fullTitle')"
      :summary="$t('admin.contestTags.full')"
    />
    <AdminDataTable
      :columns="columns"
      :rows="rows"
      :row-key="(tag: ContestTag) => tag.slug"
      :row-label="(tag: ContestTag) => tag.name"
      :row-attrs="() => ({ 'data-testid': 'tag-row' })"
      :label="$t('admin.contestTags.caption')"
      :loading="isPending"
      :error="error"
      :skeleton-rows="4"
      :empty-text="$t('admin.contestTags.empty')"
      @retry="refetch()"
    >
      <template #cell-tag="{ row }">
        <span
          :class="[
            'inline-flex h-(--qa-chip) items-center rounded-pill border px-2.5 text-caption leading-4 font-semibold',
            TAG_COLOR_CLASSES[row.color],
          ]"
          >{{ row.name }}</span
        >
      </template>
      <template #cell-slug="{ row }">
        <span class="font-mono text-meta">{{ row.slug }}</span>
      </template>
      <template #cell-description="{ row }">{{ row.description || '—' }}</template>
      <template #actions="{ row }">
        <button
          type="button"
          :class="buttonClass('ghost', 'sm')"
          :aria-label="$t('admin.contestTags.editLabel', { name: row.name })"
          @click="openEditor(row)"
        >
          <Pencil aria-hidden="true" class="size-4" :stroke-width="1.75" />
          {{ $t('common.edit') }}
        </button>
        <AdminRowMenu
          :items="menuOf(row)"
          :label="$t('admin.contestTags.more', { name: row.name })"
        />
      </template>
    </AdminDataTable>
    <ContestTagEditor v-model:visible="isEditorOpen" :tag="editing" />
    <TagContestsPanel v-if="assigning" v-model:visible="isAssignOpen" :tag="assigning" />
    <ConfirmDialog
      v-model:visible="isRemoveOpen"
      :title="$t('admin.contestTags.removeTitle', { name: removing?.name ?? '' })"
      :body="$t('admin.contestTags.removeBody', { slug: removing?.slug ?? '' })"
      :confirm-label="$t('admin.contestTags.removeConfirm', { name: removing?.name ?? '' })"
      tone="danger"
      :busy="removal.isPending.value"
      @confirm="removing && removal.run(removing)"
    >
      <template #error>
        <p v-if="removal.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(removal.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </div>
</template>
