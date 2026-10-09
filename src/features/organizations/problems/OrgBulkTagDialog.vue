<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ProblemTag } from '@/api/types/organization-problems';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import OrgTagChip from './OrgTagChip.vue';

/** Pick add or remove and one tag for the ticked rows; confirm stays disabled until a tag is picked. */
const props = defineProps<{ tags: ProblemTag[]; busy: boolean; count: number }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{
  confirm: [command: { action: 'add-tag' | 'remove-tag'; tagId: string }];
}>();
const action = ref<'add-tag' | 'remove-tag'>('add-tag');
const tagId = ref('');
watch(visible, (isOpen) => {
  if (!isOpen) return;
  action.value = 'add-tag';
  tagId.value = '';
});
const confirm = () => {
  if (props.tags.some((tag) => tag.id === tagId.value))
    emit('confirm', { action: action.value, tagId: tagId.value });
};
const OPTION =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-row px-2 hover:bg-surface-hover';
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('orgProblems.bulk.tagTitle', { count }, count)"
    :confirm-label="$t('orgProblems.bulk.apply')"
    :busy="busy"
    :can-confirm="tagId !== ''"
    @confirm="confirm"
  >
    <fieldset class="flex flex-col gap-1">
      <legend class="mb-1 text-sm font-semibold">{{ $t('orgProblems.bulk.modeLegend') }}</legend>
      <label :class="OPTION"
        ><input v-model="action" type="radio" name="bulk-mode" class="size-4" value="add-tag" />{{
          $t('orgProblems.bulk.addTag')
        }}</label
      >
      <label :class="OPTION"
        ><input
          v-model="action"
          type="radio"
          name="bulk-mode"
          class="size-4"
          value="remove-tag"
        />{{ $t('orgProblems.bulk.removeTag') }}</label
      >
    </fieldset>
    <fieldset class="flex flex-col gap-1">
      <legend class="mb-1 text-sm font-semibold">{{ $t('orgProblems.bulk.tagLegend') }}</legend>
      <label v-for="tag in tags" :key="tag.id" :class="OPTION">
        <input v-model="tagId" type="radio" class="size-4" name="bulk-tag" :value="tag.id" />
        <OrgTagChip :tag="tag" />
      </label>
    </fieldset>
  </ConfirmDialog>
</template>
