<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, ref, useId } from 'vue';
import { banUser } from '@/api/users.api';
import { BAN_REASON_MAX_LENGTH } from '@/api/types/users';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import StatePanel from '@/components/StatePanel.vue';
import { errorMessageKey } from '@/i18n/error-message';

/**
 * Staff ban: a required reason, then the crowned success line in place of the opener.
 * The parent keys it by username, so a ban on one profile never shows on the next.
 */
const props = defineProps<{ username: string }>();
const visible = ref(false);
const reason = ref('');
const isBanned = ref(false);
const reasonId = useId();
const canConfirm = computed(() => reason.value.trim().length > 0);
const queryClient = useQueryClient();

const ban = useMutation({
  mutationFn: () => banUser(props.username, reason.value.trim()),
  onSuccess: () => {
    visible.value = false;
    isBanned.value = true;
    void queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

function open() {
  ban.reset();
  visible.value = true;
}

function confirm() {
  if (canConfirm.value) ban.mutate();
}
</script>

<template>
  <button
    v-if="!isBanned"
    type="button"
    data-testid="ban-open"
    class="min-h-11 rounded-pill border border-negative px-5 font-semibold text-negative hover:bg-surface-hover"
    @click="open"
  >
    {{ $t('profile.ban.open') }}
  </button>
  <StatePanel
    v-else
    kind="success"
    :title="$t('profile.ban.done', { username })"
    :body="$t('profile.ban.doneBody')"
  />
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('profile.ban.title', { username })"
    :body="$t('profile.ban.body')"
    :confirm-label="$t('profile.ban.submit')"
    tone="danger"
    :busy="ban.isPending.value"
    :can-confirm="canConfirm"
    @confirm="confirm"
  >
    <label :for="reasonId" class="font-semibold">{{ $t('profile.ban.reason') }}</label>
    <textarea
      :id="reasonId"
      v-model="reason"
      required
      :maxlength="BAN_REASON_MAX_LENGTH"
      rows="4"
      class="rounded-tile border border-line bg-surface-solid p-3 text-content"
    />
    <template #error>
      <p v-if="ban.isError.value" role="alert" class="text-negative">
        {{ $t(errorMessageKey(ban.error.value)) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
