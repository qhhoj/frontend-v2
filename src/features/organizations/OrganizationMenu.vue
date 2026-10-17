<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OrganizationDetail } from '@/api/types/organizations';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import IconButton from '@/components/ui/IconButton.vue';
import { useAdminToast } from '@/features/admin/ui/feedback/use-admin-toast';
import OfficialLockNote from '@/features/official-mode/OfficialLockNote.vue';
import { useOfficialLock } from '@/features/official-mode/use-official-lock';
import { membershipErrorCopy } from './membership-errors';
import { useMembership } from './use-membership';

/**
 * The member's ⋯ menu in the organization header: "Rời tổ chức", a rare and destructive step, behind a confirm dialog. A failure
 * stays in the dialog; leaving closes it and says so in a toast.
 */
const props = defineProps<{ organization: OrganizationDetail }>();
const { t } = useI18n();
const toast = useAdminToast({ lazy: true });
const isLeaveOpen = ref(false);
const membership = useMembership(
  () => props.organization.slug,
  () => {
    isLeaveOpen.value = false;
    toast.show({ text: t('orgMembership.left', { name: props.organization.name }) });
  },
);
const lock = useOfficialLock();
const menu = ref<InstanceType<typeof Menu>>();
const isMenuOpen = ref(false);
/** Each try starts clean: an earlier failure is not shown again. */
function openLeave() {
  membership.reset();
  isLeaveOpen.value = true;
}
/** The ⋯ button goes with the membership: focus lands on the way back in (Join, or ask to join). */
const joinButton = () =>
  document.querySelector<HTMLElement>(
    '[data-testid="membership-panel"] button, [data-testid="membership-panel"] a',
  );
const items = computed<MenuItem[]>(() => [{ label: t('orgMembership.leave'), command: openLeave }]);
const errorCopy = computed(() =>
  membership.error.value ? membershipErrorCopy('leave', membership.error.value) : null,
);
const body = computed(() =>
  t(props.organization.isOpen ? 'orgMembership.leaveOpenBody' : 'orgMembership.privateLeave'),
);
</script>

<template>
  <div data-testid="organization-menu">
    <IconButton
      tone="secondary"
      :label="$t('orgMembership.menu')"
      aria-haspopup="menu"
      :aria-expanded="isMenuOpen"
      @click="menu?.toggle($event)"
    >
      <Ellipsis aria-hidden="true" class="size-4" />
    </IconButton>
    <Menu
      ref="menu"
      :model="items"
      popup
      :pt="{ root: { 'aria-label': $t('orgMembership.menu') } }"
      @show="isMenuOpen = true"
      @hide="isMenuOpen = false"
    />
    <ConfirmDialog
      v-model:visible="isLeaveOpen"
      tone="danger"
      :title="$t('orgMembership.leaveTitle', { name: organization.name })"
      :body="body"
      :confirm-label="$t('orgMembership.leave')"
      :busy="membership.isPending.value"
      :can-confirm="!lock.isLocked.value"
      :return-focus-to="joinButton"
      @confirm="membership.leave()"
    >
      <template #error>
        <OfficialLockNote v-if="lock.isLocked.value" :id="lock.noteId" />
        <p v-else-if="errorCopy" role="alert" class="text-sm text-negative">
          <strong>{{ $t(errorCopy.title) }}</strong> {{ $t(errorCopy.body) }}
        </p>
      </template>
    </ConfirmDialog>
  </div>
</template>
