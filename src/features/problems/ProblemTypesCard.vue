<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import Chip from '@/components/ui/Chip.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import { UNCATEGORIZED_TYPE_NAME, problemTypeLabel } from './problem-type-label';

/**
 * The problem's types, behind a hairline-topped disclosure row (open by default, so a reader who wants no hint can close it). The catch-all type
 * says nothing (the header already shows the group): with named types only, the card is left out when there are none.
 */
const props = defineProps<{ problem: ProblemDetail }>();
const typesShown = ref(true);
const types = computed(() =>
  props.problem.types.filter((type) => type.name !== UNCATEGORIZED_TYPE_NAME),
);
</script>

<template>
  <div v-if="types.length" class="border-t border-line" data-testid="problem-types">
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
