<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import UserContent from '@/components/UserContent.vue';
import Tabs from '@/components/ui/Tabs.vue';
import type { TabItem } from '@/components/ui/Tabs.vue';
import AuthFieldError from '@/features/auth/AuthFieldError.vue';
import { translate } from '@/i18n';
import LengthCounter from './LengthCounter.vue';
import { profileFieldId } from './profile-field-ids';
import { ABOUT_MAX_LENGTH, storedLength } from './profile-draft';

const TABS = ['write', 'saved'] as const;
const props = withDefaults(defineProps<{ savedHtml: string; error?: string }>(), {
  error: undefined,
});
const about = defineModel<string>({ required: true });
const tab = ref<string>('write');
/** The error summary's link to this field: the text must be on screen before it can take the focus. */
function showWriteTab() {
  tab.value = 'write';
}
defineExpose({ showWriteTab });
const baseId = useId();
const TEXT_ID = profileFieldId('about');
const idOf = (part: string) => `${baseId}-${part}`;
const tabItems = computed<TabItem[]>(() =>
  TABS.map((name) => ({
    key: name,
    label: translate(`settings.profile.aboutTab.${name}`),
    panelId: idOf(`panel-${name}`),
  })),
);
const describedBy = computed(() =>
  [props.error && idOf('error'), idOf('help')].filter(Boolean).join(' '),
);

// An error is fixed in the text, so the text must be on screen (the page focuses it next).
watch(
  () => props.error,
  (error) => {
    if (error) tab.value = 'write';
  },
);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <label :for="TEXT_ID" class="text-sm font-semibold text-content">{{
        $t('settings.profile.fieldName.about')
      }}</label>
      <Tabs
        v-model="tab"
        :items="tabItems"
        :label="$t('settings.profile.aboutViews')"
        overflow="scroll"
      />
    </div>
    <div
      v-show="tab === 'write'"
      :id="idOf('panel-write')"
      role="tabpanel"
      :aria-labelledby="`${idOf('panel-write')}-tab`"
    >
      <textarea
        :id="TEXT_ID"
        v-model="about"
        name="about"
        rows="8"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        class="scroll-mb-28 block min-h-[150px] w-full resize-y rounded-row border bg-surface-solid px-3.5 py-3 font-mono text-meta leading-relaxed text-content"
        :class="error ? 'border-negative' : 'border-line-strong'"
      />
    </div>
    <div
      v-show="tab === 'saved'"
      :id="idOf('panel-saved')"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="`${idOf('panel-saved')}-tab`"
      class="min-h-[150px] rounded-row border border-line bg-surface-strong px-4 py-3"
    >
      <UserContent v-if="savedHtml" :html="savedHtml" />
      <p v-else class="text-sm text-muted">{{ $t('settings.profile.aboutEmpty') }}</p>
    </div>
    <div class="flex items-start justify-between gap-3">
      <p :id="idOf('help')" class="text-meta leading-normal text-muted">
        {{ $t('settings.profile.aboutHelp') }}
      </p>
      <LengthCounter :used="storedLength(about)" :max="ABOUT_MAX_LENGTH" />
    </div>
    <AuthFieldError v-if="error" :id="idOf('error')" :message="error" />
  </div>
</template>
