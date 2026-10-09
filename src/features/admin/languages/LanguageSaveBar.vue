<script setup lang="ts">
import { computed } from 'vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';

const props = defineProps<{ mode: 'create' | 'edit'; isPending: boolean; changeCount: number }>();
/** Edit with nothing changed: the button is unavailable, and the form also refuses to send. */
const isUnavailable = computed(
  () => props.isPending || (props.mode === 'edit' && props.changeCount === 0),
);
</script>

<template>
  <div
    data-testid="language-save-bar"
    class="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-solid px-4 py-3"
  >
    <span class="text-sm text-muted">{{ $t('admin.languages.form.required') }}</span>
    <div class="flex flex-wrap gap-2">
      <RouterLink :to="{ name: 'admin-languages' }" :class="ADMIN_BUTTON_CLASS">
        {{ $t('admin.languages.form.cancel') }}
      </RouterLink>
      <button
        type="submit"
        :class="ADMIN_PRIMARY_CLASS"
        :aria-disabled="isUnavailable || undefined"
        :aria-busy="isPending || undefined"
      >
        {{
          mode === 'create' ? $t('admin.languages.form.create') : $t('admin.languages.form.save')
        }}
      </button>
    </div>
  </div>
</template>
