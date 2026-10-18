<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Notice from '@/components/ui/Notice.vue';
import { usePermissions } from '@/stores/use-permissions';
import { buttonClass } from '../ui/controls';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import AdminBit from '../shell/AdminBit.vue';
import { useJudgesQuery } from '../judges/judges.queries';
import LanguageCoverageNotice from './LanguageCoverageNotice.vue';
import LanguagesTable from './LanguagesTable.vue';
import { singleJudgeLanguages, unservedLanguages, withCoverage } from './languages';
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
const judgeTotal = computed(() => judges.value?.length ?? null);
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
    <Notice v-if="!canEdit && canAdd" compact :role="null" :title="$t('admin.languages.addOnly')" />
    <QueryState v-if="canEdit" :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock class="h-64 w-full" />
      </template>
      <Notice
        v-if="hasJudgesError"
        compact
        :role="null"
        tone="warning"
        :title="$t('admin.languages.judgesUnavailable')"
      />
      <LanguageCoverageNotice :unserved="unserved" :singles="singles" />
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
