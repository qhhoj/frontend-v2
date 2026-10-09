<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { shortId } from '../ui/short-id';
import FragmentList from './FragmentList.vue';
import PairSourcePane from './PairSourcePane.vue';
import { fragmentOfLine, lineIdOf, percentText } from './similarity-pairs';
import { useSimilarityPairQuery } from './similarity.queries';
import { isNotFound } from '../ui/admin-errors';

const route = useRoute();
const locale = useLocaleStore();
const pairId = computed(() => String(route.params.pairId));
const pair = useSimilarityPairQuery(pairId);
const detail = computed(() => pair.data.value);
const isMissing = computed(() => isNotFound(pair.error.value));
const activeFragment = ref<number | null>(null);

const leftFragmentOf = computed(() => fragmentOfLine(detail.value?.fragments ?? [], 'left'));
const rightFragmentOf = computed(() => fragmentOfLine(detail.value?.fragments ?? [], 'right'));
const count = (value: number) => formatNumber(value, locale.locale);
const crumbs = computed(() => [
  { label: translate('admin.similarity.title'), to: { name: 'admin-similarity' } },
  { label: detail.value?.problemCode ?? '' },
  { label: translate('admin.similarity.pair.crumbPair') },
]);

/** Brings the first line of a fragment into view on both sides; each side's pane scrolls with it. */
function selectFragment(index: number) {
  const fragment = detail.value?.fragments[index];
  if (!fragment) return;
  activeFragment.value = index;
  document
    .getElementById(lineIdOf('left', fragment.leftStart))
    ?.scrollIntoView({ block: 'center' });
  document
    .getElementById(lineIdOf('right', fragment.rightStart))
    ?.scrollIntoView({ block: 'center' });
}
</script>

<template>
  <section v-if="isMissing" class="flex flex-col items-center gap-3 px-6 py-8 text-center">
    <AdminBit placement="refused" />
    <h1 class="font-display text-xl font-bold">{{ $t('admin.similarity.pair.notFound') }}</h1>
  </section>
  <QueryState
    v-else
    :loading="pair.isPending.value"
    :error="pair.error.value"
    @retry="pair.refetch()"
  >
    <template #skeleton><SkeletonBlock class="h-96 w-full" /></template>
    <template v-if="detail">
      <AdminPageHeader
        :crumbs="crumbs"
        :title="`${detail.left.username} ↔ ${detail.right.username}`"
        :lead="
          $t('admin.similarity.pair.lead', {
            problemCode: detail.problemCode,
            runId: shortId(detail.runId),
          })
        "
      >
        <template #actions>
          <RouterLink
            :to="{ name: 'admin-similarityPairs', params: { runId: detail.runId } }"
            class="inline-flex min-h-11 items-center font-semibold underline"
          >
            {{ $t('admin.similarity.pair.backToList') }}
          </RouterLink>
        </template>
      </AdminPageHeader>
      <dl class="grid grid-cols-2 gap-3 text-sm md:grid-cols-6">
        <div>
          <dt class="text-muted">{{ $t('admin.similarity.pair.stats.similarity') }}</dt>
          <dd class="font-semibold">{{ percentText(detail.similarity) }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('admin.similarity.pair.stats.problem') }}</dt>
          <dd class="font-mono font-semibold">{{ detail.problemCode }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('admin.similarity.pair.stats.language') }}</dt>
          <dd class="font-mono font-semibold">{{ detail.language }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('admin.similarity.pair.stats.longest') }}</dt>
          <dd class="font-semibold">
            {{ $t('admin.similarity.pairs.kgram', { count: count(detail.longestFragment) }) }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('admin.similarity.pair.stats.overlap') }}</dt>
          <dd class="font-semibold">{{ count(detail.totalOverlap) }}</dd>
        </div>
        <div>
          <dt class="text-muted">{{ $t('admin.similarity.pair.stats.fragments') }}</dt>
          <dd class="font-semibold">
            {{
              $t('admin.similarity.pair.stats.fragmentsLimit', {
                count: count(detail.fragmentCount),
              })
            }}
          </dd>
        </div>
      </dl>
      <FragmentList
        :fragments="detail.fragments"
        :active-index="activeFragment"
        @select="selectFragment"
      />
      <div class="grid gap-4 lg:grid-cols-2">
        <PairSourcePane
          data-testid="pane-left"
          side="left"
          :source="detail.left"
          :fragment-of="leftFragmentOf"
        />
        <PairSourcePane
          data-testid="pane-right"
          side="right"
          :source="detail.right"
          :fragment-of="rightFragmentOf"
        />
      </div>
    </template>
  </QueryState>
</template>
