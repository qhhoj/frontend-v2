<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import { restoreSettingRevision, SETTING_REVISIONS_PAGE_SIZE } from '@/api/settings-admin.api';
import type { Setting, SettingKey, SettingRevision } from '@/api/types/settings-admin';
import type { ApiError } from '@/api/client';
import { failureTextOf } from '../ui/admin-errors';
import { BUTTON, CARD } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { SETTING_KINDS } from './setting-blocks';
import { isRestorable } from './revisions';
import RevisionItem from './RevisionItem.vue';
import {
  settingRevisionsPrefix,
  useSettingRevisionsQuery,
  useStoreSettingAnswer,
} from './settings.queries';

/** One key's history, newest first. Restoring asks first; the server does the restoring and writes a new revision. */
/** `closable`: the settings page shows a Đóng button that hands focus back to the "Lịch sử" button that opened it. */
const props = defineProps<{ settingKey: SettingKey; canRestore: boolean; closable?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const root = ref<HTMLElement | null>(null);
const heading = ref<HTMLElement | null>(null);
const { t } = useI18n();
const page = ref(1);
/** A different key starts its own history on its first page. */
watch(
  () => props.settingKey,
  () => (page.value = 1),
);

/** Brings the panel into view and moves focus to its heading, so a phone user sees it open and a screen reader hears it. */
function revealPanel() {
  root.value?.scrollIntoView({ block: 'start' });
  heading.value?.focus();
}
defineExpose({ revealPanel });
const revisions = useSettingRevisionsQuery(() => props.settingKey, page);
const storeAnswer = useStoreSettingAnswer();
const restoreTarget = ref<SettingRevision | null>(null);

const items = computed(() => revisions.data.value?.items ?? []);
const total = computed(() => revisions.data.value?.meta.total ?? 0);
const isLastPage = computed(() => page.value * SETTING_REVISIONS_PAGE_SIZE >= total.value);
const kind = computed(() => SETTING_KINDS[props.settingKey]);
const isWholeSecret = computed(() => !isRestorable(kind.value));
const restoreLabel = computed(() =>
  t(
    kind.value.kind === 'oauth'
      ? 'admin.settings.revisions.restoreField'
      : 'admin.settings.revisions.restore',
  ),
);
const isConfirmOpen = computed({
  get: () => restoreTarget.value !== null,
  set: (isOpen: boolean) => {
    if (!isOpen) restoreTarget.value = null;
  },
});

const restore = useAdminMutation<SettingRevision, Setting>({
  mutate: (revision) => restoreSettingRevision(props.settingKey, revision.id),
  invalidates: () => [settingRevisionsPrefix(props.settingKey)],
  successText: () => t('admin.settings.revisions.restored', { key: props.settingKey }),
  onDone: (answer) => {
    restoreTarget.value = null;
    storeAnswer(answer);
  },
});

function askToRestore(revision: SettingRevision) {
  restore.reset();
  restoreTarget.value = revision;
}

/** A stale page may still offer the button: the server's 409 reads as the same fact. */
function restoreFailureText(failure: ApiError): string {
  return failure.code === 'secret_unrestorable'
    ? t('admin.settings.revisions.notRestorable')
    : failureTextOf(failure);
}
</script>

<template>
  <section ref="root" data-testid="revisions" :class="[CARD, 'flex flex-col gap-4 p-4']">
    <header class="flex flex-wrap items-start justify-between gap-2">
      <div class="flex flex-col gap-1">
        <h2
          ref="heading"
          tabindex="-1"
          class="font-display text-base font-semibold focus-visible:outline-none"
        >
          {{ t('admin.settings.revisions.title', { key: settingKey }) }}
        </h2>
        <p class="text-sm text-muted">{{ t('admin.settings.revisions.subtitle') }}</p>
      </div>
      <button v-if="closable" type="button" :class="BUTTON.ghost" @click="emit('close')">
        {{ t('admin.settings.revisions.close') }}
      </button>
    </header>
    <QueryState
      :loading="revisions.isPending.value"
      :error="revisions.error.value"
      @retry="revisions.refetch()"
    >
      <p v-if="items.length === 0" class="text-sm text-muted">
        {{ t('admin.settings.revisions.empty') }}
      </p>
      <ol v-else class="flex flex-col gap-3">
        <li v-for="revision in items" :key="revision.id">
          <RevisionItem
            :revision="revision"
            :can-restore="canRestore && !isWholeSecret"
            :restore-label="restoreLabel"
            :is-whole-secret="isWholeSecret"
            @restore="askToRestore"
          />
        </li>
      </ol>
    </QueryState>
    <nav
      v-if="page > 1 || !isLastPage"
      class="flex flex-wrap items-center justify-between gap-2 text-sm text-muted"
    >
      <span>{{ t('admin.settings.revisions.total', { total }) }}</span>
      <span class="flex gap-2">
        <button
          type="button"
          :class="BUTTON.secondary"
          :aria-disabled="page <= 1 || undefined"
          @click="page > 1 && (page -= 1)"
        >
          {{ t('admin.settings.revisions.previous') }}
        </button>
        <button
          type="button"
          :class="BUTTON.secondary"
          :aria-disabled="isLastPage || undefined"
          @click="!isLastPage && (page += 1)"
        >
          {{ t('admin.settings.revisions.next') }}
        </button>
      </span>
    </nav>
    <p class="text-xs text-muted">{{ t('admin.settings.revisions.footnote') }}</p>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="t('admin.settings.revisions.confirmTitle')"
      :body="t('admin.settings.revisions.confirmBody')"
      :confirm-label="t('admin.settings.revisions.restore')"
      :busy="restore.isPending.value"
      @confirm="restoreTarget && restore.run(restoreTarget)"
    >
      <template #error>
        <p v-if="restore.failure.value" role="alert" class="text-sm text-negative">
          {{ restoreFailureText(restore.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
