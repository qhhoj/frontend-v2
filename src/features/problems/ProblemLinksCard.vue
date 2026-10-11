<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import type { ProblemDetail } from '@/api/types/problems';
import BitMascot from '@/components/BitMascot.vue';
import GlassCard from '@/components/GlassCard.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import type { BitLook } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';
import { HEADER_BUTTON_IDLE_CLASS, PDF_PILL_CLASS } from './links-card-classes';
import PdfButton from './PdfButton.vue';
import { hasTextStatement } from './statement-presence';

/**
 * Where else this problem leads (board C): a titled card whose header holds the actions (the PDF pill, the copy-link icon)
 * and whose rows are the links, each led by a small Bit in a fitting look. One PDF control: the uploaded statement when there
 * is one, else the rendered text statement.
 */
const props = defineProps<{ problem: ProblemDetail; hasEditorial: boolean }>();
const route = useRoute();
const locale = useLocaleStore();

interface LinkRow {
  key: string;
  to: RouteLocationRaw;
  labelKey: string;
  look: BitLook;
}
const rows = computed<LinkRow[]>(() => [
  {
    key: 'all-submissions',
    to: { name: 'submissions', query: { problem: props.problem.code } },
    labelKey: 'problem.rail.links.submissions',
    look: PLACEMENT_LOOKS.hero,
  },
  {
    key: 'best-submissions',
    to: { name: 'problem-best', params: { code: props.problem.code } },
    labelKey: 'problem.rail.links.best',
    look: PLACEMENT_LOOKS.accepted,
  },
  ...(props.hasEditorial
    ? [
        {
          key: 'editorial',
          to: { query: { ...route.query, tab: 'editorial' } },
          labelKey: 'problem.tabs.editorial',
          look: { headgear: 'antenna', palette: 'terracotta' } as const,
        },
      ]
    : []),
]);
const PLAIN_LOOK: BitLook = { headgear: 'none', palette: 'terracotta' };
/** A hairline between rows, as on board C. */
const DIVIDED = 'border-line not-first:border-t';
const ROW =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-row px-3 text-sm hover:bg-surface-hover';
</script>

<template>
  <GlassCard
    as="nav"
    :aria-label="$t('problem.rail.links.label')"
    data-testid="header-actions"
    class="rounded-panel p-2"
  >
    <div class="flex items-center gap-2 py-1.5 pr-1.5 pl-3">
      <h2 class="flex-1 font-display text-[15px] font-bold">
        {{ $t('problem.rail.links.title') }}
      </h2>
      <a
        v-if="problem.pdfStatementUrl"
        :href="problem.pdfStatementUrl"
        target="_blank"
        rel="noopener"
        data-testid="pdf-statement-link"
        :title="$t('problem.rail.links.pdfStatement')"
        :aria-label="$t('problem.rail.links.pdfStatement')"
        :class="[PDF_PILL_CLASS, HEADER_BUTTON_IDLE_CLASS]"
      >
        <FileText aria-hidden="true" class="size-4" />PDF
      </a>
      <PdfButton v-else-if="hasTextStatement(problem)" :code="problem.code" :lang="locale.locale" />
      <ShortLinkButton compact :path="shortLinkPath({ kind: 'problem', code: problem.code })" />
    </div>
    <ul class="m-0 list-none border-t border-line p-0 pt-1">
      <li v-for="row in rows" :key="row.key" :class="DIVIDED">
        <RouterLink :to="row.to" :data-testid="`${row.key}-link`" :class="ROW">
          <BitMascot :look="row.look" class="[--bit-px:2px]" />{{ $t(row.labelKey) }}
        </RouterLink>
      </li>
      <li v-if="problem.materialUrl" :class="DIVIDED">
        <a
          :href="problem.materialUrl"
          target="_blank"
          rel="noopener"
          data-testid="material-link"
          :class="ROW"
        >
          <BitMascot :look="PLAIN_LOOK" class="[--bit-px:2px]" />{{
            $t('problem.rail.links.material')
          }}
        </a>
      </li>
    </ul>
  </GlassCard>
</template>
