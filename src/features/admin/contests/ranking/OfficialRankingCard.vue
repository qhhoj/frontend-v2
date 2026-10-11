<script setup lang="ts">
import RankColumnHeader from '@/components/RankColumnHeader.vue';
import { computed, ref, useId } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  deleteOfficialRanking,
  fetchOfficialRanking,
  putOfficialRanking,
} from '@/api/contest-editing.api';
import type { OfficialRanking } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import AdminBit from '../../shell/AdminBit.vue';
import { failureTextOf, fieldErrorsOf } from '../../ui/admin-errors';
import { ADMIN_DANGER_CLASS, ADMIN_INPUT_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import UploadButton from '../../ui/UploadButton.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { formatFileSize } from '@/lib/format';
import { OFFICIAL_CSV_MAX_BYTES } from './ranking-link';

const props = defineProps<{ contestKey: string }>();
const officialKey = () => ['admin', 'official-ranking', props.contestKey] as const;
const {
  data: ranking,
  error,
  isPending,
  refetch,
} = useQuery({
  queryKey: computed(() => officialKey()),
  queryFn: () => fetchOfficialRanking(props.contestKey),
});

const mode = ref<'csv' | 'url'>('csv');
const pickedFile = ref<File | null>(null);
const urlText = ref('');
const isRemoveOpen = ref(false);
const sourceName = useId();
const topRows = computed(() => (ranking.value?.rows ?? []).slice(0, 3));

const queryClient = useQueryClient();
const storeRanking = (stored: OfficialRanking | null) =>
  queryClient.setQueryData(officialKey(), stored);

const upload = useAdminMutation({
  mutate: (body: { csv: string } | { url: string }) => putOfficialRanking(props.contestKey, body),
  onDone: (stored: OfficialRanking) => {
    storeRanking(stored);
    pickedFile.value = null;
  },
});
const remove = useAdminMutation({
  mutate: () => deleteOfficialRanking(props.contestKey),
  onDone: () => {
    storeRanking(null);
    isRemoveOpen.value = false;
  },
});

/** The reason the backend refused the file or the link: its field message, else the page-line text. */
const refusalText = computed(() => {
  const fields = fieldErrorsOf(upload.failure.value);
  if (fields.csv ?? fields.url) return fields.csv ?? fields.url;
  return upload.failure.value ? failureTextOf(upload.failure.value) : '';
});

async function submitCsv() {
  if (!pickedFile.value) return;
  await upload.run({ csv: await pickedFile.value.text() });
}
const submitUrl = () => upload.run({ url: urlText.value.trim() });
</script>

<template>
  <section class="glass flex min-w-0 flex-col gap-5 rounded-panel p-5">
    <header class="flex flex-col gap-1">
      <h2 class="font-display text-base font-bold">
        {{ $t('admin.contests.ranking.official.title') }}
      </h2>
      <p class="text-sm text-muted">{{ $t('admin.contests.ranking.official.lead') }}</p>
    </header>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <div class="flex flex-col gap-5">
        <fieldset class="flex flex-wrap gap-4">
          <legend class="sr-only">{{ $t('admin.contests.ranking.official.sourceLegend') }}</legend>
          <label class="flex min-h-11 items-center gap-2"
            ><input v-model="mode" type="radio" value="csv" :name="sourceName" />{{
              $t('admin.contests.ranking.official.modeCsv')
            }}</label
          >
          <label class="flex min-h-11 items-center gap-2"
            ><input v-model="mode" type="radio" value="url" :name="sourceName" />{{
              $t('admin.contests.ranking.official.modeUrl')
            }}</label
          >
        </fieldset>

        <div v-if="mode === 'csv'" class="flex flex-col gap-3">
          <UploadButton
            data-testid="official-csv"
            accept=".csv,text/csv"
            :max-bytes="OFFICIAL_CSV_MAX_BYTES"
            :is-pending="upload.isPending.value"
            :label="$t('admin.contests.ranking.official.chooseFile')"
            @picked="(file) => (pickedFile = file)"
          />
          <p class="text-sm text-muted">
            {{ pickedFile ? `${pickedFile.name} · ${formatFileSize(pickedFile.size)}` : '' }}
            {{ $t('admin.contests.ranking.official.csvHint') }}
          </p>
          <button
            type="button"
            :class="ADMIN_PRIMARY_CLASS"
            :disabled="!pickedFile || upload.isPending.value"
            @click="submitCsv"
          >
            {{ $t('admin.contests.ranking.official.upload') }}
          </button>
        </div>
        <div v-else class="flex flex-col gap-3">
          <label for="official-url" class="text-sm font-semibold">{{
            $t('admin.contests.ranking.official.urlLabel')
          }}</label>
          <input id="official-url" v-model="urlText" type="url" :class="ADMIN_INPUT_CLASS" />
          <button
            type="button"
            :class="ADMIN_PRIMARY_CLASS"
            :disabled="!urlText.trim() || upload.isPending.value"
            @click="submitUrl"
          >
            {{ $t('admin.contests.ranking.official.upload') }}
          </button>
        </div>

        <div
          v-if="refusalText"
          role="alert"
          class="glass flex flex-wrap items-center gap-3 rounded-row border border-negative p-4"
        >
          <AdminBit placement="refused" />
          <div>
            <p class="font-semibold">{{ $t('admin.contests.ranking.official.refusedTitle') }}</p>
            <p class="text-sm text-negative">{{ refusalText }}</p>
          </div>
        </div>

        <template v-if="ranking">
          <p class="text-sm font-semibold">
            {{ $t('admin.contests.ranking.official.current', { count: ranking.problems.length }) }}
          </p>
          <div
            class="overflow-x-auto"
            tabindex="0"
            role="region"
            :aria-label="
              $t('admin.contests.ranking.official.current', { count: ranking.problems.length })
            "
          >
            <table data-testid="official-table" class="w-full min-w-[480px] text-sm">
              <thead class="text-left text-muted">
                <tr>
                  <th scope="col" class="w-14 px-2 py-2 text-right">
                    <RankColumnHeader :label="$t('admin.contests.ranking.official.columns.rank')" />
                  </th>
                  <th scope="col" class="px-2 py-2">
                    {{ $t('admin.contests.ranking.official.columns.username') }}
                  </th>
                  <th scope="col" class="px-2 py-2">
                    {{ $t('admin.contests.ranking.official.columns.fullName') }}
                  </th>
                  <th
                    v-for="problem in ranking.problems"
                    :key="problem"
                    scope="col"
                    class="px-2 py-2"
                  >
                    {{ problem }}
                  </th>
                  <th scope="col" class="px-2 py-2">
                    {{ $t('admin.contests.ranking.official.columns.total') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in topRows" :key="row.username" class="border-t border-line">
                  <td class="px-2 py-2 text-right">{{ row.rank }}</td>
                  <td class="px-2 py-2 font-mono">{{ row.username }}</td>
                  <td class="px-2 py-2">{{ row.fullName }}</td>
                  <td v-for="(score, index) in row.scores" :key="index" class="px-2 py-2">
                    {{ score }}
                  </td>
                  <td class="px-2 py-2 font-semibold">{{ row.totalScore }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" :class="ADMIN_DANGER_CLASS" @click="isRemoveOpen = true">
            {{ $t('admin.contests.ranking.official.remove') }}
          </button>
        </template>
        <EmptyState v-else compact>{{ $t('admin.contests.ranking.official.empty') }}</EmptyState>
      </div>
    </QueryState>

    <ConfirmDialog
      v-model:visible="isRemoveOpen"
      :title="$t('admin.contests.ranking.official.removeTitle')"
      :body="$t('admin.contests.ranking.official.removeBody')"
      :confirm-label="$t('admin.contests.ranking.official.removeConfirm')"
      tone="danger"
      :busy="remove.isPending.value"
      @confirm="remove.run(undefined)"
    >
      <template #error>
        <p v-if="remove.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(remove.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
