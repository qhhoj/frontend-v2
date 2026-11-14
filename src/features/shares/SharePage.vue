<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import CasesTable from '@/features/submissions/CasesTable.vue';
import TestOverview from '@/features/submissions/TestOverview.vue';
import { translate } from '@/i18n';
import { usePageTitle } from '@/router/page-title';
import ShareCodeCard from './ShareCodeCard.vue';
import ShareDetailsCard from './ShareDetailsCard.vue';
import ShareResultCard from './ShareResultCard.vue';
import { expiryMessage } from './share-expiry';
import { shareFailureOf } from './share-failure';
import { useNoIndex } from './use-no-index';
import { useShareQuery } from './shares.queries';

/**
 * `/c/:code`, the public page of a share (no sign-in, `noindex`). Two columns from `xl`, code wide and the rail narrow, as on
 * the submission page; below that one column: the result, then the code, then the tests and details. A paste has only
 * the details in its rail. The API answers 404 alike for an unknown, expired and taken-down link, and 403 for a copy whose
 * problem sits in a contest that is not over (or whose source the setter now hides), so each answer gets one panel; the
 * owner and staff get the copy with a notice instead (`hiddenReason`, `takenDown`).
 */
const route = useRoute();
useNoIndex();
const code = computed(() => String(route.params.code));
const { data: share, isPending, error, refetch } = useShareQuery(code);

const failure = computed(() => (error.value ? shareFailureOf(error.value) : null));
const isGone = computed(() => error.value instanceof ApiError && error.value.code === 'not_found');
const blockedKey = computed(() => {
  if (failure.value?.kind === 'contest') return 'share.state.contest';
  return failure.value?.kind === 'hidden' ? 'share.state.hidden' : null;
});
const isSubmission = computed(() => share.value?.kind === 'submission' && !!share.value.copy);
const heading = computed(() => {
  const row = share.value;
  if (!row) return translate('pages.share');
  if (row.title) return row.title;
  return row.problem?.name ?? translate(`share.kind.${row.kind}`);
});
usePageTitle(() => (share.value ? heading.value : null));

const STACK = 'min-w-0 xl:col-start-2';
</script>

<template>
  <div class="page-column">
    <Card v-if="isGone" as="div">
      <StatePanel
        kind="notFound"
        :title="$t('share.state.goneTitle')"
        :body="$t('share.state.goneBody')"
        is-page-heading
      >
        <AppButton tone="primary" :to="{ name: 'paste' }">{{
          $t('share.state.newPaste')
        }}</AppButton>
      </StatePanel>
    </Card>
    <Card v-else-if="blockedKey" as="div">
      <StatePanel
        kind="forbidden"
        :title="$t(`${blockedKey}Title`)"
        :body="$t(`${blockedKey}Body`)"
        is-page-heading
      >
        <AppButton :to="{ name: 'home' }">{{ $t('share.state.home') }}</AppButton>
      </StatePanel>
    </Card>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock class="h-10 w-72" />
        <SkeletonBlock class="h-96 w-full" />
      </template>
      <template v-if="share">
        <PageHeader
          :title="heading"
          :back="{ to: { name: 'paste' }, label: $t('share.paste.title') }"
        >
          <template #meta>
            <Chip tone="neutral">{{ $t(`share.kind.${share.kind}`) }}</Chip>
            <Chip tone="neutral"><LanguageLabel :language="share.language" /></Chip>
            <Chip tone="neutral">{{ expiryMessage(share.expiresAt, Date.now()) }}</Chip>
          </template>
        </PageHeader>
        <div
          class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-start"
        >
          <template v-if="isSubmission && share.copy">
            <ShareResultCard :class="[STACK, 'xl:row-start-1']" :share="share" :copy="share.copy" />
          </template>
          <ShareCodeCard
            :share="share"
            :class="[
              'xl:col-start-1 xl:row-start-1',
              isSubmission ? 'xl:row-span-3' : 'xl:row-span-1',
            ]"
          />
          <CasesTable
            v-if="isSubmission && share.copy"
            :class="[STACK, 'xl:row-start-2']"
            :summarized="false"
            :cases="share.copy.cases"
            :batches="share.copy.batches"
            :total-cases="share.copy.caseCount"
            :running="false"
            :compile-error="share.copy.status === 'CE' ? share.copy.compileLog : null"
            :compile-log-hidden="share.copy.status === 'CE' && !share.copy.compileLog"
          >
            <template #footer>
              <TestOverview
                :cases="share.copy.cases"
                :batches="share.copy.batches"
                :points="share.copy.points"
                :problem-points="share.copy.problemPoints"
                :case-points="share.copy.casePoints"
                :case-total="share.copy.caseTotal"
                :running="false"
              />
            </template>
          </CasesTable>
          <ShareDetailsCard
            :class="[STACK, isSubmission ? 'xl:row-start-3' : 'xl:row-start-1']"
            :share="share"
          />
        </div>
      </template>
    </QueryState>
  </div>
</template>
