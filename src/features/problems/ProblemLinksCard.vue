<script setup lang="ts">
import { FileText, Paperclip } from 'lucide-vue-next';
import { useRoute } from 'vue-router';
import type { ProblemDetail } from '@/api/types/problems';
import GlassCard from '@/components/GlassCard.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { useLocaleStore } from '@/stores/locale.store';
import PdfButton from './PdfButton.vue';

const LINK = 'flex min-h-11 items-center rounded-row px-3 hover:bg-surface-hover';
const FILE_LINK =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-hover';
/** Where else this problem leads: its submissions, the editorial tab, the uploaded PDF statement and material, the rendered PDF and the short link. */
defineProps<{ problem: ProblemDetail; hasEditorial: boolean }>();
const route = useRoute();
const locale = useLocaleStore();
</script>

<template>
  <GlassCard as="nav" :aria-label="$t('problem.rail.links.label')" class="rounded-panel p-2">
    <ul class="grid grid-cols-2 gap-1">
      <li>
        <RouterLink :to="{ name: 'submissions', query: { problem: problem.code } }" :class="LINK">{{
          $t('problem.rail.links.submissions')
        }}</RouterLink>
      </li>
      <li>
        <RouterLink
          :to="{ name: 'submissions', query: { problem: problem.code, result: 'AC' } }"
          :class="LINK"
          >{{ $t('problem.rail.links.best') }}</RouterLink
        >
      </li>
      <li v-if="hasEditorial">
        <RouterLink :to="{ query: { ...route.query, tab: 'editorial' } }" :class="LINK">{{
          $t('problem.tabs.editorial')
        }}</RouterLink>
      </li>
    </ul>
    <div
      data-testid="header-actions"
      class="flex flex-col gap-2 empty:hidden [&:not(:empty)]:p-1 [&:not(:empty)]:pt-2"
    >
      <a
        v-if="problem.pdfStatementUrl"
        :href="problem.pdfStatementUrl"
        target="_blank"
        rel="noopener"
        data-testid="pdf-statement-link"
        :class="FILE_LINK"
      >
        <FileText aria-hidden="true" class="size-4" />{{ $t('problem.rail.links.pdfStatement') }}
      </a>
      <a
        v-if="problem.materialUrl"
        :href="problem.materialUrl"
        target="_blank"
        rel="noopener"
        data-testid="material-link"
        :class="FILE_LINK"
      >
        <Paperclip aria-hidden="true" class="size-4" />{{ $t('problem.rail.links.material') }}
      </a>
      <ShortLinkButton :path="shortLinkPath({ kind: 'problem', code: problem.code })" />
      <PdfButton v-if="problem.pdfStatementUrl" :code="problem.code" :lang="locale.locale" />
    </div>
  </GlassCard>
</template>
