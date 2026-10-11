<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import { computed } from 'vue';

const FILE_LINK =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-hover';
/** An uploaded PDF statement, shown inline like the old site did. Only a path on this site is framed (CSP `frame-src 'self'`); any other URL is just linked. */
const props = defineProps<{ url: string }>();
const isSitePath = computed(() => /^\/(?![/\\])/.test(props.url));
</script>

<template>
  <section data-testid="pdf-statement" class="flex flex-col gap-3">
    <p class="flex flex-wrap items-center gap-3 text-sm text-muted">
      {{ $t('problem.pdfStatement.hint') }}
      <a :href="url" target="_blank" rel="noopener" :class="FILE_LINK">
        <FileText aria-hidden="true" class="size-4" />{{ $t('problem.pdfStatement.open') }}
      </a>
    </p>
    <iframe
      v-if="isSitePath"
      :src="url"
      :title="$t('problem.pdfStatement.title')"
      class="h-[80vh] min-h-96 w-full rounded-row border border-line bg-surface"
    />
  </section>
</template>
