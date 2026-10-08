<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import UserContent from '@/components/UserContent.vue';
import AuthFieldError from '@/features/auth/AuthFieldError.vue';
import LengthCounter from './LengthCounter.vue';
import { ABOUT_MAX_LENGTH } from './profile-draft';

type AboutTab = 'write' | 'saved';
const TABS: readonly AboutTab[] = ['write', 'saved'];
const props = withDefaults(defineProps<{ savedHtml: string; error?: string }>(), {
  error: undefined,
});
const about = defineModel<string>({ required: true });
const tab = ref<AboutTab>('write');
const tabButtons = ref<HTMLButtonElement[]>([]);
const baseId = useId();
const idOf = (part: string) => `${baseId}-${part}`;
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

function switchWithArrow(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  tab.value = tab.value === 'write' ? 'saved' : 'write';
  tabButtons.value[TABS.indexOf(tab.value)]?.focus();
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <label :for="idOf('text')" class="text-sm font-semibold text-content">{{
        $t('settings.profile.fieldName.about')
      }}</label>
      <div role="tablist" :aria-label="$t('settings.profile.aboutViews')" class="flex gap-1">
        <button
          v-for="name in TABS"
          :id="idOf(`tab-${name}`)"
          ref="tabButtons"
          :key="name"
          type="button"
          role="tab"
          :aria-selected="tab === name"
          :aria-controls="idOf(`panel-${name}`)"
          :tabindex="tab === name ? 0 : -1"
          class="min-h-11 rounded-pill px-3.5 text-sm"
          :class="
            tab === name
              ? 'bg-accent-soft font-semibold text-accent-soft-text'
              : 'text-muted hover:bg-surface-hover'
          "
          @click="tab = name"
          @keydown="switchWithArrow"
        >
          {{ $t(`settings.profile.aboutTab.${name}`) }}
        </button>
      </div>
    </div>
    <div
      v-show="tab === 'write'"
      :id="idOf('panel-write')"
      role="tabpanel"
      :aria-labelledby="idOf('tab-write')"
    >
      <textarea
        :id="idOf('text')"
        v-model="about"
        name="about"
        rows="8"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        class="block min-h-[150px] w-full resize-y rounded-row border bg-surface-solid px-3.5 py-3 font-mono text-[13.5px] leading-relaxed text-content"
        :class="error ? 'border-negative' : 'border-line-strong'"
      />
    </div>
    <div
      v-show="tab === 'saved'"
      :id="idOf('panel-saved')"
      role="tabpanel"
      tabindex="0"
      :aria-labelledby="idOf('tab-saved')"
      class="min-h-[150px] rounded-row border border-line bg-surface-strong px-4 py-3"
    >
      <UserContent v-if="savedHtml" :html="savedHtml" />
      <p v-else class="text-sm text-muted">{{ $t('settings.profile.aboutEmpty') }}</p>
    </div>
    <div class="flex items-start justify-between gap-3">
      <p :id="idOf('help')" class="text-[13px] leading-normal text-muted">
        {{ $t('settings.profile.aboutHelp') }}
      </p>
      <LengthCounter :used="about.length" :max="ABOUT_MAX_LENGTH" />
    </div>
    <AuthFieldError v-if="error" :id="idOf('error')" :message="error" />
  </div>
</template>
