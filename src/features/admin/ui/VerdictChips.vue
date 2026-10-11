<script setup lang="ts" generic="Code extends string">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminCheckChips from './AdminCheckChips.vue';

/** Verdict or status codes as checkbox pills: the code shows, its name is the tooltip and what a screen reader reads. */
const props = defineProps<{ codes: readonly Code[]; name: string }>();
const picked = defineModel<Code[]>({ required: true });
const { t } = useI18n();
const options = computed(() =>
  props.codes.map((code) => ({ value: code, label: code, title: t(`verdicts.${code}`) })),
);
</script>

<template>
  <AdminCheckChips v-model="picked" :options="options" :name="name" mono />
</template>
