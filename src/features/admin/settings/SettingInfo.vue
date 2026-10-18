<script setup lang="ts">
import { History, Info, RotateCcw } from 'lucide-vue-next';
import Popover from 'primevue/popover';
import { ref } from 'vue';
import IconButton from '@/components/ui/IconButton.vue';
import { buttonClass } from '../ui/controls';

/**
 * The ⓘ beside a setting: its key, its default, its history and the reset, kept out of the way until asked for (P-34).
 * The popover stays inside the row (`appendTo="self"`), so the row's own focus order holds.
 */
const props = defineProps<{
  settingKey: string;
  /** The default as text; null for a key without a usable default (a secret). */
  defaultText: string | null;
  isAtDefault: boolean;
}>();
const emit = defineEmits<{ history: []; reset: [] }>();
const popover = ref<InstanceType<typeof Popover> | null>(null);

const openHistory = () => {
  popover.value?.hide();
  emit('history');
};
/** It only fills the box: the user presses "Lưu" like for any edit. */
const reset = () => {
  if (props.isAtDefault) return;
  popover.value?.hide();
  emit('reset');
};
</script>

<template>
  <span class="inline-flex">
    <IconButton
      :id="`info-${settingKey}`"
      :label="$t('admin.settings.info.label', { key: settingKey })"
      size="sm"
      aria-haspopup="dialog"
      data-testid="setting-info"
      @click="popover?.toggle($event)"
    >
      <Info class="size-4" :stroke-width="1.75" />
    </IconButton>
    <Popover ref="popover" append-to="self">
      <div class="flex max-w-72 min-w-56 flex-col gap-2 text-sm">
        <code class="font-mono text-xs break-all text-muted">{{ settingKey }}</code>
        <p v-if="defaultText !== null" class="m-0">
          {{ $t('admin.settings.info.default') }}
          <span class="font-mono">{{ defaultText }}</span>
        </p>
        <div class="flex flex-wrap gap-2">
          <button type="button" :class="buttonClass('secondary', 'sm')" @click="openHistory">
            <History aria-hidden="true" class="size-4" :stroke-width="1.75" />
            {{ $t('admin.settings.history') }}
          </button>
          <!-- aria-disabled, not disabled: the button keeps focus when the box already holds the default -->
          <button
            v-if="defaultText !== null"
            type="button"
            :class="buttonClass('secondary', 'sm')"
            :aria-label="$t('admin.settings.reset.label', { value: defaultText })"
            :aria-disabled="isAtDefault || undefined"
            @click="reset"
          >
            <RotateCcw aria-hidden="true" class="size-4" :stroke-width="1.75" />
            {{ $t('admin.settings.info.reset') }}
          </button>
        </div>
      </div>
    </Popover>
  </span>
</template>
