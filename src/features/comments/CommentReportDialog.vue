<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { reportComment } from '@/api/comments.api';
import { COMMENT_REPORT_NOTE_MAX_LENGTH, COMMENT_REPORT_REASONS } from '@/api/types/comments';
import type { CommentReportReason } from '@/api/types/comments';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import RadioGroup from '@/components/ui/RadioGroup.vue';
import { translate } from '@/i18n';
import { reportFailureKey } from './comment-failure';

/** "Report": a reason (radio) and an optional note for the moderators; once per user and comment. Emits `sent` when it landed. */
const props = defineProps<{ commentId: string; author: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ sent: [] }>();
const id = useId();
const reason = ref<CommentReportReason | null>(null);
const note = ref('');
const isBusy = ref(false);
const failureKey = ref<string | null>(null);
const reasonOptions = COMMENT_REPORT_REASONS.map((value) => ({
  value,
  label: translate(`comments.report.reason.${value}`),
}));
const isNoteTooLong = computed(() => note.value.length > COMMENT_REPORT_NOTE_MAX_LENGTH);

// Each opening starts blank.
watch(visible, (isOpen) => {
  if (!isOpen) return;
  reason.value = null;
  note.value = '';
  failureKey.value = null;
});

async function send() {
  if (!reason.value || isNoteTooLong.value) return;
  isBusy.value = true;
  failureKey.value = null;
  try {
    const trimmed = note.value.trim();
    await reportComment(props.commentId, {
      reason: reason.value,
      ...(trimmed ? { note: trimmed } : {}),
    });
    visible.value = false;
    emit('sent');
  } catch (error) {
    failureKey.value = reportFailureKey(error);
  } finally {
    isBusy.value = false;
  }
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('comments.report.title', { author })"
    :body="$t('comments.report.body')"
    :confirm-label="$t('comments.report.confirm')"
    :busy="isBusy"
    :can-confirm="reason !== null && !isNoteTooLong"
    @confirm="send"
  >
    <RadioGroup
      v-model="reason"
      :name="`${id}-reason`"
      :legend="$t('comments.report.reasonLabel')"
      :options="reasonOptions"
    />
    <div class="flex flex-col gap-1">
      <label :for="`${id}-note`" class="text-sm font-semibold">{{
        $t('comments.report.noteLabel')
      }}</label>
      <textarea
        :id="`${id}-note`"
        v-model="note"
        rows="3"
        :aria-invalid="isNoteTooLong || undefined"
        :aria-describedby="`${id}-note-count`"
        class="block w-full resize-y rounded-row border border-line-control bg-surface-solid px-3 py-2 text-base text-content"
      />
      <span
        :id="`${id}-note-count`"
        class="self-end text-caption leading-4 tabular-nums"
        :class="isNoteTooLong ? 'text-negative' : 'text-muted'"
      >
        {{ note.length }} / {{ COMMENT_REPORT_NOTE_MAX_LENGTH }}
      </span>
    </div>
    <template #error>
      <p v-if="failureKey" role="alert" class="text-sm text-negative">{{ $t(failureKey) }}</p>
    </template>
  </ConfirmDialog>
</template>
