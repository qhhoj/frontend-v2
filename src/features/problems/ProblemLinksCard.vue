<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import type { ProblemDetail } from '@/api/types/problems';
import BitMascot from '@/components/BitMascot.vue';
import Card from '@/components/ui/Card.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import type { BitLook } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { HEADER_BUTTON_IDLE_CLASS, PDF_PILL_CLASS } from './links-card-classes';
import PdfButton from './PdfButton.vue';
import { hasTextStatement } from './statement-presence';

/**
 * Where else this problem leads (board C): a titled card whose header holds the actions (the PDF pill, the copy-link icon)
 * and whose rows are the links, each led by a small Bit in a fitting look (the viewer's own avatar for their submissions). One PDF control: the uploaded statement when there
 * is one, else the rendered text statement.
 */
const props = defineProps<{ problem: ProblemDetail; hasEditorial: boolean }>();
const route = useRoute();
const locale = useLocaleStore();
const session = useSessionStore();

const PLAIN_LOOK: BitLook = { headgear: 'none', palette: 'terracotta' };

interface LinkRow {
  key: string;
  to: RouteLocationRaw;
  labelKey: string;
  /** The row's Bit, or `avatarOf`: the avatar of that username. */
  look: BitLook;
  avatarOf?: string;
}
const viewerName = computed(() =>
  session.status === 'authenticated' ? (session.user?.username ?? null) : null,
);
const rows = computed<LinkRow[]>(() => [
  {
    key: 'all-submissions',
    to: { name: 'submissions', query: { problem: props.problem.code } },
    labelKey: 'problem.rail.links.submissions',
    look: PLACEMENT_LOOKS.hero,
  },
  ...(viewerName.value
    ? [
        {
          key: 'my-submissions',
          to: {
            name: 'submissions',
            query: { problem: props.problem.code, user: viewerName.value },
          },
          labelKey: 'problem.rail.mine.title',
          look: PLAIN_LOOK,
          avatarOf: viewerName.value,
        },
      ]
    : []),
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
/** A hairline between rows, as on board C. */
const DIVIDED = 'border-line not-first:border-t';
const ROW =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-row px-3 text-sm hover:bg-surface-hover';
</script>

<template>
  <Card
    as="nav"
    :aria-label="$t('problem.rail.links.label')"
    data-testid="header-actions"
    class="p-2"
  >
    <div class="flex items-center gap-2 py-1.5 pr-1.5 pl-3">
      <h2 class="flex-1 section-title">
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
          <UserAvatar v-if="row.avatarOf" :username="row.avatarOf" :size="32" />
          <BitMascot v-else :look="row.look" class="[--bit-px:2px]" />{{ $t(row.labelKey) }}
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
  </Card>
</template>
