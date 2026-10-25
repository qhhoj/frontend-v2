<script setup lang="ts">
import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Info,
  OctagonAlert,
  TriangleAlert,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed, ref, useId, useSlots } from 'vue';
import InlineBit from '@/components/InlineBit.vue';
import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';
type NoticeRole = 'alert' | 'status';
interface NoticeLook {
  box: string;
  icon: string;
  strokeWidth: number;
  tones: Record<NoticeTone, { box: string; icon: string }>;
  icons: Record<NoticeTone, Component>;
}

/**
 * An inline notice beside its cause: an icon (or Bit, any `InlineBit` kind), an optional title, the body (default slot: text or a
 * list), an optional long explanation behind a "Chi tiết" disclosure (`details` slot) and an `action` slot. It owns its surface.
 * The default look tints the whole box and puts the action on the right, or under the text when the
 * text would get less than 12rem beside it (a sign-in link on a phone); `compact` (admin) keeps content-coloured text on a
 * tinted box with a tinted icon and puts the action under the text. Role: a failure interrupts (`alert`), a success is
 * announced politely (`status`), standing advice has none; `role` overrides it (`null` = none).
 */
const props = withDefaults(
  defineProps<{
    tone?: NoticeTone;
    title?: string;
    compact?: boolean;
    bit?: BitMood | BitKind;
    role?: NoticeRole | null;
  }>(),
  { tone: 'info', title: undefined, compact: false, bit: undefined, role: undefined },
);

defineOptions({ name: 'UiNotice' });
const slots = useSlots();
const isOpen = ref(false);
const detailsId = useId();

const DEFAULT_ROLES: Record<NoticeTone, NoticeRole | undefined> = {
  info: undefined,
  success: 'status',
  warning: undefined,
  danger: 'alert',
};
/** Same tints as the verdicts: no notice colour of its own. */
const LOOKS: Record<'default' | 'compact', NoticeLook> = {
  default: {
    box: 'rounded-row px-3.5 py-3 leading-normal',
    icon: 'size-4.5',
    strokeWidth: 2,
    tones: {
      info: { box: 'bg-accent-soft text-accent-soft-text', icon: '' },
      success: { box: 'bg-verdict-ac-bg text-verdict-ac', icon: '' },
      warning: { box: 'bg-warning-bg text-warning', icon: '' },
      danger: { box: 'bg-verdict-wa-bg text-verdict-wa', icon: '' },
    },
    icons: { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert },
  },
  compact: {
    box: 'rounded-cell px-3 py-2.5 text-content',
    icon: 'size-4',
    strokeWidth: 1.75,
    tones: {
      info: { box: 'bg-info-bg', icon: 'text-info' },
      success: { box: 'bg-verdict-ac-bg', icon: 'text-verdict-ac' },
      warning: { box: 'bg-warning-bg', icon: 'text-warning' },
      danger: { box: 'bg-verdict-wa-bg', icon: 'text-verdict-wa' },
    },
    icons: { info: Info, success: CircleCheck, warning: TriangleAlert, danger: OctagonAlert },
  },
};

const look = computed(() => LOOKS[props.compact ? 'compact' : 'default']);
const resolvedRole = computed(() =>
  props.role === undefined ? DEFAULT_ROLES[props.tone] : (props.role ?? undefined),
);
</script>

<template>
  <div
    :role="resolvedRole"
    class="flex flex-wrap items-start gap-2.5 text-sm"
    :class="[look.box, look.tones[tone].box]"
  >
    <InlineBit v-if="bit" :kind="bit" />
    <component
      :is="look.icons[tone]"
      v-else
      aria-hidden="true"
      class="mt-0.5 shrink-0"
      :class="[look.icon, look.tones[tone].icon]"
      :stroke-width="look.strokeWidth"
    />
    <div class="min-w-0 grow basis-48">
      <p v-if="title" class="m-0 font-semibold">{{ title }}</p>
      <div v-if="slots.default"><slot /></div>
      <template v-if="slots.details">
        <button
          type="button"
          class="mt-1 inline-flex min-h-6 items-center gap-1 rounded-cell font-semibold underline underline-offset-2"
          :aria-expanded="isOpen"
          :aria-controls="detailsId"
          @click="isOpen = !isOpen"
        >
          {{ isOpen ? $t('common.notice.hideDetails') : $t('common.notice.details') }}
          <ChevronDown
            aria-hidden="true"
            class="size-4 transition-transform"
            :class="isOpen && 'rotate-180'"
            :stroke-width="1.75"
          />
        </button>
        <div v-show="isOpen" :id="detailsId" class="mt-2 flex flex-col gap-2">
          <slot name="details" />
        </div>
      </template>
      <slot v-if="compact" name="action" />
    </div>
    <slot v-if="!compact" name="action" />
  </div>
</template>
