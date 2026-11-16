<script setup lang="ts">
import { ExternalLink, Flag, Link } from 'lucide-vue-next';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { SHORT_LINK_DAILY_LIMIT } from '@/api/types/short-links';
import type { ProblemDetail } from '@/api/types/problems';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import RowMenu from '@/components/ui/RowMenu.vue';
import { useToast } from '@/components/ui/use-toast';
import { errorMessageKey } from '@/i18n/error-message';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { useShortLink } from '@/features/short-links/use-short-link';

/**
 * The "⋯" menu in the problem header, next to the PDF icon: report the problem, copy the short link (both for a signed-in
 * viewer; a visitor cannot make short links) and the problem's attached material. The short link's outcome is a toast.
 */
const props = defineProps<{ problem: ProblemDetail; isSignedIn: boolean }>();
const { t } = useI18n();
const toast = useToast({ lazy: true });
const { state, url, failure, copy } = useShortLink(() =>
  shortLinkPath({ kind: 'problem', code: props.problem.code }),
);
watch(state, (next) => {
  if (next === 'copied') toast.show({ text: t('shortLink.copied'), tone: 'success' });
  else if (next === 'limited')
    toast.show({
      text: t('shortLink.limitTitle', { limit: SHORT_LINK_DAILY_LIMIT }),
      tone: 'danger',
    });
  else if (next === 'manual' && url.value) toast.show({ text: url.value, tone: 'info' });
  else if (next === 'failed')
    toast.show({ text: t(errorMessageKey(failure.value)), tone: 'danger' });
});
const items = computed<MenuEntry[]>(() => [
  ...(props.isSignedIn
    ? [
        {
          label: t('problem.menu.report'),
          icon: Flag,
          to: { name: 'ticket-new', query: { problem: props.problem.code } },
        },
        { label: t('shortLink.copy'), icon: Link, run: () => void copy() },
      ]
    : []),
  ...(props.problem.materialUrl
    ? [
        {
          label: t('problem.rail.links.material'),
          icon: ExternalLink,
          run: () => window.open(props.problem.materialUrl ?? '', '_blank', 'noopener'),
        },
      ]
    : []),
]);
</script>

<template>
  <RowMenu v-if="items.length" :items="items" :label="$t('common.moreActions')" />
</template>
