<script setup lang="ts">
import { computed } from 'vue';
import AdminFormSection from '../ui/form/AdminFormSection.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminField from '../ui/AdminField.vue';
import type { FieldErrors } from '../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { LANGUAGE_LIMITS, codePointsOf } from './language-form';
import type { LanguageForm } from './language-form';

defineProps<{ errors: FieldErrors }>();
const form = defineModel<LanguageForm>('form', { required: true });
const locale = useLocaleStore();
const textLimitText = computed(() => formatNumber(LANGUAGE_LIMITS.text, locale.locale));
const countOf = (text: string) => formatNumber(codePointsOf(text), locale.locale);
</script>

<template>
  <AdminFormSection :title="$t('admin.languages.form.groups.content')" :columns="1">
    <div class="flex flex-col gap-5">
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.template')"
        input-id="language-template"
        :hint="$t('admin.languages.form.hints.template')"
        :error="errors.template"
      >
        <textarea
          :id="id"
          v-model="form.template"
          rows="5"
          class="font-mono"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
        <span :id="`${id}-count`" class="text-xs text-muted">
          {{ countOf(form.template) }} / {{ textLimitText }}
        </span>
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.info')"
        input-id="language-info"
        :error="errors.info"
      >
        <textarea
          :id="id"
          v-model="form.info"
          rows="3"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
        <span :id="`${id}-count`" class="text-xs text-muted">
          {{ countOf(form.info) }} / {{ textLimitText }}
        </span>
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.description')"
        input-id="language-description"
        :error="errors.description"
      >
        <textarea
          :id="id"
          v-model="form.description"
          rows="3"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
        <span :id="`${id}-count`" class="text-xs text-muted">
          {{ countOf(form.description) }} / {{ textLimitText }}
        </span>
      </AdminField>
    </div>
  </AdminFormSection>
</template>
