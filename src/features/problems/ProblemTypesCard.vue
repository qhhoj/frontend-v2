<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import Chip from '@/components/ui/Chip.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';

/**
 * The problem's types, a folded row of the side panel: a type is a hint at the solution, so it shows only when asked. The
 * catch-all type says nothing: with named types only, the row is left out when there are none.
 */
const props = defineProps<{ problem: ProblemDetail }>();
const typesShown = ref(false);
const types = computed(() =>
  props.problem.types.filter((type) => type.name !== UNCATEGORIZED_TYPE_NAME),
);
</script>

<template>
  <div v-if="types.length" data-testid="problem-types">
    <Disclosure
      v-model:open="typesShown"
      :label="$t('problems.columns.types')"
      :count="types.length"
    >
      <ul id="problem-types" class="flex flex-wrap gap-1.5">
        <li v-for="type in types" :key="type.id">
          <Chip size="md">{{ problemTypeLabel(type) }}</Chip>
        </li>
      </ul>
    </Disclosure>
  </div>
</template>
