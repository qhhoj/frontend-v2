<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, nextTick, ref } from 'vue';
import { ApiError } from '@/api/client';
import { postTicketMessage } from '@/api/tickets.api';
import GlassCard from '@/components/GlassCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import CannedReplyPicker from './canned/CannedReplyPicker.vue';
import { appendToDraft } from './canned/canned-text';
import type { CannedContext } from './canned/canned-text';

/** Same limit as the backend's `NewTicketMessageDto`: 8192 characters, counted as code points. */
const MESSAGE_MAX_CODE_POINTS = 8192;
/**
 * `cannedContext`: set for handlers (`can.assign`), it brings the canned-reply picker. The `options` slot sits beside Send.
 * `compact` (a box pinned under a thread): one row, "Trả lời…" and Send, until it takes focus or holds text; then the
 * full box, so it never covers the thread it answers.
 */
const props = withDefaults(
  defineProps<{ ticketId: string; cannedContext?: CannedContext | null; compact?: boolean }>(),
  { cannedContext: null, compact: false },
);
const emit = defineEmits<{ sent: [] }>();
const client = useQueryClient();
const draft = ref('');
const textarea = ref<HTMLTextAreaElement | null>(null);
const insertedText = ref('');
const text = computed(() => draft.value.trim());
const canSend = computed(
  () => text.value.length > 0 && [...text.value].length <= MESSAGE_MAX_CODE_POINTS,
);
const { isPending, error, mutate } = useMutation({
  mutationFn: (body: string) => postTicketMessage(props.ticketId, body),
  onSuccess: () => {
    draft.value = '';
    insertedText.value = '';
    emit('sent');
    return client.invalidateQueries({ queryKey: ['tickets'] });
  },
});
const failureKey = computed(() => (error.value ? replyFailureKey(error.value) : null));

const hasFocus = ref(false);
const isFolded = computed(
  () => props.compact && !hasFocus.value && draft.value === '' && !failureKey.value,
);
/** Focus moving to another control of the box, or into a dialog it opened (the canned-reply picker), keeps it open. */
const onFocusOut = (event: FocusEvent) => {
  const next = event.relatedTarget;
  const form = event.currentTarget as HTMLElement;
  hasFocus.value =
    next instanceof Element && (form.contains(next) || next.closest('[role="dialog"]') !== null);
};

/** `conflict` is the message cap and `forbidden` a muted account (the backend's one `forbidden` here); anything else (429 included) shows its own message. */
const REPLY_FAILURE_KEYS: Readonly<Record<string, string>> = {
  conflict: 'ticket.messageCap',
  forbidden: 'ticket.muted',
};
function replyFailureKey(failure: unknown): string {
  const code = failure instanceof ApiError ? failure.code : '';
  return Object.hasOwn(REPLY_FAILURE_KEYS, code)
    ? REPLY_FAILURE_KEYS[code]!
    : errorMessageKey(failure);
}
const send = () => {
  if (canSend.value && !isPending.value) mutate(text.value);
};
/** The filled-in reply joins the draft; the focus goes back to the text so the handler can edit it. */
async function insertCanned(filled: string, title: string) {
  draft.value = appendToDraft(draft.value, filled);
  insertedText.value = translate('cannedPicker.inserted', { title });
  await nextTick();
  textarea.value?.focus();
}
</script>

<template>
  <GlassCard as="section" :class="isFolded ? 'p-1.5' : 'p-5'">
    <form
      data-testid="ticket-reply"
      :data-folded="isFolded || undefined"
      :class="isFolded ? 'flex items-center gap-2' : 'flex flex-col gap-3'"
      novalidate
      @submit.prevent="send"
      @focusin="hasFocus = true"
      @focusout="onFocusOut"
    >
      <label
        class="flex flex-col gap-1.5 text-sm font-semibold"
        :class="isFolded && 'min-w-0 flex-1'"
      >
        <span :class="isFolded && 'sr-only'">{{ $t('ticket.reply') }}</span>
        <textarea
          ref="textarea"
          v-model="draft"
          name="reply"
          :rows="isFolded ? 1 : 4"
          :placeholder="isFolded ? $t('ticket.replyFolded') : $t('ticket.replyPlaceholder')"
          class="rounded-cell border border-line-control bg-surface px-3.5 py-2.5 text-base font-normal text-content placeholder:text-muted"
          :class="isFolded ? 'min-h-11 resize-none' : 'min-h-28'"
        />
      </label>
      <p v-if="failureKey" role="alert" class="text-meta text-negative">
        {{ $t(failureKey) }}
      </p>
      <p class="sr-only" aria-live="polite" data-testid="canned-inserted">{{ insertedText }}</p>
      <AppButton v-if="isFolded" type="submit" tone="primary" disabled>
        {{ $t('ticket.send') }}
      </AppButton>
      <div v-else class="flex flex-wrap items-center gap-2">
        <CannedReplyPicker v-if="cannedContext" :context="cannedContext" @pick="insertCanned" />
        <slot name="options" />
        <AppButton
          type="submit"
          tone="primary"
          class="ml-auto"
          :disabled="!canSend"
          :loading="isPending"
        >
          {{ $t('ticket.send') }}
        </AppButton>
      </div>
    </form>
  </GlassCard>
</template>
