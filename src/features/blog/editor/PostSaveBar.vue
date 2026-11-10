<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import SaveBar from '@/components/ui/SaveBar.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import type { PublishMode } from './post-form';

/**
 * The editor's save bar: the save state, "save draft" and "publish" until the post is public, then "update" (saves the chosen
 * visibility as it is). The submit button publishes through the form's submit; saving is never gated on a change.
 */
const props = defineProps<{
  mode: PublishMode;
  /** The post as saved is public (an edit of a live post). */
  isLive: boolean;
  isDirty: boolean;
  isPending: boolean;
  isDone: boolean;
  isNothingToSave: boolean;
  failure: unknown;
}>();
const emit = defineEmits<{ saveDraft: [] }>();
const publishLabel = computed(() => {
  if (props.isLive) return 'postEditor.bar.update';
  return props.mode === 'scheduled' ? 'postEditor.bar.schedule' : 'postEditor.bar.publish';
});
</script>

<template>
  <SaveBar
    :dirty-count="isDirty ? 1 : 0"
    :pending="isPending"
    :save-label="$t(publishLabel)"
    allow-clean
  >
    <template #status>
      <Notice v-if="failure" tone="danger">{{ failureTextOf(failure) }}</Notice>
      <Notice v-else-if="isDone" tone="success" role="status">{{ $t('postEditor.saved') }}</Notice>
      <Notice v-else-if="isNothingToSave" tone="info" role="status">
        {{ $t('postEditor.nothingToSave') }}
      </Notice>
      <span v-else :class="isDirty ? 'font-semibold' : 'text-muted'">
        {{ $t(isDirty ? 'postEditor.bar.unsaved' : 'postEditor.bar.clean') }}
      </span>
    </template>
    <template #actions>
      <AppButton v-if="!isLive" :disabled="isPending" @click="emit('saveDraft')">
        {{ $t('postEditor.bar.saveDraft') }}
      </AppButton>
    </template>
  </SaveBar>
</template>
