<script setup lang="ts">
import { Globe } from 'lucide-vue-next';

/** The slim "no translation in this language" note above the statement: shown with a PDF toolbar or alone over markdown. */
</script>

<template>
  <p data-testid="untranslated-note" class="flex items-start gap-2 text-sm text-muted">
    <Globe aria-hidden="true" class="mt-0.5 size-4 shrink-0" />{{ $t('problem.untranslated') }}
  </p>
</template>
