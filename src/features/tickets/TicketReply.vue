<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import { postTicketMessage } from '@/api/tickets.api';
import GlassCard from '@/components/GlassCard.vue';
import { errorMessageKey } from '@/i18n/error-message';

/** Same limit as the backend's `NewTicketMessageDto`: 8192 characters, counted as code points. */
const MESSAGE_MAX_CODE_POINTS = 8192;
const props = defineProps<{ ticketId: string }>();
const emit = defineEmits<{ sent: [] }>();
const client = useQueryClient();
const draft = ref('');
const text = computed(() => draft.value.trim());
const canSend = computed(
  () => text.value.length > 0 && [...text.value].length <= MESSAGE_MAX_CODE_POINTS,
);
const { isPending, error, mutate } = useMutation({
  mutationFn: (body: string) => postTicketMessage(props.ticketId, body),
  onSuccess: () => {
    draft.value = '';
    emit('sent');
    return client.invalidateQueries({ queryKey: ['tickets'] });
  },
});
const failureKey = computed(() => (error.value ? replyFailureKey(error.value) : null));
const BUTTON = 'inline-flex min-h-11 items-center rounded-pill px-5 font-semibold';

/** 409 is the message cap and 403 a muted account; anything else (429 included) shows its own message. */
function replyFailureKey(failure: unknown): string {
  if (failure instanceof ApiError && failure.status === 409) return 'ticket.messageCap';
  if (failure instanceof ApiError && failure.status === 403) return 'ticket.muted';
  return errorMessageKey(failure);
}
const send = () => {
  if (canSend.value && !isPending.value) mutate(text.value);
};
</script>

<template>
  <GlassCard as="section" class="p-5">
    <form data-testid="ticket-reply" class="flex flex-col gap-3" novalidate @submit.prevent="send">
      <label class="flex flex-col gap-1.5 text-sm font-semibold">
        {{ $t('ticket.reply') }}
        <textarea
          v-model="draft"
          name="reply"
          rows="4"
          :placeholder="$t('ticket.replyPlaceholder')"
          class="min-h-28 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-base font-normal text-content placeholder:text-muted"
        />
      </label>
      <p v-if="failureKey" role="alert" class="text-[13px] text-negative">
        {{ $t(failureKey) }}
      </p>
      <div class="flex justify-end">
        <button
          type="submit"
          :aria-disabled="canSend ? undefined : 'true'"
          :aria-busy="isPending ? 'true' : undefined"
          :class="[
            BUTTON,
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
