<script setup lang="ts">
import { computed } from 'vue';
import AdminField from '@/features/admin/ui/AdminField.vue';
import AdminSwitch from '@/features/admin/ui/AdminSwitch.vue';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '@/features/admin/ui/classes';
import { fromLocalInput } from '@/features/admin/ui/datetime';

/** Visibility and publish time: a shown post with a time ahead is scheduled, and goes public by itself then. */
defineProps<{ errors: FieldErrors }>();
const visible = defineModel<boolean>('visible', { required: true });
const publishOn = defineModel<string>('publishOn', { required: true });
const state = computed(() => {
  if (!visible.value) return 'draft';
  const at = fromLocalInput(publishOn.value);
  return at && new Date(at).getTime() > Date.now() ? 'scheduled' : 'public';
});
</script>

<template>
  <section
    class="flex flex-col gap-5 rounded-panel border border-line bg-surface-solid p-4 sm:p-5"
    :aria-labelledby="'post-publishing'"
  >
    <h2 id="post-publishing" class="text-lg font-semibold">
      {{ $t('admin.postEditor.publishing') }}
    </h2>
    <AdminSwitch
      v-model="visible"
      :label="$t('admin.postEditor.fields.visible')"
      :description="$t('admin.postEditor.hints.visible')"
    />
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      :label="$t('admin.postEditor.fields.publishOn')"
      :hint="$t('admin.postEditor.hints.publishOn')"
      :error="errors.publishOn"
      input-id="post-publish-on"
    >
      <input
        :id="id"
        v-model="publishOn"
        type="datetime-local"
        :class="ADMIN_INPUT_CLASS"
        :aria-describedby="describedBy"
        :aria-invalid="invalid ? 'true' : undefined"
      />
    </AdminField>
    <p class="text-sm" data-testid="publish-state">
      <span class="rounded-pill bg-surface-hover px-2.5 py-0.5 text-xs font-semibold">
        {{ $t(`admin.postEditor.state.${state}`) }}
      </span>
      <span class="ml-2 text-muted">{{ $t(`admin.postEditor.stateHint.${state}`) }}</span>
    </p>
  </section>
</template>
