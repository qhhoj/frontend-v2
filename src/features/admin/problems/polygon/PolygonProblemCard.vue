<script setup lang="ts">
import { computed } from 'vue';
import type { PolygonProblem } from '@/api/types/polygon';
import PackageStatePill from './PackageStatePill.vue';
import { cardBlockOf } from './pick-filter';

/** One shared problem as a radio choice; a blocked card is disabled and says why. */
const props = defineProps<{ problem: PolygonProblem; isSelected: boolean }>();
const emit = defineEmits<{ select: [problem: PolygonProblem] }>();
const block = computed(() => cardBlockOf(props.problem));
const packageText = computed(() => {
  const { latestPackage } = props.problem;
  return latestPackage.id === null ? '' : `· #${latestPackage.id}`;
});
</script>

<template>
  <label
    :data-polygon-id="problem.id"
    class="flex min-h-11 flex-col gap-2 rounded-panel border p-4"
    :class="
      block
        ? 'cursor-not-allowed border-line bg-surface-strong'
        : isSelected
          ? 'cursor-pointer border-2 border-accent bg-surface-solid'
          : 'cursor-pointer border-line-strong bg-surface-solid hover:bg-surface-hover'
    "
  >
    <span class="flex items-start justify-between gap-3">
      <span class="min-w-0 font-semibold break-words">{{ problem.title ?? problem.name }}</span>
      <input
        type="radio"
        name="polygon-problem"
        class="mt-1 size-4 shrink-0 accent-accent"
        :value="problem.id"
        :checked="isSelected"
        :disabled="block !== null"
        @change="emit('select', problem)"
      />
    </span>
    <span class="font-mono text-xs break-all text-muted">
      {{ problem.name }} · {{ problem.id }} · {{ problem.owner }}
    </span>
    <span class="flex flex-wrap items-center gap-2 text-xs text-muted">
      <PackageStatePill :state="problem.latestPackage.state" />
      <span class="font-mono">r{{ problem.revision }} {{ packageText }}</span>
    </span>
    <span v-if="block" class="text-sm text-muted">
      {{ $t(`admin.polygonLink.pick.blocked.${block}`, { code: problem.linkedProblemCode }) }}
    </span>
    <span v-else-if="problem.modified" class="text-sm text-muted">
      {{ $t('admin.polygonLink.pick.modified') }}
    </span>
  </label>
</template>
