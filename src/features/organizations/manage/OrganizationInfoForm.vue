<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { useOrganizationEditor } from '@/features/admin/organizations/use-organization-editor';
import AdminField from '@/features/admin/ui/AdminField.vue';
import AdminStatus from '@/features/admin/ui/AdminStatus.vue';
import MarkdownField from '@/features/admin/ui/MarkdownField.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { BUTTON, INPUT } from '@/features/admin/ui/controls';
import JoinModeField from './JoinModeField.vue';
import OrganizationAvatarField from './OrganizationAvatarField.vue';
import OrganizationSettingsSection from './OrganizationSettingsSection.vue';

/**
 * Legacy `OrganizationForm` for the organization's own administrators: logo, name, address, about and join mode, in a two-column
 * settings card (section title left, controls right). Save stays aria-disabled until something changed. The staff
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
const isLogoUploading = ref(false);
const isDirty = computed(() => editor.dirtyCount.value > 0);
/** The address prefix is the site's own: the page's host and the organization route. */
const SLUG_PREFIX = `${window.location.host}/organizations/`;
/** The warning shows only for an address that differs from the saved one. */
const isSlugChanged = computed(() => form.slug !== props.slug);
const isSaveBlocked = computed(() => !isDirty.value || isLogoUploading.value);

async function submit() {
  if (isSaveBlocked.value) return;
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
    <form class="flex flex-col gap-6" novalidate @submit.prevent="submit">
      <div class="flex flex-col divide-y divide-line">
        <OrganizationSettingsSection
          :title="$t('orgAdmin.info.avatar')"
          :description="$t('orgAdmin.info.avatarLead')"
        >
          <OrganizationAvatarField
            v-model="form.logoOverrideImage"
            v-model:uploading="isLogoUploading"
            :name="form.name"
            :slug="slug"
            :error="errors.logoOverrideImage"
          />
        </OrganizationSettingsSection>
        <OrganizationSettingsSection
          :title="$t('orgAdmin.info.identity')"
          :description="$t('orgAdmin.info.identityLead')"
        >
          <AdminField
            input-id="org-info-name"
            :label="$t('orgAdmin.info.name')"
            :error="errors.name"
          >
            <template #default="{ id, describedBy, invalid }">
              <input
                :id="id"
                v-model="form.name"
                :class="INPUT"
                maxlength="128"
                :aria-describedby="describedBy"
                :aria-invalid="invalid ? 'true' : undefined"
              />
            </template>
          </AdminField>
          <AdminField
            input-id="org-info-slug"
            :label="$t('orgAdmin.info.slug')"
            :error="errors.slug"
          >
            <template #default="{ id, describedBy, invalid }">
              <div
                class="flex min-w-0 flex-col items-stretch rounded-cell sm:flex-row border border-line-strong bg-surface-solid focus-within:ring-2 focus-within:ring-accent has-[[aria-invalid=true]]:border-negative"
              >
                <span
                  aria-hidden="true"
                  class="flex min-h-9 shrink-0 items-center rounded-t-cell border-b border-line bg-surface-strong px-3 font-mono text-sm break-all text-muted sm:rounded-l-cell sm:rounded-tr-none sm:border-r sm:border-b-0"
                >
                  {{ SLUG_PREFIX }}
                </span>
                <input
                  :id="id"
                  v-model="form.slug"
                  class="min-h-[var(--qa-control,2.25rem)] min-w-0 flex-1 rounded-b-cell bg-transparent sm:rounded-r-cell sm:rounded-bl-none px-3 font-mono text-sm text-content outline-none"
                  maxlength="128"
                  :aria-describedby="describedBy"
                  :aria-invalid="invalid ? 'true' : undefined"
                />
              </div>
              <p v-if="isSlugChanged" role="status" class="flex items-start gap-1.5 text-xs">
                <TriangleAlert
                  class="mt-0.5 size-3.5 shrink-0 text-caution-strong"
                  aria-hidden="true"
                  :stroke-width="1.75"
                />
                <span>{{ $t('orgAdmin.info.slugWarning') }}</span>
              </p>
            </template>
          </AdminField>
        </OrganizationSettingsSection>
        <OrganizationSettingsSection
          :title="$t('orgAdmin.info.aboutTitle')"
          :description="$t('orgAdmin.info.aboutLead')"
        >
          <MarkdownField
            v-model="form.about"
            layout="tabs"
            :label="$t('orgAdmin.info.about')"
            preview-style="organization"
          />
        </OrganizationSettingsSection>
        <OrganizationSettingsSection
          :title="$t('orgAdmin.joinMode.label')"
          :description="$t('orgAdmin.info.joinLead')"
        >
          <JoinModeField v-model="form.isOpen" />
        </OrganizationSettingsSection>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-3">
        <RouterLink
          v-if="canEditAll"
          :to="{ name: 'admin-organizations', query: { org: slug } }"
          class="mr-auto text-sm font-semibold text-accent-text hover:underline"
        >
          {{ $t('orgAdmin.info.staffLink') }}
        </RouterLink>
        <button type="button" :class="BUTTON.secondary" @click="reset">
          {{ $t('orgAdmin.info.reset') }}
        </button>
        <button
          type="submit"
          :class="BUTTON.primary"
          :aria-disabled="isSaveBlocked || undefined"
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
