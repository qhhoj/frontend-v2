<script setup lang="ts">
import { computed } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import PdfLink from './PdfLink.vue';
import StatementNote from './StatementNote.vue';

/**
 * An uploaded PDF statement, shown inline like the old site did: a slim toolbar (the translation note, the one PDF button that opens it in a new tab)
 * above the viewer. Only a path on this site is framed (CSP `frame-src 'self'`); any other URL is just linked.
 */
const props = defineProps<{ problem: ProblemDetail; url: string; untranslated?: boolean }>();
const isSitePath = computed(() => /^\/(?![/\\])/.test(props.url));
</script>

<template>
  <section data-testid="pdf-statement" class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
      <StatementNote v-if="untranslated" class="min-w-0 flex-1 basis-60" />
      <PdfLink :problem="problem" class="max-sm:w-full" :class="untranslated ? 'sm:ml-auto' : ''" />
    </div>
    <iframe
      v-if="isSitePath"
      :src="url"
      :title="$t('problem.pdfStatement.title')"
      class="h-[80vh] min-h-96 w-full rounded-row border border-line bg-surface"
    />
  </section>
</template>
