<script setup lang="ts">
import { ExternalLink, FileText } from 'lucide-vue-next';
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import StatementNote from './StatementNote.vue';

/**
 * An uploaded PDF statement, shown inline like the old site did: a slim toolbar (PDF badge, the translation note, "open in a new tab")
 * above the viewer. Only a path on this site is framed (CSP `frame-src 'self'`); any other URL is just linked.
 */
const props = defineProps<{ url: string; untranslated?: boolean }>();
const isSitePath = computed(() => /^\/(?![/\\])/.test(props.url));
</script>

<template>
  <section data-testid="pdf-statement" class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
      <span
        class="inline-flex items-center gap-1.5 rounded-row bg-accent-soft px-2 py-0.5 font-mono text-tiny font-bold tracking-wide text-accent-soft-text"
        ><FileText aria-hidden="true" class="size-3.5" />PDF</span
      >
      <StatementNote v-if="untranslated" class="min-w-0 flex-1 basis-60" />
      <AppButton
        :href="url"
        target="_blank"
        rel="noopener"
        class="max-sm:w-full"
        :class="untranslated ? 'sm:ml-auto' : 'ml-auto max-sm:ml-0'"
      >
        <template #icon><ExternalLink aria-hidden="true" class="size-4" /></template>
        {{ $t('problem.pdfStatement.open') }}
      </AppButton>
    </div>
    <iframe
      v-if="isSitePath"
      :src="url"
      :title="$t('problem.pdfStatement.title')"
      class="h-[80vh] min-h-96 w-full rounded-row border border-line bg-surface"
    />
  </section>
</template>
