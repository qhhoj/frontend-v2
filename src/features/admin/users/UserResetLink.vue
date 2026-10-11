<script setup lang="ts">
import { computed } from 'vue';
import { ApiError } from '@/api/client';
import { sendUserResetLink } from '@/api/users-admin.api';
import { adminIssueText, failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminStatus from '../ui/AdminStatus.vue';
import { BUTTON } from '../ui/controls';

const props = defineProps<{ username: string; email: string }>();
const send = useAdminMutation({ mutate: () => sendUserResetLink(props.username) });
/** An inactive account or a missing address carries an issue code; anything else (mail off, too many links) its error text. */
const refusal = computed(() => {
  const error = send.failure.value;
  if (error === null) return null;
  const issue = error instanceof ApiError ? error.issues[0] : undefined;
  return issue ? adminIssueText(issue) : failureTextOf(error);
});
</script>

<template>
  <section class="flex flex-col gap-3" :aria-label="$t('admin.users.edit.reset.title')">
    <h3 class="font-display text-base font-semibold">{{ $t('admin.users.edit.reset.title') }}</h3>
    <p class="text-sm text-muted">
      {{
        email ? $t('admin.users.edit.reset.note', { email }) : $t('admin.users.edit.reset.noEmail')
      }}
    </p>
    <button
      type="button"
      :class="BUTTON.secondary"
      class="self-start"
      :aria-disabled="send.isPending.value || undefined"
      :aria-busy="send.isPending.value || undefined"
      @click="send.run(undefined)"
    >
      {{ $t('admin.users.edit.reset.send') }}
    </button>
    <AdminStatus
      v-if="send.isDone.value"
      kind="done"
      :text="$t('admin.users.edit.reset.sent', { email })"
    />
    <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
  </section>
</template>
