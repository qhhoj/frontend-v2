<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { deleteOrganization } from '@/api/organizations-admin.api';
import { useOrganizationQuery } from '@/features/organizations/organizations.queries';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_DANGER_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';
import { useOrganizationWrite } from './organization-write';

/** Superusers only (the backend refuses everyone else): a soft delete, confirmed by typing the slug. */
const props = defineProps<{
  slug: string;
  /** The page leaves the editor; awaited before the organization queries refresh, so the deleted slug is never refetched. */
  onDeleted: () => Promise<unknown>;
}>();
const queryClient = useQueryClient();
const detail = useOrganizationQuery(() => props.slug);
const isConfirmOpen = ref(false);
const typedSlug = ref('');
const isSlugTyped = computed(() => typedSlug.value.trim() === props.slug);

const remove = useOrganizationWrite({
  mutate: deleteOrganization,
  onDone: async () => {
    isConfirmOpen.value = false;
    await props.onDeleted();
    // The delete also unlinks problems, contests and posts, releases members and leaves the quota overview.
    await Promise.all(
      ['organizations', 'admin', 'problems', 'contests', 'users', 'posts'].map((root) =>
        queryClient.invalidateQueries({ queryKey: [root] }),
      ),
    );
  },
});

/** The opener leaves with the organization: focus lands on the list's first link instead. */
const listFocusTarget = () =>
  document.querySelector<HTMLElement>(
    '[data-testid="org-list"] a, [data-testid="org-list"] button',
  );

function open() {
  typedSlug.value = '';
  remove.reset();
  isConfirmOpen.value = true;
}
</script>

<template>
  <SettingsCard v-if="detail.data.value" :title="$t('admin.organizations.delete.title')">
    <p class="text-sm">{{ $t('admin.organizations.delete.lead') }}</p>
    <ul class="list-disc pl-5 text-sm text-muted">
      <li>{{ $t('admin.organizations.delete.keepsContent') }}</li>
      <li>{{ $t('admin.organizations.delete.hidesPosts') }}</li>
      <li>{{ $t('admin.organizations.delete.releasesMembers') }}</li>
    </ul>
    <div>
      <button
        type="button"
        data-testid="delete-organization"
        :class="ADMIN_DANGER_CLASS"
        @click="open"
      >
        {{ $t('admin.organizations.delete.button') }}
      </button>
    </div>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.organizations.delete.dialogTitle', { name: detail.data.value.name })"
      :confirm-label="$t('admin.organizations.delete.confirm')"
      tone="danger"
      :busy="remove.isPending.value"
      :can-confirm="isSlugTyped"
      :return-focus-to="listFocusTarget"
      @confirm="remove.run(slug)"
    >
      <AdminField
        input-id="org-delete-slug"
        :label="$t('admin.organizations.delete.typeSlug', { slug })"
      >
        <template #default="{ id, describedBy }">
          <input
            :id="id"
            v-model="typedSlug"
            :class="`${ADMIN_INPUT_CLASS} font-mono`"
            autocomplete="off"
            :aria-describedby="describedBy"
          />
        </template>
      </AdminField>
      <template #error>
        <AdminStatus
          v-if="remove.failure.value"
          kind="refused"
          :text="failureTextOf(remove.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </SettingsCard>
</template>
