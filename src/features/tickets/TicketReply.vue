<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, nextTick, ref } from 'vue';
import { ApiError } from '@/api/client';
import { postTicketMessage } from '@/api/tickets.api';
import GlassCard from '@/components/GlassCard.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import CannedReplyPicker from './canned/CannedReplyPicker.vue';
import { appendToDraft } from './canned/canned-text';
import type { CannedContext } from './canned/canned-text';

/** Same limit as the backend's `NewTicketMessageDto`: 8192 characters, counted as code points. */
const MESSAGE_MAX_CODE_POINTS = 8192;
/** `cannedContext`: set for handlers (`can.assign`), it brings the canned-reply picker. */
const props = withDefaults(
  defineProps<{ ticketId: string; cannedContext?: CannedContext | null }>(),
  { cannedContext: null },
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
const BUTTON = 'inline-flex min-h-11 items-center rounded-pill px-5 font-semibold';

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
  <GlassCard as="section" class="p-5">
    <form data-testid="ticket-reply" class="flex flex-col gap-3" novalidate @submit.prevent="send">
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('ticket.reply') }}
        <textarea
          ref="textarea"
          v-model="draft"
          name="reply"
          rows="4"
          :placeholder="$t('ticket.replyPlaceholder')"
          class="min-h-28 rounded-cell border border-line bg-surface px-3.5 py-2.5 text-base font-normal text-content placeholder:text-muted"
        />
      </label>
      <p v-if="failureKey" role="alert" class="text-meta text-negative">
        {{ $t(failureKey) }}
      </p>
      <p class="sr-only" aria-live="polite" data-testid="canned-inserted">{{ insertedText }}</p>
      <div class="flex flex-wrap items-center gap-2">
        <CannedReplyPicker v-if="cannedContext" :context="cannedContext" @pick="insertCanned" />
        <button
          type="submit"
          :aria-disabled="canSend ? undefined : 'true'"
          :aria-busy="isPending ? 'true' : undefined"
          :class="[
            BUTTON,
            'ml-auto',
            isPending
              ? 'cursor-progress bg-accent-soft text-accent-soft-text'
              : canSend
                ? 'bg-accent text-on-accent'
                : 'bg-accent-soft text-accent-soft-text',
          ]"
        >
          {{ $t('ticket.send') }}
        </button>
      </div>
    </form>
  </GlassCard>
</template>
