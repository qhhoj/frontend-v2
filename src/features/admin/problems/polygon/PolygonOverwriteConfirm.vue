<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight } from 'lucide-vue-next';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import type { PolygonProblem } from '@/api/types/polygon';
import { packageRevisionOf } from './polygon-preview';

/** An update import's confirmation, as the panel's "Đồng bộ và ghi đè": what the package replaces in `code` and what is kept. */
const props = defineProps<{
  code: string;
  problem: PolygonProblem;
  busy: boolean;
  /** False: the editorial is not touched, so it is not listed as replaced. */
  importTutorial?: boolean;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [] }>();
const ALL_ITEMS = ['statements', 'tutorial', 'tests', 'checker', 'link'] as const;
const items = computed(() =>
  ALL_ITEMS.filter((item) => item !== 'tutorial' || props.importTutorial !== false),
);
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    tone="danger"
    :width="520"
    :title="$t('admin.polygonLink.configure.confirm.title', { code })"
    :confirm-label="$t('admin.polygonLink.configure.confirm.confirm', { code })"
    :busy="busy"
    @confirm="emit('confirm')"
  >
    <div class="flex flex-col gap-3 text-sm" data-testid="polygon-overwrite-confirm">
      <div class="flex flex-col gap-1.5">
        <p class="font-semibold">{{ $t('admin.polygonLink.configure.confirm.replaced') }}</p>
        <ul class="flex flex-col gap-1.5">
          <li v-for="item in items" :key="item" class="flex items-start gap-2">
            <ArrowRight aria-hidden="true" class="mt-0.5 size-3.5 shrink-0" :stroke-width="1.75" />
            <span class="[overflow-wrap:anywhere]">{{
              $t(`admin.polygonLink.configure.confirm.items.${item}`, {
                revision: packageRevisionOf(problem),
                name: problem.name,
                id: problem.id,
              })
            }}</span>
          </li>
        </ul>
      </div>
      <p class="text-muted">{{ $t('admin.polygonLink.configure.confirm.kept') }}</p>
      <p>{{ $t('admin.polygonLink.configure.confirm.lost') }}</p>
    </div>
    <template #error><slot name="error" /></template>
  </ConfirmDialog>
</template>
