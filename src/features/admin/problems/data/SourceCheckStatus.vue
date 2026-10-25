<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SourceCheck } from '@/api/types/problem-data';
import AdminStatus from '../../ui/AdminStatus.vue';

/** The judge's compile check of an uploaded checker or interactor; a check about another file than the stored one is not shown. */
const props = defineProps<{ check: SourceCheck | null; storedName: string | null }>();
const { t } = useI18n();
const key = 'admin.problems.data.config.compile';

const shown = computed(() =>
  props.check && props.check.file === props.storedName ? props.check : null,
);
const KIND = { pending: 'queued', ok: 'done', error: 'refused', unavailable: 'queued' } as const;
</script>

<template>
  <div v-if="shown" class="flex flex-col gap-2" :data-testid="`compile-${shown.status}`">
    <AdminStatus :kind="KIND[shown.status]" :text="t(`${key}.${shown.status}`)" />
    <details v-if="shown.log" :open="shown.status === 'error'">
      <summary class="cursor-pointer text-sm text-muted">
        {{ t(`${key}.${shown.status === 'error' ? 'log' : 'reason'}`) }}
      </summary>
      <pre
        class="mt-2 max-h-64 overflow-auto rounded-cell border border-line bg-surface-strong p-3 font-mono text-caption leading-4 whitespace-pre-wrap"
        >{{ shown.log }}</pre>
    </details>
  </div>
</template>
