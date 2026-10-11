<script setup lang="ts">
import { useId } from 'vue';
import { INPUT } from '../../ui/controls';
import { CONTEST_SECTION_KEYS, contestSectionLabel, jumpToSection } from './contest-sections';
import type { ContestSectionKey } from './contest-sections';

/** "Đi tới mục": a select that jumps to a section of the general form (the rail does this on wide screens). */
const id = useId();
function onPick(event: Event) {
  const select = event.target as HTMLSelectElement;
  if (select.value) jumpToSection(select.value as ContestSectionKey);
  select.value = '';
}
</script>

<template>
  <div class="flex items-center gap-2">
    <label :for="id" class="shrink-0 text-sm font-semibold">{{
      $t('admin.form.section.jumpTo')
    }}</label>
    <select :id="id" :class="[INPUT, 'max-w-72']" @change="onPick">
      <option value="">—</option>
      <option v-for="key in CONTEST_SECTION_KEYS" :key="key" :value="key">
        {{ contestSectionLabel(key) }}
      </option>
    </select>
  </div>
</template>
