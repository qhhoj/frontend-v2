<script setup lang="ts">
import { ref } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import OrganizationLogoField from '@/features/admin/organizations/OrganizationLogoField.vue';
import { useOrganizationEditor } from '@/features/admin/organizations/use-organization-editor';
import AdminField from '@/features/admin/ui/AdminField.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import MarkdownField from '@/features/admin/ui/MarkdownField.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '@/features/admin/ui/classes';
import AdminSaveBar from '@/features/admin/ui/form/AdminSaveBar.vue';
import JoinModeField from './JoinModeField.vue';

/**
 * Legacy `OrganizationForm` for the organization's own administrators: logo, name, address, about and join mode. The staff
 * fields (short name, places, unlisted) stay on the admin editor, linked for `judge.edit_all_organization` holders.
 * The parent supplies the title (the Quản lý page's "Cài đặt" fold); the save bar sticks to the bottom while the form scrolls.
 */
const props = defineProps<{ slug: string }>();
const emit = defineEmits<{ saved: [organization: OrganizationDetail] }>();
const editor = useOrganizationEditor(
  () => props.slug,
  (saved) => emit('saved', saved),
);
const { form, errors, canEditAll, mutation, dirtyCount } = editor;
const savedAt = ref<Date | null>(null);

async function submit() {
  if (await editor.save()) savedAt.value = new Date();
}
</script>

<template>
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
    <RouterLink
      v-if="canEditAll"
      :to="{ name: 'admin-organizations', query: { org: slug } }"
      class="self-start text-sm font-semibold text-accent-text hover:underline"
    >
      {{ $t('orgAdmin.info.staffLink') }}
    </RouterLink>
    <AdminStatus
      v-if="mutation.failure.value"
      kind="refused"
      :text="failureTextOf(mutation.failure.value)"
    />
    <AdminSaveBar
      :dirty-count="dirtyCount"
      :pending="mutation.isPending.value"
      :saved-at="savedAt"
      :save-label="$t('orgAdmin.info.save')"
      @discard="editor.reset()"
    />
  </form>
</template>
