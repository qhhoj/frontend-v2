<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import type { BulkOutcome } from './join-request-bulk';
import { decisionFailureText } from './join-request-decision';

/** Select-all for the page, the selected count, and accept or refuse them all (legacy approval formset). */
const props = defineProps<{
  selectedCount: number;
  isAllTicked: boolean;
  busy: boolean;
  outcome: BulkOutcome | null;
}>();
const emit = defineEmits<{ toggleAll: []; decide: [next: 'A' | 'R'] }>();
const { t } = useI18n();
const isIdle = computed(() => props.selectedCount === 0 || props.busy);
const outcomeText = computed(() => {
  const outcome = props.outcome;
  if (!outcome) return '';
  const done = t('admin.organizations.bulk.done', { count: outcome.done });
  return outcome.failed === 0
    ? done
    : `${done} ${t('admin.organizations.bulk.failed', { count: outcome.failed })} ${decisionFailureText(outcome.firstFailure)}`;
});
</script>

<template>
  <div
    data-testid="bulk-bar"
    class="flex flex-wrap items-center gap-3 rounded-row border border-line bg-surface-strong px-3 py-2"
  >
    <label class="flex min-h-11 items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        class="size-4 accent-accent"
        :checked="isAllTicked"
        @change="emit('toggleAll')"
      />
      {{ $t('admin.organizations.bulk.selectPage') }}
    </label>
    <span class="text-sm text-muted" aria-live="polite">{{
      $t('admin.organizations.bulk.selected', { count: selectedCount })
    }}</span>
    <span class="ml-auto flex flex-wrap gap-2">
      <button
        type="button"
        :class="ADMIN_BUTTON_CLASS"
        :aria-disabled="isIdle || undefined"
        @click="!isIdle && emit('decide', 'R')"
      >
        {{ $t('admin.organizations.bulk.reject') }}
      </button>
      <button
        type="button"
        :class="ADMIN_PRIMARY_CLASS"
        :aria-disabled="isIdle || undefined"
        :aria-busy="busy || undefined"
        @click="!isIdle && emit('decide', 'A')"
      >
        {{ $t('admin.organizations.bulk.accept') }}
      </button>
    </span>
    <AdminStatus
      v-if="outcome"
      class="basis-full"
      :kind="outcome.failed === 0 ? 'done' : 'refused'"
      :text="outcomeText"
    />
  </div>
</template>
