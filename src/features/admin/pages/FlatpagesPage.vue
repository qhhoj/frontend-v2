<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import type { FlatpageRevision } from '@/api/types/flatpages-admin';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import DeletedFlatpagesList from './DeletedFlatpagesList.vue';
import FlatpageEditor from './FlatpageEditor.vue';
import FlatpageEditorTabs from './FlatpageEditorTabs.vue';
import FlatpageHistoryPanel from './FlatpageHistoryPanel.vue';
import { positivePageOf } from './flatpage-route';
import { useFlatpageRevisionsQuery } from './flatpage-revisions.queries';
import { useFlatpagesQuery } from './flatpages.queries';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { can } = usePermissions();
/** What the page calls on the editor: the old-values load and the focus after it. */
interface FlatpageEditorHandle {
  loadOldValues: (changes: FlatpageRevision['changes'], at: string) => void;
  focusTitle: () => void;
}
const editor = ref<FlatpageEditorHandle | null>(null);
const listPage = computed(() => positivePageOf(route.query.lp));
const list = useFlatpagesQuery(listPage);
const pageParam = computed(() => (typeof route.query.page === 'string' ? route.query.page : null));
/** A deleted page has no editor: `?deleted=<id>` opens only its history, read-only. */
const deletedId = computed(() =>
  typeof route.query.deleted === 'string' && route.query.deleted ? route.query.deleted : null,
);
const isNewPage = computed(() => pageParam.value === 'new');
const pageId = computed(() => (pageParam.value && !isNewPage.value ? pageParam.value : null));
const tab = computed(() => (pageId.value && route.query.tab === 'history' ? 'history' : 'edit'));
const historyQuery = useFlatpageRevisionsQuery(pageId, 1);
const historyTotal = computed(() => historyQuery.data.value?.meta.total ?? null);
const total = computed(() => list.data.value?.meta.total ?? list.data.value?.items.length ?? 0);

/** The list and the editor both read `?page=`; every other key stays, the editor tab and the history page go. */
function goTo(page: string | null, mode: 'push' | 'replace' = 'push') {
  const query = {
    ...route.query,
    page: page ?? undefined,
    deleted: undefined,
    tab: undefined,
    hp: undefined,
  };
  void (mode === 'push' ? router.push({ query }) : router.replace({ query }));
}

/** A deleted page's history replaces the editor; picking a live page (`goTo`) drops it again. */
function openDeleted(id: string) {
  void router.push({
    query: { ...route.query, page: undefined, deleted: id, tab: undefined, hp: undefined },
  });
}

/** "Nạp giá trị cũ": the old values go into the form, then the editor tab is shown; nothing is saved. */
async function loadRevision(revision: FlatpageRevision) {
  editor.value?.loadOldValues(revision.changes, revision.at);
  await router.replace({ query: { ...route.query, tab: undefined, hp: undefined } });
  await nextTick();
  editor.value?.focusTitle();
}
</script>

<template>
  <div class="mx-auto flex max-w-[1280px] flex-col gap-6">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.pages.crumbs.content') },
        { label: $t('admin.shell.screens.pages') },
      ]"
      :title="$t('admin.shell.screens.pages')"
      :lead="$t('admin.pages.lead')"
    >
      <template #actions>
        <AdminBit placement="composing" />
        <button
          v-if="can('flatpages.add_flatpage')"
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          @click="goTo('new')"
        >
          {{ t('admin.pages.newPage') }}
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
      <section class="flex min-w-0 flex-col gap-3" :aria-label="$t('admin.shell.screens.pages')">
        <QueryState
          :loading="list.isPending.value"
          :error="list.error.value"
          @retry="list.refetch()"
        >
          <p class="text-sm text-muted">{{ t('admin.pages.list.total', { total }) }}</p>
          <ul class="flex flex-col gap-2">
            <li v-for="item in list.data.value?.items ?? []" :key="item.id">
              <button
                type="button"
                :aria-pressed="item.id === pageId"
                class="flex w-full min-w-0 flex-col gap-1 rounded-row border border-line bg-surface-solid p-3 text-left hover:bg-surface-hover aria-pressed:border-accent"
                @click="goTo(item.id)"
              >
                <span class="truncate font-semibold">{{ item.title }}</span>
                <span class="truncate font-mono text-xs text-muted">{{ item.url }}</span>
                <span
                  v-if="item.registrationRequired"
                  class="w-fit rounded-pill bg-accent-soft px-2 text-xs text-accent-soft-text"
                  >{{ t('admin.pages.list.loginChip') }}</span
                >
              </button>
            </li>
          </ul>
          <NumberedPager
            v-if="list.data.value"
            :meta="list.data.value.meta"
            :label="t('admin.pages.list.pager')"
            query-key="lp"
          />
        </QueryState>
        <DeletedFlatpagesList :opened-id="deletedId" @open="openDeleted" />
      </section>

      <section class="flex min-w-0 flex-col gap-4">
        <FlatpageHistoryPanel v-if="deletedId" :page-id="deletedId" readonly />
        <template v-else-if="pageParam">
          <FlatpageEditorTabs
            v-if="pageId"
            :active="tab"
            :has-history="true"
            :history-total="historyTotal"
          />
          <div v-show="tab !== 'history'">
            <FlatpageEditor
              ref="editor"
              :page-id="pageId"
              @created="(id) => goTo(id, 'replace')"
              @deleted="goTo(null, 'replace')"
            />
          </div>
          <FlatpageHistoryPanel
            v-if="tab === 'history' && pageId"
            :page-id="pageId"
            @load="loadRevision"
          />
        </template>
        <p v-else class="rounded-panel border border-dashed border-line p-6 text-center text-muted">
          {{ t('admin.pages.pick') }}
        </p>
      </section>
    </div>
  </div>
</template>
