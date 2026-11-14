<script setup lang="ts">
import { ref, useId, watch } from 'vue';
import type { ShareExpiry, ShareListItem } from '@/api/types/shares';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import Modal from '@/components/ui/Modal.vue';
import Notice from '@/components/ui/Notice.vue';
import TextInput from '@/components/ui/TextInput.vue';
import ShareExpiryPicker from './ShareExpiryPicker.vue';
import { expiryMessage } from './share-expiry';
import { shareFailureOf } from './share-failure';
import { useEditShare } from './shares.queries';

/**
 * "Sửa liên kết": the title and the expiry. A new expiry counts from now, so with none picked the current one stays
 * (the hint says when it is). Saved with the dialog's own footer button; the dialog closes on success.
 */
const props = defineProps<{ share: ShareListItem }>();
const visible = defineModel<boolean>('visible', { required: true });
const id = useId();
const title = ref('');
const expiry = ref<ShareExpiry | null>(null);
const failureKey = ref<string | null>(null);
const edit = useEditShare();

watch(
  visible,
  (isOpen) => {
    if (!isOpen) return;
    title.value = props.share.title;
    expiry.value = null;
    failureKey.value = null;
  },
  { immediate: true },
);

async function save() {
  failureKey.value = null;
  try {
    await edit.mutateAsync({
      code: props.share.code,
      title: title.value.trim(),
      ...(expiry.value ? { expiry: expiry.value } : {}),
    });
    visible.value = false;
  } catch (error) {
    const failure = shareFailureOf(error);
    failureKey.value = failure.kind === 'other' ? failure.key : 'errors.generic';
  }
}
</script>

<template>
  <Modal v-model:visible="visible" size="sm" :title="$t('share.edit.title')">
    <form :id="`${id}-form`" class="flex flex-col gap-5" @submit.prevent="save">
      <FormField :label="$t('share.paste.titleLabel')" optional :input-id="`${id}-title`">
        <TextInput v-model="title" maxlength="100" />
      </FormField>
      <ShareExpiryPicker
        v-model="expiry"
        :hint="$t('share.edit.expiryHint', { current: expiryMessage(share.expiresAt, Date.now()) })"
      />
      <Notice v-if="failureKey" tone="danger" inline>{{ $t(failureKey) }}</Notice>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <AppButton :disabled="edit.isPending.value" @click="visible = false">
          {{ $t('common.cancel') }}
        </AppButton>
        <AppButton
          tone="primary"
          type="submit"
          :form="`${id}-form`"
          :loading="edit.isPending.value"
        >
          {{ $t('common.save') }}
        </AppButton>
      </div>
    </template>
  </Modal>
</template>
