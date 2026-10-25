<script setup lang="ts">
import { computed } from 'vue';
import { translate } from '@/i18n';
import SegmentedChoice from '@/features/appearance/SegmentedChoice.vue';

type Mode = 'open' | 'approval';

/** Legacy `is_open` as a segmented choice (open: join at once; approval: join requests) with a hint that follows the choice. */
const isOpen = defineModel<boolean>({ required: true });
const mode = computed<Mode>(() => (isOpen.value ? 'open' : 'approval'));
const options = computed(() =>
  (['open', 'approval'] as const).map((value) => ({
    value,
    label: translate(`orgAdmin.joinMode.${value}`),
  })),
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <SegmentedChoice
      class="max-w-xs"
      :label="$t('orgAdmin.joinMode.label')"
      :options="options"
      :selected="mode"
      @pick="(picked) => (isOpen = picked === 'open')"
    />
    <p class="text-caption leading-4 text-muted" aria-live="polite">
      {{ $t(`orgAdmin.joinMode.${mode}Hint`) }}
    </p>
  </div>
</template>
