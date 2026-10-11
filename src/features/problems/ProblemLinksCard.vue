<script setup lang="ts">
import { BookOpen, FileText, List, Paperclip, Trophy } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { ProblemDetail } from '@/api/types/problems';
import GlassCard from '@/components/GlassCard.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { useLocaleStore } from '@/stores/locale.store';
import PdfButton from './PdfButton.vue';

/** Every action of the card is one full-width pill: the card is a flex column, so its items stretch. */
const FILE_LINK =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-hover';
/** Where else this problem leads: all its submissions, the best-submissions ranking, the editorial tab, the uploaded PDF statement and material, the short link and the rendered PDF. */
const props = defineProps<{ problem: ProblemDetail; hasEditorial: boolean }>();
/** The rendered PDF prints the text statement; a statement that is only an uploaded PDF has none. */
const hasTextStatement = computed(() => props.problem.descriptionHtml.trim() !== '');
const route = useRoute();
const locale = useLocaleStore();
</script>

<template>
  <GlassCard
    as="nav"
    :aria-label="$t('problem.rail.links.label')"
    data-testid="header-actions"
    class="flex flex-col gap-2 rounded-panel p-3"
  >
    <RouterLink
      :to="{ name: 'submissions', query: { problem: problem.code } }"
      data-testid="all-submissions-link"
      :class="FILE_LINK"
    >
      <List aria-hidden="true" class="size-4" />{{ $t('problem.rail.links.submissions') }}
    </RouterLink>
    <RouterLink
      :to="{ name: 'problem-best', params: { code: problem.code } }"
      data-testid="best-submissions-link"
      :class="FILE_LINK"
    >
      <Trophy aria-hidden="true" class="size-4" />{{ $t('problem.rail.links.best') }}
    </RouterLink>
    <RouterLink
      v-if="hasEditorial"
      :to="{ query: { ...route.query, tab: 'editorial' } }"
      :class="FILE_LINK"
    >
      <BookOpen aria-hidden="true" class="size-4" />{{ $t('problem.tabs.editorial') }}
    </RouterLink>
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
    <PdfButton v-if="hasTextStatement" :code="problem.code" :lang="locale.locale" />
  </GlassCard>
</template>
