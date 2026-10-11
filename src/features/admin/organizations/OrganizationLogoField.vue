<script setup lang="ts">
import { ref, watch } from 'vue';
import AdminField from '../ui/AdminField.vue';
import { ADMIN_INPUT_CLASS } from '../ui/classes';

/** The logo path or URL with a live thumbnail, so staff see whether it loads before saving. */
const logo = defineModel<string>({ required: true });
defineProps<{ error?: string }>();
const hasFailed = ref(false);
watch(logo, () => (hasFailed.value = false));
</script>

<template>
  <AdminField
    input-id="org-logo"
    :label="$t('admin.organizations.editor.logo')"
    :hint="
      hasFailed
        ? $t('admin.organizations.editor.logoBroken')
        : $t('admin.organizations.editor.logoHint')
    "
    :error="error"
  >
    <template #default="{ id, describedBy, invalid }">
      <div class="flex items-center gap-3">
        <span
          class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-cell border border-line bg-surface-strong"
        >
          <img
            v-if="logo && !hasFailed"
            :key="logo"
            data-testid="logo-preview"
            :src="logo"
            :alt="$t('admin.organizations.editor.logoPreview')"
            class="size-full object-cover"
            @error="hasFailed = true"
          />
          <span v-else aria-hidden="true" class="text-xs text-muted">—</span>
        </span>
        <input
          :id="id"
          v-model="logo"
          :class="ADMIN_INPUT_CLASS"
          maxlength="150"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
        />
      </div>
    </template>
  </AdminField>
</template>
