<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { reportComment } from '@/api/comments.api';
import { COMMENT_REPORT_NOTE_MAX_LENGTH, COMMENT_REPORT_REASONS } from '@/api/types/comments';
import type { CommentReportReason } from '@/api/types/comments';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import Modal from '@/components/ui/Modal.vue';
import Notice from '@/components/ui/Notice.vue';
import RadioGroup from '@/components/ui/RadioGroup.vue';
import TextArea from '@/components/ui/TextArea.vue';
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
  <Modal v-model:visible="visible" size="sm" :title="$t('comments.report.title', { author })">
    <form :id="`${id}-form`" class="flex flex-col gap-5" @submit.prevent="send">
      <p class="text-sm text-muted">{{ $t('comments.report.body') }}</p>
      <RadioGroup
        v-model="reason"
        :name="`${id}-reason`"
        :legend="$t('comments.report.reasonLabel')"
        :options="reasonOptions"
      />
      <FormField :label="$t('comments.report.noteLabel')" :input-id="`${id}-note`">
        <TextArea v-model="note" rows="3" :aria-invalid="isNoteTooLong || undefined" />
        <template #after>
          <span
            class="block text-right tabular-nums"
            :class="isNoteTooLong ? 'text-negative' : 'text-muted'"
          >
            {{ note.length }} / {{ COMMENT_REPORT_NOTE_MAX_LENGTH }}
          </span>
        </template>
      </FormField>
      <Notice v-if="failureKey" tone="danger" inline>{{ $t(failureKey) }}</Notice>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton :disabled="isBusy" @click="visible = false">{{ $t('common.cancel') }}</AppButton>
        <AppButton
          tone="primary"
          type="submit"
          :form="`${id}-form`"
          :loading="isBusy"
          :disabled="reason === null || isNoteTooLong"
        >
          {{ $t('comments.report.confirm') }}
        </AppButton>
      </div>
    </template>
  </Modal>
</template>
