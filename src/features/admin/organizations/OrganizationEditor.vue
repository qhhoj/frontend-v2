<script setup lang="ts">
import { computed, ref } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import AdminSwitch from '../ui/AdminSwitch.vue';
import UsernameChips from '../ui/UsernameChips.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { MAX_ORGANIZATION_ADMINS } from './organization-form';
import { useOrganizationEditor } from './use-organization-editor';

const props = defineProps<{ slug: string | null }>();
const editor = useOrganizationEditor(() => props.slug);
const { form, errors, isCreate, canEditAll, mutation } = editor;
const isSaved = ref(false);
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
  isSaved.value = false;
  isSaved.value = await editor.save();
}
</script>

<template>
  <SettingsCard :title="$t(titleKey)">
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
      <AdminField input-id="org-about" :label="$t('admin.organizations.editor.about')">
        <template #default="{ id }">
          <textarea
            :id="id"
            v-model="form.about"
            rows="6"
            class="w-full rounded-row border border-line-strong bg-surface-solid p-3 text-content"
          ></textarea>
        </template>
      </AdminField>
      <AdminField
        input-id="org-logo"
        :label="$t('admin.organizations.editor.logo')"
        :error="errors.logoOverrideImage"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="form.logoOverrideImage"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
          />
        </template>
      </AdminField>
      <UsernameChips
        v-model="form.admins"
        :label="$t('admin.organizations.editor.admins', { max: MAX_ORGANIZATION_ADMINS })"
        :max="MAX_ORGANIZATION_ADMINS"
        :error="errors.adminIds"
      />
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
        >
          {{
            isCreate
              ? $t('admin.organizations.editor.createSubmit')
              : $t('admin.organizations.editor.save')
          }}
        </button>
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="editor.reset()">
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
