<script setup lang="ts">
import { Pencil, Plus, Trash2 } from 'lucide-vue-next';
import { computed, ref, toRef } from 'vue';
import type { ProblemTag } from '@/api/types/organization-problems';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
import { ORG_BITS } from '../org-bits';
import type { TagForm } from './org-tag-form';
import OrgTagChip from './OrgTagChip.vue';
import OrgTagDialog from './OrgTagDialog.vue';
import { orgFailureText } from './org-problem-errors';
import { useOrgTagActions } from './use-org-tag-actions';

/** The side card: the organization's tags (max 100) with add, edit and delete for its administrators. */
const MAX_TAGS = 100;
const props = defineProps<{
  slug: string;
  tags: ProblemTag[];
  isLoading: boolean;
  error: unknown;
}>();
defineEmits<{ retry: [] }>();
const { save, remove } = useOrgTagActions(toRef(props, 'slug'));
const editing = ref<ProblemTag | null>(null);
const isFormOpen = ref(false);
const deleting = ref<ProblemTag | null>(null);
const isDeleteOpen = computed({
  get: () => deleting.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) deleting.value = null;
  },
});
const isFull = computed(() => props.tags.length >= MAX_TAGS);
const saveFailure = computed(() => (save.error.value ? orgFailureText(save.error.value) : ''));
const removeFailure = computed(() =>
  remove.error.value ? orgFailureText(remove.error.value) : '',
);

function openForm(tag: ProblemTag | null) {
  if (tag === null && isFull.value) return;
  save.reset();
  editing.value = tag;
  isFormOpen.value = true;
}
function submit(form: TagForm) {
  save.mutate(
    { tagSlug: editing.value?.slug ?? null, form },
    { onSuccess: () => void (isFormOpen.value = false) },
  );
}
function openDelete(tag: ProblemTag) {
  remove.reset();
  deleting.value = tag;
}
function confirmDelete() {
  if (!deleting.value) return;
  remove.mutate(deleting.value.slug, { onSuccess: () => void (deleting.value = null) });
}
</script>

<template>
  <GlassCard
    as="section"
    data-testid="org-tag-catalogue"
    aria-labelledby="org-tags-title"
    class="flex flex-col gap-3 p-5"
  >
    <header class="flex items-center justify-between gap-2">
      <h2 id="org-tags-title" class="font-display text-base font-bold">
        {{ $t('orgProblems.tags.title') }}
      </h2>
      <span class="text-sm text-muted">{{
        $t('orgProblems.tags.count', { count: tags.length, max: MAX_TAGS })
      }}</span>
    </header>
    <QueryState :loading="isLoading" :error="error" @retry="$emit('retry')">
      <template #skeleton>
        <ul data-skeleton-region="org-tag-list" class="flex flex-col gap-1">
          <li v-for="index in 3" :key="index" class="flex min-h-11 items-center gap-2">
            <SkeletonBlock pill class="h-6 w-28" />
          </li>
        </ul>
      </template>
      <p v-if="tags.length === 0" class="flex items-center gap-2 text-sm text-muted">
        <InlineBit :kind="ORG_BITS.tagsEmpty" />{{ $t('orgProblems.tags.empty') }}
      </p>
      <ul v-else class="flex flex-col gap-1">
        <li v-for="tag in tags" :key="tag.id" class="flex items-center gap-2">
          <OrgTagChip :tag="tag" />
          <span class="min-w-0 truncate font-mono text-xs text-muted">{{ tag.slug }}</span>
          <IconButton
            class="ml-auto shrink-0"
            :label="$t('orgProblems.tags.editLabel', { name: tag.name })"
            @click="openForm(tag)"
          >
            <Pencil aria-hidden="true" class="size-4" />
          </IconButton>
          <IconButton
            class="shrink-0"
            :label="$t('orgProblems.tags.deleteLabel', { name: tag.name })"
            @click="openDelete(tag)"
          >
            <Trash2 aria-hidden="true" class="size-4" />
          </IconButton>
        </li>
      </ul>
    </QueryState>
    <AppButton :disabled="isFull" @click="openForm(null)">
      <template #icon><Plus aria-hidden="true" class="size-4" /></template>
      {{ $t('orgProblems.tags.add') }}
    </AppButton>
    <OrgTagDialog
      v-model:visible="isFormOpen"
      :tag="editing"
      :busy="save.isPending.value"
      :failure-text="saveFailure"
      @save="submit"
    />
    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      tone="danger"
      :title="$t('orgProblems.tags.deleteTitle', { name: deleting?.name ?? '' })"
      :body="$t('orgProblems.tags.deleteBody')"
      :confirm-label="$t('orgProblems.tags.deleteConfirm')"
      :busy="remove.isPending.value"
      @confirm="confirmDelete"
    >
      <template #error>
        <p v-if="removeFailure" role="alert" class="text-sm text-negative">{{ removeFailure }}</p>
      </template>
    </ConfirmDialog>
  </GlassCard>
</template>
