<script setup lang="ts">
import { ref } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import OrganizationLogoField from '@/features/admin/organizations/OrganizationLogoField.vue';
import { useOrganizationEditor } from '@/features/admin/organizations/use-organization-editor';
import AdminField from '@/features/admin/ui/AdminField.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import MarkdownField from '@/features/admin/ui/MarkdownField.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import {
  ADMIN_BUTTON_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_CLASS,
} from '@/features/admin/ui/classes';
import JoinModeField from './JoinModeField.vue';

/**
 * Legacy `OrganizationForm` for the organization's own administrators: logo, name, address, about and join mode. The staff
 * fields (short name, places, unlisted) stay on the admin editor, linked for `judge.edit_all_organization` holders.
 */
const props = defineProps<{ slug: string }>();
const emit = defineEmits<{ saved: [organization: OrganizationDetail] }>();
const editor = useOrganizationEditor(
  () => props.slug,
  (saved) => emit('saved', saved),
);
const { form, errors, canEditAll, mutation } = editor;
const isSaved = ref(false);

async function submit() {
  isSaved.value = false;
  const isSent = await editor.save();
  // An unchanged form sends nothing; it is as saved as it gets.
  isSaved.value = isSent || (!mutation.failure.value && Object.keys(errors.value).length === 0);
}
function reset() {
  isSaved.value = false;
  editor.reset();
}
</script>

<template>
  <SettingsCard :title="$t('orgAdmin.info.title')">
    <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
      <OrganizationLogoField v-model="form.logoOverrideImage" :error="errors.logoOverrideImage" />
      <div class="grid gap-4 md:grid-cols-2">
        <AdminField input-id="org-info-name" :label="$t('orgAdmin.info.name')" :error="errors.name">
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.name"
              :class="ADMIN_INPUT_CLASS"
              maxlength="128"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </template>
        </AdminField>
        <AdminField
          input-id="org-info-slug"
          :label="$t('orgAdmin.info.slug')"
          :hint="$t('orgAdmin.info.slugHint')"
          :error="errors.slug"
        >
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.slug"
              :class="`${ADMIN_INPUT_CLASS} font-mono`"
              maxlength="128"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </template>
        </AdminField>
      </div>
      <MarkdownField
        v-model="form.about"
        :label="$t('orgAdmin.info.about')"
        preview-style="organization"
        :preview-label="$t('orgAdmin.info.aboutPreview')"
      />
      <JoinModeField v-model="form.isOpen" />
      <div class="flex flex-wrap items-center justify-end gap-3">
        <RouterLink
          v-if="canEditAll"
          :to="{ name: 'admin-organizations', query: { org: slug } }"
          class="mr-auto text-sm font-semibold text-accent-text hover:underline"
        >
          {{ $t('orgAdmin.info.staffLink') }}
        </RouterLink>
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="reset">
          {{ $t('orgAdmin.info.reset') }}
        </button>
        <button
          type="submit"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-busy="mutation.isPending.value || undefined"
        >
          {{ $t('orgAdmin.info.save') }}
        </button>
      </div>
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
      <AdminStatus v-else-if="isSaved" kind="done" :text="$t('admin.ui.saved')" />
    </form>
  </SettingsCard>
</template>
