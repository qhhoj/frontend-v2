<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { MAX_OPEN_ORGANIZATIONS } from '@/api/types/organizations';
import type { OrganizationDetail } from '@/api/types/organizations';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Modal from '@/components/ui/Modal.vue';
import { useAdminToast } from '@/features/admin/ui/feedback/use-admin-toast';
import OfficialLockNote from '@/features/official-mode/OfficialLockNote.vue';
import { useOfficialLock } from '@/features/official-mode/use-official-lock';
import { safeRedirect } from '@/router/safe-redirect';
import JoinRequestForm from './JoinRequestForm.vue';
import PendingRequestBlock from './PendingRequestBlock.vue';
import { membershipErrorCopy } from './membership-errors';
import type { MembershipState } from './membership-state';
import { useMembership } from './use-membership';

/**
 * The header's one way in: sign in, join, or ask to join (the reason in a dialog), and the pending request. A member or
 * an administrator has nothing here: their chip sits by the name and leaving is in the ⋯ menu. Joining says so in a toast; a
 * failure stays here, next to the button.
 */
const props = defineProps<{ organization: OrganizationDetail; state: MembershipState }>();
const { t } = useI18n();
const route = useRoute();
const toast = useAdminToast({ lazy: true });
const reason = ref('');
const isRequestOpen = ref(false);
const membership = useMembership(
  () => props.organization.slug,
  (kind) => {
    isRequestOpen.value = false;
    if (kind === 'join')
      toast.show({
        tone: 'success',
        text: t('orgMembership.joinedToast', { name: props.organization.name }),
      });
  },
);
/** Official contest: join and request answer `locked_in_official_contest`, so they are locked here with the reason. */
const lock = useOfficialLock();
const panel = ref<HTMLElement>();
const openLineId = useId();
const errorCopy = computed(() =>
  membership.error.value && membership.action.value
    ? membershipErrorCopy(membership.action.value, membership.error.value)
    : null,
);
const signInTo = computed(() => ({
  name: 'login',
  query: { redirect: safeRedirect(route.fullPath) },
}));

/** Focus the panel on failure so the alert is read once, from its own place. */
watch(
  () => membership.error.value,
  (error) => {
    if (error && !isRequestOpen.value) void nextTick(() => panel.value?.focus());
  },
);
function openRequest() {
  membership.reset();
  isRequestOpen.value = true;
}
const retry = () => {
  if (membership.action.value === 'join') membership.join();
  else if (membership.action.value === 'request') membership.request(reason.value);
};
</script>

<template>
  <section
    v-if="state !== 'member' && state !== 'administrator'"
    ref="panel"
    data-testid="membership-panel"
    tabindex="-1"
    class="flex w-full flex-col gap-2 md:w-auto md:max-w-72 md:items-end"
  >
    <StatePanel
      v-if="errorCopy && !isRequestOpen"
      kind="error"
      :title="$t(errorCopy.title)"
      :body="$t(errorCopy.body)"
    >
      <AppButton @click="retry">{{ $t('common.retry') }}</AppButton>
    </StatePanel>

    <AppButton v-if="state === 'signedOut'" tone="primary" :to="signInTo" class="max-md:w-full">
      {{ $t('orgMembership.signIn') }}
    </AppButton>

    <template v-else-if="state === 'canJoin' || state === 'canRequest'">
      <AppButton
        v-bind="lock.lockAttrs.value"
        tone="primary"
        class="max-md:w-full"
        :disabled="lock.isLocked.value"
        :loading="state === 'canJoin' && membership.isPending.value"
        :aria-describedby="
          lock.isLocked.value ? lock.noteId : state === 'canJoin' ? openLineId : undefined
        "
        @click="state === 'canJoin' ? membership.join() : openRequest()"
      >
        {{ $t(state === 'canJoin' ? 'orgMembership.join' : 'orgMembership.requestTitle') }}
      </AppButton>
      <OfficialLockNote v-if="lock.isLocked.value" :id="lock.noteId" />
      <p v-else-if="state === 'canJoin'" :id="openLineId" class="text-meta text-muted">
        {{ $t('orgMembership.openLine', { max: MAX_OPEN_ORGANIZATIONS }) }}
      </p>
    </template>

    <PendingRequestBlock
      v-else-if="state === 'pending'"
      :slug="organization.slug"
      :request-id="organization.viewer!.pendingRequestId!"
    />

    <Modal
      v-model:visible="isRequestOpen"
      :title="$t('orgMembership.requestTitle')"
      size="md"
      :closable="!membership.isPending.value"
    >
      <JoinRequestForm
        v-model="reason"
        :busy="membership.isPending.value"
        @submit="membership.request(reason)"
      />
      <p v-if="errorCopy" role="alert" class="mt-3 text-sm text-negative">
        <strong>{{ $t(errorCopy.title) }}</strong> {{ $t(errorCopy.body) }}
      </p>
    </Modal>
  </section>
</template>
