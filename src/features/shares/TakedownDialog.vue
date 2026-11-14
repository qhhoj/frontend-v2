<script setup lang="ts">
import { ref, useId, watch } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import Modal from '@/components/ui/Modal.vue';
import Notice from '@/components/ui/Notice.vue';
import TextArea from '@/components/ui/TextArea.vue';
import { shareFailureOf } from './share-failure';
import { useTakedownShare } from './shares.queries';

/** Staff take a share down with a reason the owner reads in their list; reversible with "Khôi phục". */
const props = defineProps<{ code: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const REASON_MAX = 500;
const id = useId();
const reason = ref('');
const failureKey = ref<string | null>(null);
const takedown = useTakedownShare();

watch(visible, (isOpen) => {
  if (!isOpen) return;
  reason.value = '';
  failureKey.value = null;
});

async function submit() {
  const text = reason.value.trim();
  if (!text) return;
  failureKey.value = null;
  try {
    await takedown.mutateAsync({ code: props.code, reason: text });
    visible.value = false;
  } catch (error) {
    const failure = shareFailureOf(error);
    failureKey.value = failure.kind === 'other' ? failure.key : 'errors.generic';
  }
}
</script>

<template>
  <Modal v-model:visible="visible" size="sm" :title="$t('share.takedown.title')">
    <form :id="`${id}-form`" class="flex flex-col gap-5" @submit.prevent="submit">
      <p class="m-0 text-sm text-muted">{{ $t('share.takedown.body') }}</p>
      <FormField :label="$t('share.takedown.reasonLabel')" required :input-id="`${id}-reason`">
        <TextArea v-model="reason" rows="3" :maxlength="REASON_MAX" />
      </FormField>
      <Notice v-if="failureKey" tone="danger" inline>{{ $t(failureKey) }}</Notice>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton :disabled="takedown.isPending.value" @click="visible = false">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton
          tone="danger"
          type="submit"
          :form="`${id}-form`"
          :loading="takedown.isPending.value"
          :disabled="reason.trim() === ''"
        >
          {{ $t('share.takedown.confirm') }}
        </AppButton>
      </div>
    </template>
  </Modal>
</template>
