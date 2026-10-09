<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminField from '../ui/AdminField.vue';
import type { FieldErrors } from '../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { megabytesOf } from './language-form';
import type { LanguageForm } from './language-form';

defineProps<{ errors: FieldErrors }>();
const form = defineModel<LanguageForm>('form', { required: true });
const { t } = useI18n();
const locale = useLocaleStore();
const megabytes = computed(() => megabytesOf(form.value.fileSizeLimit));
/** The byte range always; the megabytes only while the typed number is valid. */
const fileSizeHint = computed(() => {
  const range = t('admin.languages.form.hints.fileSize');
  if (megabytes.value === null) return range;
  const shown = t('admin.languages.form.hints.fileSizeMb', {
    megabytes: formatNumber(megabytes.value, locale.locale),
  });
  return `${range} · ${shown}`;
});
</script>

<template>
  <SettingsCard :title="$t('admin.languages.form.groups.editor')">
    <div class="grid gap-5 md:grid-cols-2">
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.ace')"
        input-id="language-ace"
        :hint="$t('admin.languages.form.hints.editor')"
        :error="errors.ace"
      >
        <input
          :id="id"
          v-model="form.ace"
          type="text"
          class="font-mono"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.pygments')"
        input-id="language-pygments"
        :hint="$t('admin.languages.form.hints.editor')"
        :error="errors.pygments"
      >
        <input
          :id="id"
          v-model="form.pygments"
          type="text"
          class="font-mono"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.extension')"
        input-id="language-extension"
        :hint="$t('admin.languages.form.hints.extension')"
        :error="errors.extension"
      >
        <input
          :id="id"
          v-model="form.extension"
          type="text"
          class="font-mono"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.fileSize')"
        input-id="language-fileSizeLimit"
        :hint="fileSizeHint"
        :error="errors.fileSizeLimit"
      >
        <input
          :id="id"
          v-model="form.fileSizeLimit"
          type="text"
          inputmode="numeric"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <div class="flex flex-col gap-3 md:col-span-2">
        <label class="flex min-h-11 items-center gap-2">
          <input id="language-fileOnly" v-model="form.fileOnly" type="checkbox" class="size-5" />
          {{ $t('admin.languages.form.labels.fileOnly') }}
        </label>
        <label class="flex min-h-11 items-center gap-2">
          <input
            id="language-includeInProblem"
            v-model="form.includeInProblem"
            type="checkbox"
            class="size-5"
          />
          {{ $t('admin.languages.form.labels.includeInProblem') }}
        </label>
      </div>
    </div>
  </SettingsCard>
</template>
