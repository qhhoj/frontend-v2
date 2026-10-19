<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import QueryState from '@/components/QueryState.vue';
import Modal from '@/components/ui/Modal.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import UserLink from '@/components/UserLink.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useRevisionsQuery } from './comments.queries';
import { unifiedDiff, versionsOf } from './revision-versions';
import type { CommentVersion } from './revision-versions';

/** A comment's edit history: the versions newest first, and the chosen one as its changes (unified −/+ diff) or its full Markdown. */
const props = defineProps<{ commentId: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const { t } = useI18n();
const locale = useLocaleStore();
const { data, isPending, error, refetch } = useRevisionsQuery(
  () => props.commentId,
  () => visible.value,
);
const versions = computed(() => versionsOf(data.value ?? []));
const chosenEdit = ref<number | null>(null);
watch(
  () => props.commentId,
  () => (chosenEdit.value = null),
);
const chosen = computed(
  () =>
    versions.value.find((version) => version.edit === chosenEdit.value) ??
    versions.value[0] ??
    null,
);
type RevisionView = 'changes' | 'full';
const view = ref<RevisionView>('changes');
/** The original has nothing to compare with: only its full text, and the switch is locked. */
const hasChanges = computed(() => chosen.value?.previous != null);
const shownView = computed<RevisionView>(() => (hasChanges.value ? view.value : 'full'));
const viewOptions = computed(() =>
  (['changes', 'full'] as const).map((value) => ({
    value,
    label: t(`comments.revisions.${value}`),
  })),
);
const lines = computed(() => {
  const version = chosen.value;
  return version && version.previous !== null ? unifiedDiff(version.previous, version.text) : [];
});
const nameOf = (version: CommentVersion) =>
  version.edit === 0
    ? t('comments.revisions.original')
    : version.edit === versions.value[0]?.edit
      ? t('comments.revisions.current', { n: version.edit })
      : t('comments.revisions.edit', { n: version.edit });
const LINE_TONE = {
  same: 'text-muted',
  removed: 'bg-verdict-wa-bg text-verdict-wa',
  added: 'bg-verdict-ac-bg text-verdict-ac',
};
const SIGN = { same: ' ', removed: '−', added: '+' };
</script>

<template>
  <Modal v-model:visible="visible" size="lg">
    <template #header>
      <div class="flex flex-wrap items-baseline gap-2">
        <h2 class="font-display text-subtitle leading-7 font-semibold">
          {{ $t('comments.revisions.title') }}
        </h2>
        <span v-if="versions.length" class="text-sm text-muted">
          · {{ $t('comments.revisions.count', { count: versions.length - 1 }) }}
        </span>
      </div>
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <p class="text-sm text-muted">{{ $t('comments.revisions.loading') }}</p>
      </template>
      <div class="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        <nav :aria-label="$t('comments.revisions.versions')">
          <ol class="flex gap-1 overflow-x-auto md:flex-col">
            <li v-for="version in versions" :key="version.edit" class="shrink-0">
              <button
                type="button"
                :aria-current="version.edit === chosen?.edit || undefined"
                class="flex w-full flex-col items-start rounded-row px-3 py-2 text-left text-sm hover:bg-surface-hover aria-[current]:bg-accent-soft aria-[current]:text-accent-soft-text"
                @click="chosenEdit = version.edit"
              >
                <span class="font-semibold">{{ nameOf(version) }}</span>
                <span v-if="version.at" class="text-xs text-muted">
                  {{ formatDate(version.at, 'datetime', locale.locale) }}
                </span>
                <UserLink
                  v-if="version.editor"
                  :username="version.editor.username"
                  :rating="version.editor.rating"
                  class="text-xs"
                />
              </button>
            </li>
          </ol>
        </nav>
        <section v-if="chosen" class="flex min-w-0 flex-col gap-2">
          <SegmentedControl
            :model-value="shownView"
            :options="viewOptions"
            :label="$t('comments.revisions.views')"
            :disabled="!hasChanges"
            size="sm"
            @update:model-value="view = $event"
          />
          <template v-if="shownView === 'changes' && chosen.previous !== null">
            <h3 class="text-sm font-semibold">
              {{ $t('comments.revisions.compare', { version: nameOf(chosen) }) }}
            </h3>
            <p class="text-xs text-muted">{{ $t('comments.revisions.legend') }}</p>
            <div
              role="table"
              :aria-label="$t('comments.revisions.diffLabel')"
              class="max-h-96 overflow-auto rounded-row border border-line font-mono text-meta leading-relaxed"
            >
              <div
                v-for="(line, index) in lines"
                :key="index"
                role="row"
                class="flex"
                :class="LINE_TONE[line.kind]"
              >
                <span
                  :aria-hidden="line.kind === 'same' || undefined"
                  class="w-6 shrink-0 text-center select-none"
                  >{{ SIGN[line.kind] }}</span
                >
                <span role="cell" class="pr-3 break-words whitespace-pre-wrap">{{
                  line.text
                }}</span>
              </div>
            </div>
          </template>
          <pre
            v-else
            class="max-h-96 overflow-auto rounded-row border border-line p-3 font-mono text-meta leading-relaxed break-words whitespace-pre-wrap"
            >{{ chosen.text }}</pre>
        </section>
      </div>
    </QueryState>
  </Modal>
</template>
