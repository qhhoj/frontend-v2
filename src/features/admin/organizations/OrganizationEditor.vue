<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';
import type { OrganizationDetail } from '@/api/types/organizations';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import MarkdownField from '../ui/MarkdownField.vue';
import UsernameChips from '../ui/UsernameChips.vue';
import { failureTextOf } from '../ui/admin-errors';
import { CARD, INPUT } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import AdminFormSection from '../ui/form/AdminFormSection.vue';
import AdminLeaveDialog from '../ui/form/AdminLeaveDialog.vue';
import AdminLeaveGuard from '../ui/form/AdminLeaveGuard.vue';
import { useQueryLeaveGuard } from '../ui/form/use-query-leave-guard';
import AdminSaveBar from '../ui/form/AdminSaveBar.vue';
import { needsPermissionText } from '../ui/permission-text';
import OrganizationContext from './OrganizationContext.vue';
import OrganizationFlagField from './OrganizationFlagField.vue';
import OrganizationLogoField from './OrganizationLogoField.vue';
import { MAX_ORGANIZATION_ADMINS } from './organization-form';
import { numberBoxValue } from '../ui/form/number-box';
import { organizationPanelOf } from './organization-search';
import { useOrganizationEditor } from './use-organization-editor';
import { useSlugFromName } from './use-slug-from-name';

const props = defineProps<{ slug: string | null }>();
/** The page decides where a saved organization lives (a new slug moves the URL). */
const emit = defineEmits<{ saved: [organization: OrganizationDetail] }>();
const toast = useAdminToast();
const savedAt = ref<Date | null>(null);
const editor = useOrganizationEditor(
  () => props.slug,
  (saved) => {
    savedAt.value = new Date();
    toast.show({ text: translate('admin.organizations.editor.saved', { name: saved.name }) });
    emit('saved', saved);
  },
);
const { form, detail, errors, isCreate, canEditAll, isReadOnly, dirtyCount, mutation } = editor;
const slugFill = isCreate ? useSlugFromName(form) : null;
const onSlugInput = () => slugFill?.onSlugInput();
function discard() {
  slugFill?.release();
  editor.reset();
}
const isLogoUploading = ref(false);
const staffLockText = computed(() =>
  canEditAll.value ? undefined : needsPermissionText('judge.edit_all_organization'),
);

/** Another organization, or a tab other than this form, unmounts it. */
const leavesForm = (to: RouteLocationNormalized, from: RouteLocationNormalized) =>
  to.query.org !== from.query.org || organizationPanelOf(to.query) !== 'info';
const queryGuard = useQueryLeaveGuard(() => dirtyCount.value > 0, leavesForm);

/** An empty box is no limit (`null`); a typed count is a whole number. `v-model` on a number box hands back a number. */

/** The save bar's button is a submit: a clean edit or a running upload sends nothing. */
function submit() {
  if (isLogoUploading.value || (!isCreate && dirtyCount.value === 0)) return;
  void editor.save();
}
const fieldAttrs = (invalid: unknown, describedBy: string | undefined) => ({
  'aria-describedby': describedBy,
  'aria-invalid': invalid ? ('true' as const) : undefined,
});
</script>

