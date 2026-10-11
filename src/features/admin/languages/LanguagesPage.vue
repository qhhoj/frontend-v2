<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { usePermissions } from '@/stores/use-permissions';
import { buttonClass } from '../ui/controls';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import AdminBit from '../shell/AdminBit.vue';
import { useJudgesQuery } from '../judges/judges.queries';
import LanguagesTable from './LanguagesTable.vue';
import { singleJudgeLanguages, unservedLanguages, withCoverage } from './languages';
import type { LanguageRow } from './languages';
import { useLanguagesAdminQuery } from './languages.queries';

const { t } = useI18n();
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
const judgeTotal = computed(() => judges.value?.length ?? null);
/** One caution notice for the single points of failure: one language is named in the title, several are counted. */
const singleTitle = computed(() =>
  singles.value.length === 1
    ? t('admin.languages.single.title', { key: singles.value[0]!.key })
    : t('admin.languages.single.many', { count: singles.value.length }),
);
const singleBody = (row: LanguageRow) =>
  t('admin.languages.single.body', { key: row.key, judge: row.judges?.[0] ?? '' });
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader :title="$t('admin.languages.title')" :lead="$t('admin.languages.lead')">
      <template #actions>
        <RouterLink
          v-if="canAdd"
          :to="{ name: 'admin-languageNew' }"
          :class="buttonClass('primary')"
        >
          {{ $t('admin.languages.actions.add') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <AdminNotice v-if="!canEdit && canAdd" :title="$t('admin.languages.addOnly')" />
    <QueryState v-if="canEdit" :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock class="h-64 w-full" />
      </template>
      <AdminNotice
        v-if="hasJudgesError"
        tone="caution"
        :title="$t('admin.languages.judgesUnavailable')"
      />
      <AdminNotice
        v-for="row in unserved"
        :key="`unserved-${row.key}`"
        tone="danger"
        :title="$t('admin.languages.unserved.title', { key: row.key })"
        :summary="$t('admin.languages.unserved.body', { name: row.name })"
      />
      <AdminNotice
        v-if="singles.length === 1"
        tone="caution"
        :title="singleTitle"
        :summary="singleBody(singles[0]!)"
      />
      <AdminNotice v-else-if="singles.length > 1" tone="caution" :title="singleTitle">
        <p v-for="single in singles" :key="single.key" class="m-0">{{ singleBody(single) }}</p>
      </AdminNotice>
      <LanguagesTable :rows="rows" :judge-total="judgeTotal" :can-edit="canEdit">
        <template #empty>
          <div class="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <AdminBit placement="empty" />
            <p>{{ $t('admin.languages.empty') }}</p>
            <RouterLink
              v-if="canAdd"
              :to="{ name: 'admin-languageNew' }"
              :class="buttonClass('secondary')"
            >
              {{ $t('admin.languages.actions.add') }}
            </RouterLink>
          </div>
        </template>
        <template #footer>
          {{
            judges
              ? $t('admin.languages.table.summary', {
                  count: rows.length,
                  online: onlineJudgeCount,
                })
              : $t('admin.languages.table.summaryNoJudges', { count: rows.length })
          }}
        </template>
      </LanguagesTable>
    </QueryState>
  </div>
</template>
