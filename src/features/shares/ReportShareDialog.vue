<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { ApiError } from '@/api/client';
import type { ShareReportReason } from '@/api/types/shares';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import Modal from '@/components/ui/Modal.vue';
import Notice from '@/components/ui/Notice.vue';
import RadioGroup from '@/components/ui/RadioGroup.vue';
import TextArea from '@/components/ui/TextArea.vue';
import { translate } from '@/i18n';
import { shareFailureOf } from './share-failure';
import { useReportShare } from './shares.queries';

/** "Báo cáo nội dung này": a reason and an optional note for the staff; once per person and share. Emits `sent` when it landed. */
const props = defineProps<{ code: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ sent: [] }>();
const NOTE_MAX = 500;
const REASONS: readonly ShareReportReason[] = ['contest', 'abuse', 'spam', 'other'];
const id = useId();
const reason = ref<ShareReportReason | null>(null);
const note = ref('');
const failureKey = ref<string | null>(null);
const report = useReportShare();
const options = REASONS.map((value) => ({
  value,
  label: translate(`share.report.reason.${value}`),
}));
const isNoteTooLong = computed(() => note.value.length > NOTE_MAX);

watch(visible, (isOpen) => {
  if (!isOpen) return;
  reason.value = null;
  note.value = '';
  failureKey.value = null;
});

async function send() {
  if (!reason.value || isNoteTooLong.value) return;
  failureKey.value = null;
  try {
    await report.mutateAsync({ code: props.code, reason: reason.value, note: note.value.trim() });
    visible.value = false;
    emit('sent');
  } catch (error) {
    const failure = shareFailureOf(error);
    const isDuplicate = error instanceof ApiError && error.code === 'conflict';
    failureKey.value = isDuplicate
      ? 'share.report.duplicate'
      : failure.kind === 'other'
        ? failure.key
        : 'errors.generic';
  }
}
</script>

<template>
  <Modal v-model:visible="visible" size="sm" :title="$t('share.report.title')">
    <form :id="`${id}-form`" class="flex flex-col gap-5" @submit.prevent="send">
      <p class="m-0 text-sm text-muted">{{ $t('share.report.body') }}</p>
      <RadioGroup
        v-model="reason"
        :name="`${id}-reason`"
        :legend="$t('share.report.reasonLabel')"
        :options="options"
      />
      <FormField :label="$t('share.report.noteLabel')" optional :input-id="`${id}-note`">
        <TextArea v-model="note" rows="3" :aria-invalid="isNoteTooLong || undefined" />
        <template #after>
          <span
            class="block text-right tabular-nums"
            :class="isNoteTooLong ? 'text-negative' : 'text-muted'"
          >
            {{ note.length }} / {{ NOTE_MAX }}
          </span>
        </template>
      </FormField>
      <Notice v-if="failureKey" tone="danger" inline>{{ $t(failureKey) }}</Notice>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton :disabled="report.isPending.value" @click="visible = false">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton
          tone="primary"
          type="submit"
          :form="`${id}-form`"
          :loading="report.isPending.value"
          :disabled="reason === null || isNoteTooLong"
        >
          {{ $t('share.report.confirm') }}
        </AppButton>
      </div>
    </template>
  </Modal>
</template>