<template>
  <AdminNotice v-if="isReadOnly" tone="info" :title="$t('admin.organizations.editor.notYours')" />
  <form v-else class="flex flex-col gap-4" novalidate @submit.prevent="submit">
    <OrganizationContext v-if="detail" :organization="detail" />
    <AdminNotice
      v-if="isCreate"
      data-testid="create-note"
      tone="info"
      :title="
        canEditAll
          ? $t('admin.organizations.editor.createNoteStaff')
          : $t('admin.organizations.editor.createNote')
      "
    />
    <div :class="CARD">
      <AdminFormSection :title="$t('admin.organizations.editor.sections.identity')">
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="org-name"
          :label="$t('admin.organizations.editor.name')"
          :error="errors.name"
          required
        >
          <input
            :id="id"
            v-model="form.name"
            :class="INPUT"
            maxlength="128"
            v-bind="fieldAttrs(invalid, describedBy)"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="org-slug"
          :label="$t('admin.organizations.editor.slug')"
          :hint="$t('admin.organizations.editor.slugHint')"
          :error="errors.slug"
          required
        >
          <input
            :id="id"
            v-model="form.slug"
            :class="[INPUT, 'font-mono']"
            maxlength="128"
            v-bind="fieldAttrs(invalid, describedBy)"
            @input="onSlugInput"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="org-shortName"
          :label="$t('admin.organizations.editor.shortName')"
          :hint="
            staffLockText ??
            (isCreate ? $t('admin.organizations.editor.shortNameCreateHint') : undefined)
          "
          :error="errors.shortName"
        >
          <input
            :id="id"
            v-model="form.shortName"
            :class="INPUT"
            maxlength="20"
            :disabled="!canEditAll"
            v-bind="fieldAttrs(invalid, describedBy)"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="org-slots"
          :label="$t('admin.organizations.editor.slots')"
          :hint="staffLockText ?? $t('admin.organizations.editor.slotsHint')"
          :error="errors.slots"
        >
          <input
            :id="id"
            
            :value="form.slots ?? ''"
            type="number"
            min="0"
            max="1000000"
            :class="[INPUT, 'font-mono']"
            :disabled="!canEditAll"
            v-bind="fieldAttrs(invalid, describedBy)"
            @input="form.slots = numberBoxValue($event)"
          />
        </AdminField>
        <div class="lg:col-span-2">
          <MarkdownField
            v-model="form.about"
            :label="$t('admin.organizations.editor.about')"
            preview-style="organization"
            :preview-label="$t('admin.organizations.editor.aboutPreview')"
          />
        </div>
        <div class="lg:col-span-2">
          <OrganizationLogoField
            v-model="form.logoOverrideImage"
            v-model:uploading="isLogoUploading"
            :error="errors.logoOverrideImage"
          />
        </div>
      </AdminFormSection>
      <AdminFormSection
        :title="$t('admin.organizations.editor.sections.access')"
        :description="$t('admin.organizations.editor.adminsHint')"
        :columns="1"
      >
        <UsernameChips
          v-model="form.admins"
          :label="$t('admin.organizations.editor.admins', { max: MAX_ORGANIZATION_ADMINS })"
          :max="MAX_ORGANIZATION_ADMINS"
          :error="errors.adminIds"
        />
        <OrganizationFlagField
          v-model="form.isOpen"
          input-id="org-open"
          :label="$t('admin.organizations.editor.open')"
          :hint="$t('admin.organizations.editor.openHint')"
        />
        <OrganizationFlagField
          v-model="form.isUnlisted"
          input-id="org-unlisted"
          :label="$t('admin.organizations.editor.unlisted')"
          :hint="staffLockText ?? $t('admin.organizations.editor.unlistedHint')"
          :disabled="!canEditAll"
        />
      </AdminFormSection>
    </div>
    <AdminStatus
      v-if="mutation.failure.value"
      kind="refused"
      :text="failureTextOf(mutation.failure.value)"
    />
    <AdminSaveBar
      class="mx-0! rounded-row border"
      :dirty-count="dirtyCount"
      :pending="mutation.isPending.value"
      :saved-at="savedAt"
      :allow-clean="isCreate"
      :blocked-reason="isLogoUploading ? $t('admin.organizations.editor.logoUploading') : undefined"
      :save-label="
        isCreate
          ? $t('admin.organizations.editor.createSubmit')
          : $t('admin.organizations.editor.save')
      "
      @discard="discard"
    />
    <AdminLeaveGuard :dirty-count="dirtyCount" />
    <AdminLeaveDialog
      v-model:visible="queryGuard.isLeaveOpen.value"
      :count="dirtyCount"
      @leave="queryGuard.leaveAnyway"
    />
  </form>
</template>
