<script setup lang="ts">
import { X } from 'lucide-vue-next';
import Notice from '@/components/ui/Notice.vue';

withDefaults(defineProps<{ tone?: 'info' | 'success' | 'warning'; dismissible?: boolean }>(), {
  tone: 'info',
  dismissible: false,
});
defineEmits<{ dismiss: [] }>();
</script>

<template>
  <Notice :tone="tone" role="status">
    <slot />
    <template v-if="dismissible" #action>
      <button
        type="button"
        class="-my-2.5 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full"
        :aria-label="$t('auth.dismissNotice')"
        @click="$emit('dismiss')"
      >
        <X aria-hidden="true" class="size-4.5" />
      </button>
    </template>
  </Notice>
</template>
