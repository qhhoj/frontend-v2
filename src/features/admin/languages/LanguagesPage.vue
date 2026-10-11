<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_PRIMARY_CLASS } from '../ui/classes';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
import AdminBit from '../shell/AdminBit.vue';
import { useJudgesQuery } from '../judges/judges.queries';
import {
  hasVersionDrift,
  singleJudgeLanguages,
  unservedLanguages,
  withCoverage,
} from './languages';
import { useLanguagesAdminQuery } from './languages.queries';

const { can } = usePermissions();
const canSeeJudges = computed(() => can('judge.change_judge'));
const canAdd = computed(() => can('judge.add_language'));
const canEdit = computed(() => can('judge.change_language'));
const { data, isPending, error, refetch } = useLanguagesAdminQuery({ enabled: canEdit });
const judgesQuery = useJudgesQuery({ enabled: canSeeJudges });
/** Coverage is shown only once the judges have loaded for a viewer who may read them. */
const judges = computed(() => (canSeeJudges.value ? (judgesQuery.data.value ?? null) : null));
/** A failed judges request is said out loud: the coverage column then vanishes, which would otherwise look like a missing permission. */
const hasJudgesError = computed(() => judgesQuery.isError.value);
const rows = computed(() => withCoverage(data.value ?? [], judges.value));
const singles = computed(() => singleJudgeLanguages(rows.value));
const unserved = computed(() => unservedLanguages(rows.value));
const onlineJudgeCount = computed(() => judges.value?.filter((judge) => judge.online).length ?? 0);
const judgeTotal = computed(() => judges.value?.length ?? 0);
const percentOf = (count: number) =>
  judgeTotal.value === 0 ? 0 : (count / judgeTotal.value) * 100;
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.languages.crumbs.group') },
        { label: $t('admin.languages.crumbs.languages') },
      ]"
      :title="$t('admin.languages.title')"
      :lead="$t('admin.languages.lead')"
    >
      <template #actions>
        <RouterLink v-if="canAdd" :to="{ name: 'admin-languageNew' }" :class="ADMIN_PRIMARY_CLASS">
          {{ $t('admin.languages.actions.add') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <SettingsNotice v-if="!canEdit && canAdd" tone="info">{{
      $t('admin.languages.addOnly')
    }}</SettingsNotice>
    <QueryState v-if="canEdit" :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-4">
          <SkeletonBlock class="h-20 w-full" />
          <SkeletonBlock class="h-64 w-full" />
        </div>
      </template>
      <section class="glass flex flex-wrap gap-x-8 gap-y-2 rounded-panel p-5 text-sm">
        <p class="font-semibold">{{ $t('admin.languages.stats.count', { count: rows.length }) }}</p>
        <template v-if="judges">
          <p class="flex items-center gap-1.5">
            <AdminBit v-if="onlineJudgeCount > 0" placement="queued" />
            {{ $t('admin.languages.stats.online', { online: onlineJudgeCount }) }}
          </p>
          <p>{{ $t('admin.languages.stats.single', { single: singles.length }) }}</p>
        </template>
      </section>
      <SettingsNotice v-if="hasJudgesError" tone="warning">{{
        $t('admin.languages.judgesUnavailable')
      }}</SettingsNotice>
      <SettingsNotice
        v-for="row in unserved"
        :key="`unserved-${row.key}`"
        tone="error"
        :bit="ADMIN_BIT_KINDS.refused"
      >
        <p class="font-semibold">{{ $t('admin.languages.unserved.title', { key: row.key }) }}</p>
        <p>{{ $t('admin.languages.unserved.body', { name: row.name }) }}</p>
      </SettingsNotice>
      <div v-for="single in singles" :key="single.key">
        <SettingsNotice tone="warning" :bit="ADMIN_BIT_KINDS.refused">
          <p class="font-semibold">{{ $t('admin.languages.single.title', { key: single.key }) }}</p>
          <p>
            {{
              $t('admin.languages.single.body', {
                key: single.key,
                judge: single.judges?.[0] ?? '',
              })
            }}
          </p>
        </SettingsNotice>
      </div>
      <div v-if="rows.length > 0" class="glass overflow-x-auto rounded-panel p-5">
        <table class="w-full min-w-max text-left text-sm">
          <thead>
            <tr class="border-b border-line text-muted">
              <th scope="col" class="py-2 pr-4 font-semibold">
                {{ $t('admin.languages.table.key') }}
              </th>
              <th scope="col" class="py-2 pr-4 font-semibold">
                {{ $t('admin.languages.table.name') }}
              </th>
              <th scope="col" class="py-2 pr-4 font-semibold">
                {{ $t('admin.languages.table.extension') }}
              </th>
              <th scope="col" class="py-2 pr-4 font-semibold">
                {{ $t('admin.languages.table.inProblem') }}
              </th>
              <th v-if="judges" scope="col" class="py-2 pr-4 font-semibold">
                {{ $t('admin.languages.table.coverage') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key" class="border-b border-line align-top">
              <td class="py-3 pr-4">
                <RouterLink
                  v-if="canEdit"
                  :to="{ name: 'admin-languageEdit', params: { key: row.key } }"
                  class="font-mono underline-offset-2 hover:underline"
                  >{{ row.key }}</RouterLink
                >
                <span v-else class="font-mono">{{ row.key }}</span>
              </td>
              <td class="py-3 pr-4">
                {{ row.name }}
                <span
                  v-if="row.fileOnly"
                  class="ml-1.5 rounded-pill border border-line px-2 text-xs text-muted"
                >
                  {{ $t('admin.languages.table.fileOnly') }}
                </span>
              </td>
              <td class="py-3 pr-4 font-mono">.{{ row.extension }}</td>
              <td class="py-3 pr-4">
                {{
                  row.includeInProblem
                    ? $t('admin.languages.table.yes')
                    : $t('admin.languages.table.no')
                }}
              </td>
              <td v-if="judges" class="py-3 pr-4">
                <div class="flex flex-col gap-2">
                  <p>
                    {{
                      $t('admin.languages.table.judgesCount', {
                        count: row.judges?.length ?? 0,
                        total: judgeTotal,
                      })
                    }}
                    <span
                      :class="
                        row.onlineJudges?.length ? 'text-muted' : 'font-semibold text-negative'
                      "
                    >
                      ·
                      {{
                        $t('admin.languages.table.onlineCount', {
                          count: row.onlineJudges?.length ?? 0,
                        })
                      }}
                    </span>
                  </p>
                  <span
                    v-if="hasVersionDrift(row)"
                    class="self-start rounded-pill border border-line-strong px-2 text-xs font-semibold"
                  >
                    {{ $t('admin.languages.table.versionDrift') }}
                  </span>
                  <div aria-hidden="true" class="h-2 w-28 rounded-pill bg-surface-hover">
                    <div
                      class="h-2 rounded-pill bg-accent"
                      :style="{ width: `${percentOf(row.judges?.length ?? 0)}%` }"
                    />
                  </div>
                  <details>
                    <summary class="cursor-pointer text-accent-text">
                      {{ $t('admin.languages.table.showJudges') }}
                    </summary>
                    <ul class="mt-1 font-mono">
                      <li v-for="version in row.versions ?? []" :key="version.judge">
                        <RouterLink :to="{ name: 'admin-judges' }" class="hover:underline">{{
                          version.judge
                        }}</RouterLink>
                        <span class="text-muted"> · {{ version.runtime }}</span>
                      </li>
                    </ul>
                  </details>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <section v-else class="glass flex flex-col items-center gap-3 rounded-panel p-6 text-center">
        <AdminBit placement="empty" />
        <p>{{ $t('admin.languages.empty') }}</p>
        <RouterLink v-if="canAdd" :to="{ name: 'admin-languageNew' }" :class="ADMIN_PRIMARY_CLASS">
          {{ $t('admin.languages.actions.add') }}
        </RouterLink>
      </section>
    </QueryState>
  </div>
</template>
