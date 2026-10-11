<script setup lang="ts">
import { computed, ref } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../ui/AdminField.vue';
import MarkdownField from '../ui/MarkdownField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import UsernameChips from '../ui/UsernameChips.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import OrganizationContext from './OrganizationContext.vue';
import OrganizationLogoField from './OrganizationLogoField.vue';
import { MAX_ORGANIZATION_ADMINS } from './organization-form';
import { useOrganizationEditor } from './use-organization-editor';
import { useSlugFromName } from './use-slug-from-name';

const props = defineProps<{ slug: string | null }>();
/** The page decides where a saved organization lives (a new slug moves the URL). */
const emit = defineEmits<{ saved: [organization: OrganizationDetail] }>();
const editor = useOrganizationEditor(
  () => props.slug,
  (saved) => emit('saved', saved),
);
const { form, detail, errors, isCreate, canEditAll, isReadOnly, mutation } = editor;
const slugFill = isCreate ? useSlugFromName(form) : null;
const onSlugInput = () => slugFill?.onSlugInput();
function reset() {
  slugFill?.release();
  editor.reset();
}
const isSaved = ref(false);
const isLogoUploading = ref(false);
const staffLock = computed(() => (canEditAll.value ? undefined : 'judge.edit_all_organization'));
const titleKey = isCreate
  ? 'admin.organizations.editor.createTitle'
  : 'admin.organizations.editor.editTitle';

/** An empty box is no limit (`null`); a typed count is a whole number. */
const slotsText = computed({
  get: () => (form.slots === null ? '' : String(form.slots)),
  set: (text: string) => {
    form.slots = text.trim() === '' ? null : Number(text);
  },
});

async function submit() {
  if (isLogoUploading.value) return;
  isSaved.value = false;
  isSaved.value = await editor.save();
}
</script>

<template>
  <SettingsCard v-if="isReadOnly" :title="$t(titleKey)">
    <p>{{ $t('admin.organizations.editor.notYours') }}</p>
  </SettingsCard>
  <SettingsCard v-else :title="$t(titleKey)">
    <OrganizationContext v-if="detail" :organization="detail" />
    <p v-if="isCreate" data-testid="create-note" class="text-sm text-muted">
      {{
        canEditAll
          ? $t('admin.organizations.editor.createNoteStaff')
          : $t('admin.organizations.editor.createNote')
      }}
    </p>
    <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
      <div class="grid gap-4 md:grid-cols-2">
        <AdminField
          input-id="org-name"
          :label="$t('admin.organizations.editor.name')"
          :error="errors.name"
        >
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
          input-id="org-slug"
          :label="$t('admin.organizations.editor.slug')"
          :hint="$t('admin.organizations.editor.slugHint')"
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
              @input="onSlugInput"
            />
          </template>
        </AdminField>
        <AdminField
          input-id="org-shortName"
          :label="$t('admin.organizations.editor.shortName')"
          :hint="isCreate ? $t('admin.organizations.editor.shortNameCreateHint') : undefined"
          :error="errors.shortName"
        >
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="form.shortName"
              :class="ADMIN_INPUT_CLASS"
              maxlength="20"
              :disabled="!canEditAll"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </template>
        </AdminField>
        <AdminField
          input-id="org-slots"
          :label="$t('admin.organizations.editor.slots')"
          :hint="$t('admin.organizations.editor.slotsHint')"
          :error="errors.slots"
        >
          <template #default="{ id, describedBy, invalid }">
            <input
              :id="id"
              v-model="slotsText"
              type="number"
              min="0"
              max="1000000"
              :class="ADMIN_INPUT_CLASS"
              :disabled="!canEditAll"
              :aria-describedby="describedBy"
              :aria-invalid="invalid ? 'true' : undefined"
            />
          </template>
        </AdminField>
      </div>
      <MarkdownField
        v-model="form.about"
        :label="$t('admin.organizations.editor.about')"
        preview-style="organization"
        :preview-label="$t('admin.organizations.editor.aboutPreview')"
      />
      <OrganizationLogoField
        v-model="form.logoOverrideImage"
        v-model:uploading="isLogoUploading"
        :error="errors.logoOverrideImage"
      />
      <UsernameChips
        v-model="form.admins"
        :label="$t('admin.organizations.editor.admins', { max: MAX_ORGANIZATION_ADMINS })"
        :max="MAX_ORGANIZATION_ADMINS"
        :error="errors.adminIds"
      />
      <p class="-mt-3 text-xs text-muted">{{ $t('admin.organizations.editor.adminsHint') }}</p>
      <AdminSwitch v-model="form.isOpen" :label="$t('admin.organizations.editor.open')" />
      <AdminSwitch
        v-model="form.isUnlisted"
        :label="$t('admin.organizations.editor.unlisted')"
        :locked-by="staffLock"
      />
      <p v-if="!canEditAll" class="text-sm text-muted">
        {{ $t('admin.organizations.editor.staffOnly') }}
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-busy="mutation.isPending.value || undefined"
          :disabled="isLogoUploading"
        >
          {{
            isCreate
              ? $t('admin.organizations.editor.createSubmit')
              : $t('admin.organizations.editor.save')
          }}
        </button>
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="reset">
          {{ $t('admin.organizations.editor.reset') }}
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
