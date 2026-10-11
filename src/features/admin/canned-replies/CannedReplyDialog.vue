<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { createCannedReply, updateCannedReply } from '@/api/ticket-canned-replies.api';
import type { CannedReply } from '@/api/types/tickets';
import {
  CANNED_REPLY_BODY_MAX_LENGTH,
  CANNED_REPLY_ORDER_MAX,
  CANNED_REPLY_TITLE_MAX_LENGTH,
} from '@/api/types/tickets';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { isNotFound } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';
import { INPUT } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';
import {
  cannedReplySave,
  cannedReplyRefusal,
  checkCannedReplyForm,
  toCannedReplyForm,
} from './canned-reply-form';
import type { CannedReplyForm, CannedReplySave } from './canned-reply-form';

/** Add (`reply` null) or edit one canned reply; the page keeps it mounted and it resets each time it opens. */
const props = defineProps<{ reply: CannedReply | null }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ saved: [reply: CannedReply]; gone: [] }>();
const queryClient = useQueryClient();
const form = ref<CannedReplyForm>(toCannedReplyForm(props.reply));
const localErrors = ref<FieldErrors>({});
const title = computed(() =>
  props.reply
    ? translate('admin.cannedReplies.dialog.editTitle', { title: props.reply.title })
    : translate('admin.cannedReplies.dialog.addTitle'),
);

const save = useAdminMutation({
  mutate: (request: CannedReplySave) =>
    request.kind === 'create'
      ? createCannedReply(request.body)
      : updateCannedReply(request.id, request.body),
  onDone: (reply) => {
    void queryClient.invalidateQueries({ queryKey: ['tickets', 'canned'] });
    emit('saved', reply);
    visible.value = false;
  },
});

/** Nothing changed: close without a request. A refused save keeps the dialog open; a vanished reply reloads the list. */
async function submit() {
  localErrors.value = checkCannedReplyForm(form.value);
  if (Object.keys(localErrors.value).length > 0) return;
  const request = cannedReplySave(props.reply, form.value);
  if (request.kind === 'update' && Object.keys(request.body).length === 0) {
    visible.value = false;
    return;
  }
  await save.run(request);
  if (isNotFound(save.failure.value)) emit('gone');
}

watch(visible, (isOpen) => {
  if (!isOpen) return;
  form.value = toCannedReplyForm(props.reply);
  localErrors.value = {};
  save.reset();
});

const errorOf = (field: keyof CannedReplyForm) =>
  localErrors.value[field] ?? save.fieldErrors.value[field];
const pageLine = computed(() =>
  save.failure.value && Object.keys(save.fieldErrors.value).length === 0
    ? cannedReplyRefusal(save.failure.value)
    : null,
);
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="title"
    :confirm-label="$t('admin.cannedReplies.dialog.save')"
    :busy="save.isPending.value"
    @confirm="submit"
  >
    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.cannedReplies.dialog.titleLabel')"
      :hint="$t('admin.cannedReplies.dialog.titleHint', { max: CANNED_REPLY_TITLE_MAX_LENGTH })"
      :error="errorOf('title')"
      input-id="canned-title"
    >
      <input
        :id="id"
        v-model="form.title"
        :class="INPUT"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('title') ? 'true' : undefined"
        autocomplete="off"
      />
    </AdminField>
    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.cannedReplies.dialog.bodyLabel')"
      :hint="$t('admin.cannedReplies.dialog.bodyHint', { max: CANNED_REPLY_BODY_MAX_LENGTH })"
      :error="errorOf('body')"
      input-id="canned-body"
    >
      <textarea
        :id="id"
        v-model="form.body"
        rows="6"
        :class="[INPUT, 'min-h-32 resize-y']"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('body') ? 'true' : undefined"
      />
    </AdminField>
    <AdminField
      v-slot="{ id, describedBy }"
      :label="$t('admin.cannedReplies.dialog.orderLabel')"
      :hint="$t('admin.cannedReplies.dialog.orderHint', { max: CANNED_REPLY_ORDER_MAX })"
      :error="errorOf('order')"
      input-id="canned-order"
    >
      <input
        :id="id"
        v-model="form.order"
        inputmode="numeric"
        :class="[INPUT, 'tabular-nums']"
        :aria-describedby="describedBy"
        :aria-invalid="errorOf('order') ? 'true' : undefined"
      />
    </AdminField>
    <template #error>
      <AdminStatus v-if="pageLine" kind="refused" :text="pageLine" />
    </template>
  </ConfirmDialog>
</template>
