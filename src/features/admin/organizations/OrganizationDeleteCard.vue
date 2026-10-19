<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { deleteOrganization } from '@/api/organizations-admin.api';
import { useOrganizationQuery } from '@/features/organizations/organizations.queries';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../ui/controls';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import AdminFormSection from '../ui/form/AdminFormSection.vue';
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
const toast = useAdminToast();

const remove = useOrganizationWrite({
  mutate: deleteOrganization,
  onDone: async () => {
    isConfirmOpen.value = false;
    toast.show({ text: translate('admin.organizations.delete.done', { slug: props.slug }) });
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
  <div v-if="detail.data.value" :class="CARD">
    <AdminFormSection
      :title="$t('admin.organizations.delete.title')"
      :description="$t('admin.organizations.delete.lead')"
      :columns="1"
      danger
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <ul class="m-0 min-w-0 flex-1 basis-64 list-disc pl-5 text-sm text-muted">
          <li>{{ $t('admin.organizations.delete.keepsContent') }}</li>
          <li>{{ $t('admin.organizations.delete.hidesPosts') }}</li>
          <li>{{ $t('admin.organizations.delete.releasesMembers') }}</li>
        </ul>
        <button
          type="button"
          data-testid="delete-organization"
          :class="buttonClass('danger')"
          @click="open"
        >
          {{ $t('admin.organizations.delete.button') }}
        </button>
      </div>
    </AdminFormSection>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.organizations.delete.dialogTitle', { name: detail.data.value.name })"
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
            :class="[INPUT, 'font-mono']"
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
  </div>
</template>
