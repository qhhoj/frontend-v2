<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed, ref, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OrganizationDetail } from '@/api/types/organizations';
import FormField from '@/components/ui/FormField.vue';
import SaveBar from '@/components/ui/SaveBar.vue';
import TextInput from '@/components/ui/TextInput.vue';
import Card from '@/components/ui/Card.vue';
import Notice from '@/components/ui/Notice.vue';
import { useOrganizationEditor } from '@/features/admin/organizations/use-organization-editor';
import AdminLeaveGuard from '@/features/admin/ui/form/AdminLeaveGuard.vue';
import MarkdownField from '@/features/admin/ui/MarkdownField.vue';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import JoinModeField from './JoinModeField.vue';
import OrganizationAvatarField from './OrganizationAvatarField.vue';
import OrganizationSettingsSection from './OrganizationSettingsSection.vue';

/**
 * Legacy `OrganizationForm` for the organization's own administrators: logo, name, address, about and join mode, in a two-column
 * settings card (section title left, controls right), folded until opened (the join requests come first, the
 * profile is edited rarely), then the save bar. The heading sits above the fold, so heading navigation finds it closed;
 * the fold stays open while edits are unsaved, so the save bar cannot be hidden with changes pending: save stays aria-disabled until something changed. The staff
 * fields (short name, places, unlisted) stay on the admin editor, linked for `judge.edit_all_organization` holders.
 */
const props = defineProps<{ slug: string }>();
const emit = defineEmits<{ saved: [organization: OrganizationDetail] }>();
const editor = useOrganizationEditor(
  () => props.slug,
  (saved) => emit('saved', saved),
);
const { form, errors, canEditAll, mutation } = editor;
const { t } = useI18n();
const savedAt = ref<Date | null>(null);
const isLogoUploading = ref(false);
const isDirty = computed(() => editor.dirtyCount.value > 0);
const blockedReason = computed(() =>
  isLogoUploading.value ? t('orgAdmin.info.logoUploading') : undefined,
);
/** The address prefix is the site's own: the page's host and the organization route. */
const SLUG_PREFIX = `${window.location.host}/organizations/`;
/** The warning shows only for an address that differs from the saved one. */
const isSlugChanged = computed(() => form.slug !== props.slug);
const isSaveBlocked = computed(() => !isDirty.value || isLogoUploading.value);
const headingId = useId();
/** The viewer's own open/closed choice; unsaved edits keep the fold open whatever it is. */
const isOpenChosen = ref(false);
const isOpen = computed(() => isDirty.value || isOpenChosen.value);
/** The summary's click (Enter and Space click it too) toggles through Vue, so `open` never drifts from `isOpen`. */
function toggleFold() {
  isOpenChosen.value = isDirty.value || !isOpenChosen.value;
}

async function submit() {
  if (isSaveBlocked.value) return;
  savedAt.value = null;
  const isSent = await editor.save();
  // An unchanged form sends nothing; it is as saved as it gets.
  const isSaved = isSent || (!mutation.failure.value && Object.keys(errors.value).length === 0);
  savedAt.value = isSaved ? new Date() : null;
}
function reset() {
  savedAt.value = null;
  editor.reset();
}
</script>

<template>
  <section :aria-labelledby="headingId" class="flex flex-col gap-3">
    <h3 :id="headingId" class="font-display text-base font-semibold">
      {{ $t('orgAdmin.info.title') }}
    </h3>
    <Card as="details" data-testid="org-info" class="group" :open="isOpen">
      <summary
        class="flex min-h-11 cursor-pointer list-none items-center gap-3 px-5 py-3 text-sm md:px-7 [&::-webkit-details-marker]:hidden"
        @click.prevent="toggleFold"
      >
        <ChevronDown
          aria-hidden="true"
          class="size-4 shrink-0 -rotate-90 text-muted transition-transform group-open:rotate-0"
        />
        <span class="text-muted">{{ $t('orgAdmin.info.foldLead') }}</span>
      </summary>
      <form
        class="flex flex-col gap-6 px-5 pb-5 md:px-7 md:pb-7"
        novalidate
        @submit.prevent="submit"
      >
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
            <FormField
              input-id="org-info-name"
              :label="$t('orgAdmin.info.name')"
              :error="errors.name"
            >
              <TextInput v-model="form.name" maxlength="128" />
            </FormField>
            <FormField
              input-id="org-info-slug"
              :label="$t('orgAdmin.info.slug')"
              :error="errors.slug"
            >
              <template #default>
                <TextInput v-model="form.slug" maxlength="128" class="font-mono">
                  <template #prefix>
                    <span aria-hidden="true" class="font-mono text-base break-all">{{
                      SLUG_PREFIX
                    }}</span>
                  </template>
                </TextInput>
                <Notice v-if="isSlugChanged" tone="warning" inline role="status">
                  {{ $t('orgAdmin.info.slugWarning') }}
                </Notice>
              </template>
            </FormField>
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
        <RouterLink
          v-if="canEditAll"
          :to="{ name: 'admin-organizations', query: { org: slug } }"
          class="w-fit text-sm font-semibold text-accent-text hover:underline"
        >
          {{ $t('orgAdmin.info.staffLink') }}
        </RouterLink>
        <Notice v-if="mutation.failure.value" tone="danger">
          {{ failureTextOf(mutation.failure.value) }}
        </Notice>
        <SaveBar
          :dirty-count="editor.dirtyCount.value"
          :pending="mutation.isPending.value"
          :saved-at="savedAt"
          :blocked-reason="blockedReason"
          :save-label="$t('common.save')"
          @discard="reset"
        />
      </form>
    </Card>
    <AdminLeaveGuard :dirty-count="editor.dirtyCount.value" />
  </section>
</template>
