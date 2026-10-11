<script setup lang="ts">
import { computed, ref } from 'vue';
import { CONTEST_TAG_PAGE_SIZE, deleteContestTag } from '@/api/contest-tags.api';
import type { ContestTag } from '@/api/types/contest-tags';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { CONTEST_TAGS_KEY, useContestTagsQuery } from '@/features/contests/contest-extras.queries';
import { TAG_COLOR_CLASSES } from '@/features/contests/tag-colors';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import ContestTagEditor from './ContestTagEditor.vue';

const SKELETON_ROWS = 4;
const { data: tags, isPending, error, refetch } = useContestTagsQuery();
const rows = computed(() => tags.value ?? []);
const isFull = computed(() => rows.value.length >= CONTEST_TAG_PAGE_SIZE);
const editing = ref<ContestTag | null>(null);
const removing = ref<ContestTag | null>(null);
const isRemoveOpen = computed({
  get: () => removing.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) removing.value = null;
  },
});
const removal = useAdminMutation({
  mutate: (tag: ContestTag) => deleteContestTag(tag.slug),
  invalidates: () => [CONTEST_TAGS_KEY],
  onDone: (_result, tag) => {
    if (editing.value?.slug === tag.slug) editing.value = null;
    removing.value = null;
  },
});
function askRemove(tag: ContestTag) {
  removal.reset();
  removing.value = tag;
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader :title="$t('admin.contestTags.title')" :lead="$t('admin.contestTags.lead')">
      <template #actions><AdminBit placement="header" /></template>
    </AdminPageHeader>
    <ContestTagEditor :tag="editing" :is-full="isFull" @done="editing = null" />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="glass flex flex-col gap-3 rounded-panel p-3">
          <SkeletonBlock
            v-for="index in SKELETON_ROWS"
            :key="index"
            data-skeleton-region="tag-row"
            class="h-11 w-full"
          />
        </div>
      </template>
      <p
        v-if="rows.length === 0"
        class="glass flex items-center gap-3 rounded-panel p-5 text-muted"
      >
        <AdminBit placement="empty" />{{ $t('admin.contestTags.empty') }}
      </p>
      <div v-else class="glass overflow-x-auto rounded-panel p-3">
        <table class="w-full min-w-[320px] text-sm">
          <caption class="sr-only">
            {{
              $t('admin.contestTags.caption')
            }}
          </caption>
          <thead class="text-left text-muted">
            <tr>
              <th scope="col" class="px-2 py-2">{{ $t('admin.contestTags.columns.tag') }}</th>
              <th scope="col" class="hidden px-2 py-2 md:table-cell">
                {{ $t('admin.contestTags.columns.slug') }}
              </th>
              <th scope="col" class="hidden px-2 py-2 md:table-cell">
                {{ $t('admin.contestTags.columns.order') }}
              </th>
              <th scope="col" class="hidden px-2 py-2 lg:table-cell">
                {{ $t('admin.contestTags.columns.description') }}
              </th>
              <th scope="col" class="px-2 py-2">
                <span class="sr-only">{{ $t('admin.contestTags.columns.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tag in rows"
              :key="tag.slug"
              data-testid="tag-row"
              class="border-t border-line"
            >
              <td class="px-2 py-3">
                <span
                  :class="[
                    'inline-flex min-h-6.5 items-center rounded-pill border px-2.5 text-[12.5px] font-semibold',
                    TAG_COLOR_CLASSES[tag.color],
                  ]"
                  >{{ tag.name }}</span
                >
                <span class="block font-mono text-[12px] text-muted md:hidden">{{ tag.slug }}</span>
              </td>
              <td class="hidden px-2 py-3 font-mono md:table-cell">{{ tag.slug }}</td>
              <td class="hidden px-2 py-3 md:table-cell">{{ tag.order }}</td>
              <td class="hidden px-2 py-3 text-muted lg:table-cell">{{ tag.description }}</td>
              <td class="px-2 py-3">
                <div class="flex justify-end gap-2">
                  <button type="button" :class="ADMIN_BUTTON_CLASS" @click="editing = tag">
                    {{ $t('admin.contestTags.edit')
                    }}<span class="sr-only">{{ ' ' + tag.name }}</span>
                  </button>
                  <button type="button" :class="ADMIN_BUTTON_CLASS" @click="askRemove(tag)">
                    {{ $t('admin.contestTags.remove')
                    }}<span class="sr-only">{{ ' ' + tag.name }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </QueryState>
    <ConfirmDialog
      v-model:visible="isRemoveOpen"
      :title="$t('admin.contestTags.removeTitle', { name: removing?.name ?? '' })"
      :body="$t('admin.contestTags.removeBody', { slug: removing?.slug ?? '' })"
      :confirm-label="$t('admin.contestTags.removeConfirm')"
      tone="danger"
      :busy="removal.isPending.value"
      @confirm="removing && removal.run(removing)"
    >
      <template #error>
        <p v-if="removal.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(removal.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </div>
</template>
