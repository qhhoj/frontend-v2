<script setup lang="ts">
import { computed } from 'vue';
import { translate } from '@/i18n';
import { CONTRASTS } from '@/theme/appearance';
import SegmentedChoice from './SegmentedChoice.vue';
import { useAppearanceChoice } from './use-appearance-choice';

const { shown, update } = useAppearanceChoice();
const options = computed(() =>
  CONTRASTS.map((level) => ({ value: level.id, label: translate(level.labelKey) })),
);
</script>

<template>
  <SegmentedChoice
    :label="$t('appearance.contrast')"
    :options="options"
    :selected="shown.contrast"
    @pick="(contrast) => void update({ contrast })"
  />
</template>
