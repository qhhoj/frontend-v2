<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import type { ProblemDetail } from '@/api/types/problems';
import AppButton from '@/components/ui/AppButton.vue';
import { useLocaleStore } from '@/stores/locale.store';
import PdfButton from './PdfButton.vue';
import { hasTextStatement } from './statement-presence';

/**
 * The problem's one PDF control: the uploaded statement as a link when there is one, else the button that renders the text
 * statement on request. Nothing when the problem has neither.
 */
defineProps<{ problem: ProblemDetail }>();
const locale = useLocaleStore();
</script>

<template>
  <AppButton
    v-if="problem.pdfStatementUrl"
    size="sm"
    :href="problem.pdfStatementUrl"
    target="_blank"
    rel="noopener"
    data-testid="pdf-statement-link"
    :title="$t('problem.rail.links.pdfStatement')"
    :aria-label="$t('problem.rail.links.pdfStatement')"
  >
    <template #icon><FileText aria-hidden="true" class="size-4" /></template>
    PDF
  </AppButton>
  <PdfButton v-else-if="hasTextStatement(problem)" :code="problem.code" :lang="locale.locale" />
</template>
