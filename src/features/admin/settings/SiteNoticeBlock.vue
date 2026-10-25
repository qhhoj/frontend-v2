<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed, ref, useId, watch } from 'vue';
import { deleteConfig, putConfig } from '@/api/site-admin.api';
import Notice from '@/components/ui/Notice.vue';
import { SITE_NOTICE_KEY } from '@/features/site-notice/site-notice';
import AdminField from '../ui/AdminField.vue';
import AdminChip from '../ui/AdminChip.vue';
import { failureTextOf } from '../ui/admin-errors';
import { CARD, INPUT, buttonClass } from '../ui/controls';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import ConfigHistory from '../site/ConfigHistory.vue';
import { refreshAfterConfigWrite, writeConfig } from '../site/site.queries';
import SettingInfo from './SettingInfo.vue';
import { NOTICE_BLOCK } from './setting-blocks';
import type { BlockSaveOutcome } from './settings-page';

/** The longest value a misc config key takes (backend `CONFIG_VALUE_MAX`). */
const NOTICE_MAX = 20_000;

/**
 * The site notice (`top_notification`, plain text above every page) as a block of the settings page: it reports
 * whether it changed and saves through the page's one save bar like any setting block. An emptied box takes the notice down.
 */
const props = defineProps<{ current: string | null; shown?: boolean }>();
const emit = defineEmits<{ dirty: [count: number] }>();
const headingId = useId();
const queryClient = useQueryClient();
/** The stored notice as the box compares it: a blank one shows nothing, so it counts as none. */
const stored = computed(() => props.current?.trim() ?? '');
const text = ref(stored.value);
/** Another write updates the box only while it holds no edit of its own. */
watch(stored, (value, previous) => {
  if (text.value.trim() === previous) text.value = value;
});
const trimmed = computed(() => text.value.trim());
const isChanged = computed(() => trimmed.value !== stored.value);
watch(isChanged, (changed) => emit('dirty', changed ? 1 : 0), { immediate: true });
const tooLong = computed(() => trimmed.value.length > NOTICE_MAX);
const failure = ref<string | null>(null);
const isHistoryOpen = ref(false);

async function save(): Promise<BlockSaveOutcome> {
  if (!isChanged.value) return 'unchanged';
  if (tooLong.value) return 'refused';
  const value = trimmed.value || null;
  try {
    if (value === null) await deleteConfig(SITE_NOTICE_KEY);
    else await putConfig(SITE_NOTICE_KEY, value);
  } catch (error) {
    failure.value = failureTextOf(error);
    return 'refused';
  }
  failure.value = null;
  writeConfig(queryClient, SITE_NOTICE_KEY, value);
  refreshAfterConfigWrite(queryClient);
  return 'saved';
}
const discard = () => {
  text.value = stored.value;
  failure.value = null;
};
defineExpose({ save, discard });
</script>

<template>
  <section
    v-show="shown !== false"
    :data-block="NOTICE_BLOCK.id"
    :aria-labelledby="headingId"
    :class="[CARD, 'flex min-w-0 flex-col gap-4 p-4 sm:p-5']"
  >
    <header>
      <h2 :id="headingId" class="font-display text-base font-semibold">
        {{ $t('admin.site.notice.title') }}
      </h2>
      <p class="mt-0.5 max-w-prose text-sm text-muted">{{ $t('admin.site.notice.lead') }}</p>
    </header>
    <div class="flex items-start gap-2" :data-key="SITE_NOTICE_KEY">
      <AdminField
        v-slot="{ id, describedBy }"
        class="min-w-0 flex-1"
        :label="$t('admin.site.notice.label')"
        :hint="$t('admin.site.notice.hint')"
        :error="tooLong ? $t('admin.site.notice.tooLong') : undefined"
      >
        <textarea
          :id="id"
          v-model="text"
          rows="3"
          :class="[INPUT, 'min-h-20 resize-y py-2']"
          :aria-describedby="describedBy"
        />
      </AdminField>
      <div class="flex shrink-0 items-center gap-1">
        <AdminChip v-if="stored" tone="accent">{{ $t('admin.site.notice.live') }}</AdminChip>
        <SettingInfo
          :setting-key="SITE_NOTICE_KEY"
          :default-text="null"
          :is-at-default="true"
          @history="isHistoryOpen = !isHistoryOpen"
        />
      </div>
    </div>
    <div v-if="trimmed" class="flex flex-col gap-1.5">
      <span class="text-caption leading-4 font-semibold text-muted">{{
        $t('admin.site.notice.preview')
      }}</span>
      <Notice tone="info">
        <span class="block whitespace-pre-line">{{ trimmed }}</span>
      </Notice>
    </div>
    <div>
      <button
        v-if="stored && text !== ''"
        type="button"
        :class="buttonClass('secondary', 'sm')"
        @click="text = ''"
      >
        {{ $t('admin.site.notice.takeDown') }}
      </button>
      <p v-else-if="stored" class="m-0 text-meta text-muted">
        {{ $t('admin.site.notice.takeDownHint') }}
      </p>
    </div>
    <div v-if="failure" role="alert">
      <AdminNotice tone="danger" :title="failure" />
    </div>
    <ConfigHistory v-if="isHistoryOpen" :config-key="SITE_NOTICE_KEY" />
  </section>
</template>
