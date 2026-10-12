<script setup lang="ts">
import { computed } from 'vue';
import SaveBar from '@/components/ui/SaveBar.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { buttonClass } from '@/features/admin/ui/controls';
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
      <AdminStatus v-if="failure" kind="refused" :text="failureTextOf(failure)" />
      <AdminStatus v-else-if="isDone" kind="done" :text="$t('admin.postEditor.saved')" />
      <AdminStatus
        v-else-if="isNothingToSave"
        kind="queued"
        :text="$t('admin.postEditor.nothingToSave')"
      />
      <span v-else :class="isDirty ? 'font-semibold' : 'text-muted'">
        {{ $t(isDirty ? 'postEditor.bar.unsaved' : 'postEditor.bar.clean') }}
      </span>
    </template>
    <template #actions>
      <!-- SaveBar's own buttons are the admin shape; the draft button matches them. -->
      <button
        v-if="!isLive"
        type="button"
        :class="buttonClass('secondary')"
        :aria-disabled="isPending || undefined"
        @click="isPending || emit('saveDraft')"
      >
        {{ $t('postEditor.bar.saveDraft') }}
      </button>
    </template>
  </SaveBar>
</template>
