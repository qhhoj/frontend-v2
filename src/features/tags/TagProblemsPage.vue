<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { TagProblemListItem, TagProblemQuery } from '@/api/tags.api';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import FilterBar from '@/components/ui/FilterBar.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { PageFact } from '@/components/ui/PageHeader.vue';
import PageLayout from '@/components/ui/PageLayout.vue';
import SelectField from '@/components/ui/SelectField.vue';
import { formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { usePermissions } from '@/stores/use-permissions';
import AddTagProblemDialog from './AddTagProblemDialog.vue';
import {
  TAG_JUDGES,
  isTagJudge,
  TAG_PROBLEMS_PAGE_SIZE,
  mayTag,
  useTagCatalogQuery,
  useTagProblemsQuery,
} from './tags.queries';

/**
 * Problems on other online judges (Codeforces, AtCoder, Kattis, VNOJ) that users tagged by topic. The search, the tag and the
 * judge live in the URL, so a filtered list can be shared; each row opens the problem's tags and comments.
 */
const MAX_ROW_TAGS = 4;
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const locale = useLocaleStore();
const session = useSessionStore();
const { can } = usePermissions();

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const search = computed({
  get: () => text(route.query.search),
  set: (value: string) => setQuery({ search: value }),
});
const tag = computed({
  get: () => text(route.query.tag),
  set: (value: string | number) => setQuery({ tag: String(value) }),
});
const judge = computed({
  get: () => text(route.query.judge),
  set: (value: string | number) => setQuery({ judge: String(value) }),
});
/** A filter change opens its first page; an empty value leaves the URL. */
function setQuery(change: Record<string, string>) {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...route.query, ...change, page: '' }))
    if (typeof value === 'string' && value !== '') query[key] = value;
  void router.replace({ query });
}

const query = computed<TagProblemQuery>(() => ({
  page: pageFromQuery(route.query.page),
  pageSize: TAG_PROBLEMS_PAGE_SIZE,
  ...(search.value ? { search: search.value } : {}),
  ...(tag.value ? { tag: tag.value } : {}),
  ...(isTagJudge(judge.value) ? { judges: [judge.value] } : {}),
}));
const list = useTagProblemsQuery(query);
const catalog = useTagCatalogQuery();
const rows = computed(() => list.data.value?.items ?? []);
const meta = computed(() => list.data.value?.meta ?? null);
const isFiltered = computed(() => Boolean(search.value || tag.value || judge.value));

const facts = computed<PageFact[]>(() =>
  meta.value
    ? [
        {
          label: t('tags.facts.problems'),
          value: formatNumber(meta.value.total, locale.locale),
          mono: true,
        },
      ]
    : [],
);
const columns = computed<DataTableColumn[]>(() => [
  { key: 'name', label: t('tags.table.name'), priority: 'primary', grow: true },
  { key: 'tags', label: t('tags.table.tags'), priority: 'secondary' },
  { key: 'judge', label: t('tags.table.judge'), priority: 'meta' },
]);
const shownTags = (row: TagProblemListItem) => row.tags.slice(0, MAX_ROW_TAGS);
const canTag = computed(() => mayTag(session.user, can));
const isAddOpen = ref(false);
function clearFilters() {
  void router.replace({ query: {} });
}
</script>

<template>
  <PageLayout>
    <template #header>
      <PageHeader :title="$t('tags.title')" :lead="$t('tags.lead')" :facts="facts">
        <template v-if="canTag" #actions>
          <AppButton tone="primary" @click="isAddOpen = true">
            <template #icon><Plus class="size-4" aria-hidden="true" /></template>
            {{ $t('tags.add.open') }}
          </AppButton>
        </template>
      </PageHeader>
    </template>
    <template #toolbar>
      <FilterBar v-model:search="search" :search-label="$t('tags.search')">
        <template #selects>
          <SelectField
            v-model="tag"
            :placeholder="$t('tags.filters.anyTag')"
            :aria-label="$t('tags.filters.tag')"
          >
            <optgroup v-for="group in catalog.data.value ?? []" :key="group.id" :label="group.name">
              <option v-for="entry in group.tags" :key="entry.id" :value="entry.code">
                {{ entry.name }}
              </option>
            </optgroup>
          </SelectField>
          <SelectField
            v-model="judge"
            :placeholder="$t('tags.filters.anyJudge')"
            :aria-label="$t('tags.filters.judge')"
          >
            <option v-for="name in TAG_JUDGES" :key="name" :value="name">{{ name }}</option>
          </SelectField>
        </template>
      </FilterBar>
    </template>
    <DataTable
      variant="ledger"
      :columns="columns"
      :rows="rows"
      :row-key="(row) => row.id"
      :row-label="(row) => row.name"
      :label="$t('tags.table.caption')"
      :row-to="(row) => ({ name: 'tag-problem', params: { code: row.code } })"
      :loading="list.isPending.value"
      :error="list.error.value"
      :filtered="isFiltered"
      :pager="meta ? { meta, label: $t('tags.pager') } : undefined"
      @clear-filters="clearFilters"
      @retry="list.refetch()"
    >
      <template #empty>
        <EmptyState inline>
          {{ $t(isFiltered ? 'tags.emptyFiltered' : 'tags.empty') }}
          <template #action>
            <AppButton v-if="isFiltered" @click="clearFilters">{{
              $t('common.clearFilters')
            }}</AppButton>
            <AppButton v-else-if="canTag" tone="primary" @click="isAddOpen = true">
              {{ $t('tags.add.open') }}
            </AppButton>
          </template>
        </EmptyState>
      </template>
      <template #cell-name="{ row }">
        <span class="flex min-w-0 flex-col">
          <span class="truncate font-semibold">{{ row.name }}</span>
          <span class="truncate font-mono text-caption text-muted">{{ row.code }}</span>
        </span>
      </template>
      <template #cell-tags="{ row }">
        <span class="flex flex-wrap gap-1">
          <Chip v-for="entry in shownTags(row)" :key="entry.id">{{ entry.name }}</Chip>
          <span v-if="row.tags.length > MAX_ROW_TAGS" class="text-caption text-muted">
            {{ $t('tags.table.more', { count: row.tags.length - MAX_ROW_TAGS }) }}
          </span>
        </span>
      </template>
      <template #cell-judge="{ row }">{{ row.judge ?? '—' }}</template>
    </DataTable>
    <AddTagProblemDialog v-if="canTag" v-model:visible="isAddOpen" />
  </PageLayout>
</template>
