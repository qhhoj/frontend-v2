<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { ChangeLine } from './flatpage-history';
import { fieldLabelKey } from './flatpage-history';

defineProps<{ lines: ChangeLine[] }>();
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-4">
    <section v-for="line in lines" :key="line.field" class="flex min-w-0 flex-col gap-1.5">
      <h3 class="text-sm font-semibold">
        {{ t(fieldLabelKey(line.field)) }}
        <span class="font-mono text-caption leading-4 font-normal text-muted">{{
          line.field
        }}</span>
      </h3>
      <div
        v-for="(text, index) in line.removed"
        :key="`removed-${index}`"
        class="rounded-row bg-verdict-wa-bg px-2 py-0.5 font-mono text-sm break-words whitespace-pre-wrap text-verdict-wa"
      >
        − {{ text }}
      </div>
      <div
        v-for="(text, index) in line.added"
        :key="`added-${index}`"
        class="rounded-row bg-verdict-ac-bg px-2 py-0.5 font-mono text-sm break-words whitespace-pre-wrap text-verdict-ac"
      >
        + {{ text }}
      </div>
      <p v-if="line.hidden > 0" class="text-caption leading-4 text-muted">
        {{ t('admin.pages.history.moreLines', { n: line.hidden }) }}
      </p>
    </section>
  </div>
</template>
