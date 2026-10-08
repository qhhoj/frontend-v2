<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { MAX_OPEN_ORGANIZATIONS } from '@/api/types/organizations';
import type { OrganizationDetail } from '@/api/types/organizations';
import StatePanel from '@/components/StatePanel.vue';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';
import JoinRequestForm from './JoinRequestForm.vue';
import PendingRequestBlock from './PendingRequestBlock.vue';
import { membershipErrorCopy } from './membership-errors';
import { membershipState } from './membership-state';
import { useMembership } from './use-membership';

/** The viewer's one membership panel in the organization header: join, request, pending, member or administrator. */
const props = defineProps<{ organization: OrganizationDetail }>();
const route = useRoute();
const session = useSessionStore();
const membership = useMembership(() => props.organization.slug);
const reason = ref('');
const panel = ref<HTMLElement>();
const state = computed(() => membershipState(props.organization, session.user !== null));
const joined = computed(() => membership.succeeded.value && membership.action.value === 'join');
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
    if (error) void nextTick(() => panel.value?.focus());
  },
);
const retry = () => {
  const kind = membership.action.value;
  if (kind === 'join') membership.join();
  else if (kind === 'leave') membership.leave();
  else if (kind === 'request') membership.request(reason.value);
};
</script>

<template>
  <section
    ref="panel"
    data-testid="membership-panel"
    tabindex="-1"
    class="flex w-full flex-col gap-3 md:w-72"
  >
    <StatePanel
      v-if="joined"
      kind="success"
      :title="$t('orgMembership.joined', { name: organization.shortName })"
    />
    <StatePanel
      v-if="errorCopy"
      kind="error"
      :title="$t(errorCopy.title)"
      :body="$t(errorCopy.body)"
    >
      <button
        type="button"
        class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
        @click="retry"
      >
        {{ $t('orgMembership.retry') }}
      </button>
    </StatePanel>

    <RouterLink
      v-if="state === 'signedOut'"
      :to="signInTo"
      class="inline-flex min-h-11 w-full items-center justify-center rounded-pill bg-accent px-5 font-semibold text-on-accent"
    >
      {{ $t('orgMembership.signIn') }}
    </RouterLink>

    <template v-else-if="state === 'canJoin'">
      <p class="text-sm text-muted">
        {{ $t('orgMembership.openLine', { max: MAX_OPEN_ORGANIZATIONS }) }}
      </p>
      <button
        type="button"
        :aria-busy="membership.isPending.value"
        class="inline-flex min-h-11 w-full items-center justify-center rounded-pill bg-accent px-5 font-semibold text-on-accent"
        @click="membership.join()"
      >
        {{ $t('orgMembership.join') }}
      </button>
    </template>

    <template v-else-if="state === 'canRequest'">
      <h2 class="font-display text-lg font-semibold">{{ $t('orgMembership.requestTitle') }}</h2>
      <JoinRequestForm
        v-model="reason"
        :busy="membership.isPending.value"
        @submit="membership.request(reason)"
      />
    </template>

    <PendingRequestBlock
      v-else-if="state === 'pending'"
      :slug="organization.slug"
      :request-id="organization.viewer!.pendingRequestId!"
    />

    <template v-else-if="state === 'member'">
      <p class="inline-flex items-center gap-2 font-semibold">
        <Check aria-hidden="true" class="size-5 text-accent-text" />
        {{ $t('orgMembership.isMember') }}
      </p>
      <p v-if="!organization.isOpen" class="text-sm text-muted">
        {{ $t('orgMembership.privateLeave') }}
      </p>
      <button
        type="button"
        :aria-busy="membership.isPending.value"
        class="inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
        @click="membership.leave()"
      >
        {{ $t('orgMembership.leave') }}
      </button>
    </template>

    <template v-else-if="state === 'administrator'">
      <span
        class="w-fit rounded-pill bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-soft-text"
      >
        {{ $t('orgMembership.administrator') }}
      </span>
      <p class="text-sm text-muted">{{ $t('orgMembership.adminLine') }}</p>
      <RouterLink
        :to="`/admin/organizations/${organization.slug}`"
        class="inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
      >
        {{ $t('orgMembership.edit') }}
      </RouterLink>
    </template>
  </section>
</template>
