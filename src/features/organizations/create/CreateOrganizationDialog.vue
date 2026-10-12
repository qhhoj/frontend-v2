<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import FormField from '@/components/ui/FormField.vue';
import TextArea from '@/components/ui/TextArea.vue';
import TextInput from '@/components/ui/TextInput.vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import { useOrganizationEditor } from '@/features/admin/organizations/use-organization-editor';
import { useSlugFromName } from '@/features/admin/organizations/use-slug-from-name';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import JoinModeField from '../manage/JoinModeField.vue';

/**
 * Legacy `CreateOrganization` (`judge.add_organization`) as the mock-up's dialog on /organizations. The backend makes the
 * creator its first admin and adds them to the Org Admin role; the three-organization cap answers 403 `admin_cap`.
 */
const visible = defineModel<boolean>('visible', { required: true });
const router = useRouter();
const editor = useOrganizationEditor(
  () => null,
  (saved: OrganizationDetail) =>
    router.push({ name: 'organization-manage', params: { slug: saved.slug } }),
);
const { form, errors, mutation } = editor;
const slugFill = useSlugFromName(form);
const canConfirm = computed(() => form.name.trim() !== '' && form.slug !== '');

async function create() {
  if (await editor.save()) visible.value = false;
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('orgAdmin.create.title')"
    :confirm-label="$t('orgAdmin.create.submit')"
    :busy="mutation.isPending.value"
    :can-confirm="canConfirm"
    :width="560"
    @confirm="create"
  >
    <div class="flex flex-col gap-4">
      <p class="text-muted">{{ $t('orgAdmin.create.lead') }}</p>
      <FormField
        input-id="org-create-name"
        :label="$t('orgAdmin.create.name')"
        :error="errors.name"
      >
        <TextInput v-model="form.name" maxlength="128" />
      </FormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField
          input-id="org-create-slug"
          :label="$t('orgAdmin.create.slug')"
          :hint="$t('orgAdmin.create.slugHint', { slug: form.slug || '…' })"
          :error="errors.slug"
        >
          <TextInput
            v-model="form.slug"
            class="font-mono"
            maxlength="128"
            @input="slugFill.onSlugInput"
          />
        </FormField>
        <JoinModeField v-model="form.isOpen" />
      </div>
      <FormField input-id="org-create-about" :label="$t('orgAdmin.create.about')">
        <TextArea v-model="form.about" rows="3" />
      </FormField>
      <p class="text-xs text-muted">{{ $t('orgAdmin.create.unlistedNote') }}</p>
    </div>
    <template #error>
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
    </template>
  </ConfirmDialog>
</template>
