<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { OrganizationProblem, ProblemTag } from '@/api/types/organization-problems';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import OrgTagChip from './OrgTagChip.vue';

/** Checkboxes over the organization's tags for one problem; saves the checked tag ids (catalogue order). */
const MAX_TAGS_PER_PROBLEM = 20;
const props = defineProps<{
  problem: OrganizationProblem | null;
  tags: ProblemTag[];
  busy: boolean;
  failureText: string;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ save: [tagIds: string[]] }>();
const checked = ref<string[]>([]);
watch(visible, (isOpen) => {
  if (isOpen) checked.value = props.problem?.tags.map((tag) => tag.id) ?? [];
});
const isWithinLimit = computed(() => checked.value.length <= MAX_TAGS_PER_PROBLEM);
const save = () =>
  emit(
    'save',
    props.tags.filter((tag) => checked.value.includes(tag.id)).map((tag) => tag.id),
  );
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('orgProblems.tagsDialog.title', { code: problem?.code ?? '' })"
    :confirm-label="$t('common.save')"
    :busy="busy"
    :can-confirm="isWithinLimit"
    @confirm="save"
  >
    <p v-if="tags.length === 0" class="text-muted">{{ $t('orgProblems.tagsDialog.none') }}</p>
    <fieldset v-else class="flex flex-col gap-1">
      <legend class="mb-2 text-sm font-semibold">{{ $t('orgProblems.tagsDialog.legend') }}</legend>
      <label
        v-for="tag in tags"
        :key="tag.id"
        class="flex min-h-11 cursor-pointer items-center gap-3 rounded-row px-2 hover:bg-surface-hover"
      >
        <input v-model="checked" type="checkbox" class="size-5" :value="tag.id" />
        <OrgTagChip :tag="tag" />
      </label>
      <p class="text-caption leading-4 text-muted">{{ $t('orgProblems.tagsDialog.limit') }}</p>
    </fieldset>
    <template #error>
      <p v-if="failureText" role="alert" class="text-sm text-negative">{{ failureText }}</p>
    </template>
  </ConfirmDialog>
</template>
