<script setup lang="ts">
import { Lock } from 'lucide-vue-next';
import AdminFormSection from '../ui/form/AdminFormSection.vue';
import AdminField from '../ui/AdminField.vue';
import type { FieldErrors } from '../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import type { LanguageForm } from './language-form';

defineProps<{ mode: 'create' | 'edit'; errors: FieldErrors }>();
const form = defineModel<LanguageForm>('form', { required: true });
</script>

<template>
  <AdminFormSection :title="$t('admin.languages.form.groups.identity')" :columns="1">
    <div class="grid gap-5 md:grid-cols-2">
      <AdminField
        v-if="mode === 'create'"
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.key')"
        input-id="language-key"
        :hint="$t('admin.languages.form.hints.key')"
        :error="errors.key"
      >
        <input
          :id="id"
          v-model="form.key"
          type="text"
          autocomplete="off"
          class="font-mono"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <div v-else data-testid="language-key-sealed" class="flex flex-col gap-1.5">
        <span class="text-sm font-semibold">{{ $t('admin.languages.form.labels.key') }}</span>
        <div class="flex min-h-11 flex-wrap items-center gap-2">
          <Lock aria-hidden="true" class="size-4 text-muted" />
          <span class="font-mono">{{ form.key }}</span>
          <span class="rounded-pill border border-line px-2 text-xs text-muted">
            {{ $t('admin.languages.form.sealed') }}
          </span>
        </div>
        <p class="text-xs text-muted">{{ $t('admin.languages.form.hints.sealed') }}</p>
      </div>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.name')"
        input-id="language-name"
        :hint="$t('admin.languages.form.hints.name')"
        :error="errors.name"
      >
        <input
          :id="id"
          v-model="form.name"
          type="text"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.shortName')"
        input-id="language-shortName"
        :hint="
          mode === 'create'
            ? $t('admin.languages.form.hints.shortName')
            : $t('admin.languages.form.hints.shortNameEdit')
        "
        :error="errors.shortName"
      >
        <input
          :id="id"
          v-model="form.shortName"
          type="text"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.languages.form.labels.commonName')"
        input-id="language-commonName"
        :error="errors.commonName"
      >
        <input
          :id="id"
          v-model="form.commonName"
          type="text"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
          :class="ADMIN_INPUT_CLASS"
        />
      </AdminField>
    </div>
  </AdminFormSection>
</template>
