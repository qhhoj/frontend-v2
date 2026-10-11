<script setup lang="ts">
import { computed } from 'vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { BUTTON } from '@/features/admin/ui/controls';
import type { PublishMode } from './post-form';
import type { SaveIntent } from './use-post-editor';

/** The sticky bar under the editor: the save state, "save draft" and "publish" until the post is public, then "update" (saves the chosen visibility as it is). */
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
const emit = defineEmits<{ save: [intent: SaveIntent] }>();
const publishLabel = computed(() => {
  if (props.isLive) return 'postEditor.bar.update';
  return props.mode === 'scheduled' ? 'postEditor.bar.schedule' : 'postEditor.bar.publish';
});
</script>

<template>
  <div
    class="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface-solid px-4 py-3 sm:-mx-8 sm:px-8"
  >
    <div class="min-w-0 flex-1 text-sm" aria-live="polite">
      <AdminStatus v-if="failure" kind="refused" :text="failureTextOf(failure)" />
      <AdminStatus v-else-if="isDone" kind="done" :text="$t('admin.postEditor.saved')" />
      <AdminStatus
        v-else-if="isNothingToSave"
        kind="queued"
        :text="$t('admin.postEditor.nothingToSave')"
      />
      <span v-else class="text-muted">
        {{ $t(isDirty ? 'postEditor.bar.unsaved' : 'postEditor.bar.clean') }}
      </span>
    </div>
    <div class="flex w-full gap-2.5 sm:w-auto">
      <button
        v-if="!isLive"
        type="button"
        :class="[BUTTON.secondary, 'flex-1 sm:flex-none']"
        :aria-disabled="isPending || undefined"
        @click="isPending || emit('save', 'draft')"
      >
        {{ $t('postEditor.bar.saveDraft') }}
      </button>
      <button
        type="button"
        :class="[BUTTON.primary, 'flex-1 sm:flex-none']"
        :aria-disabled="isPending || undefined"
        @click="isPending || emit('save', isLive ? 'keep' : 'publish')"
      >
        {{ isPending ? $t('admin.postEditor.saving') : $t(publishLabel) }}
      </button>
    </div>
  </div>
</template>
