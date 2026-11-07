<script setup lang="ts">
import { ChevronDown, CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-vue-next';
import { computed, ref, useId, useSlots } from 'vue';
import InlineBit from '@/components/InlineBit.vue';
import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';
import IconButton from './IconButton.vue';

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger';
type NoticeRole = 'alert' | 'status';
type NoticeLookName = 'default' | 'compact' | 'inline';
interface NoticeLook {
  box: string;
  icon: string;
  tones: Record<NoticeTone, { box: string; icon: string }>;
}

/**
 * Feedback beside its cause: an icon (or Bit, any `InlineBit` kind), an optional title, the body (default slot: text or a
 * list), an optional long explanation behind a "Chi tiết" disclosure (`details` slot) and an `action` slot. It owns its surface.
 * The default look tints the whole box and puts the action on the right, or under the text when the
 * text would get less than 12rem beside it (a sign-in link on a phone); `compact` (admin) keeps content-coloured text on a
 * tinted box with a tinted icon and puts the action under the text; `inline` is one line with no box (icon and text in the
 * tone's ink, the field-error look) for a failure right under the control that caused it. `dismissible` adds a close button
 * that emits `dismiss`. Role: a failure always interrupts (`alert`, whatever `role` says), a success is announced politely
 * (`status`), standing advice has none; `role` overrides the last two (`null` = none).
 */
const props = withDefaults(
  defineProps<{
    tone?: NoticeTone;
    title?: string;
    compact?: boolean;
    inline?: boolean;
    dismissible?: boolean;
    bit?: BitMood | BitKind;
    role?: NoticeRole | null;
  }>(),
  {
    tone: 'info',
    title: undefined,
    compact: false,
    inline: false,
    dismissible: false,
    bit: undefined,
    role: undefined,
  },
);
defineEmits<{ dismiss: [] }>();

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
/** One icon per tone in every look. */
const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert };
/** One status tint per tone (positive/negative/warning/info tokens) in every look: no notice colour of its own. */
const INKS: Record<NoticeTone, string> = {
  info: 'text-info',
  success: 'text-positive',
  warning: 'text-warning',
  danger: 'text-negative',
};
const TINTS: Record<NoticeTone, string> = {
  info: 'bg-info-bg',
  success: 'bg-positive-bg',
  warning: 'bg-warning-bg',
  danger: 'bg-negative-bg',
};
const toneMap = (box: (tone: NoticeTone) => string, icon: (tone: NoticeTone) => string) =>
  Object.fromEntries(
    (Object.keys(INKS) as NoticeTone[]).map((tone) => [tone, { box: box(tone), icon: icon(tone) }]),
  ) as NoticeLook['tones'];
const LOOKS: Record<NoticeLookName, NoticeLook> = {
  default: {
    box: 'gap-2.5 rounded-row px-3.5 py-3 text-sm leading-normal',
    icon: 'mt-0.5 size-4.5',
    tones: toneMap(
      (tone) => `${TINTS[tone]} ${INKS[tone]}`,
      () => '',
    ),
  },
  compact: {
    box: 'gap-2.5 rounded-cell px-3 py-2.5 text-sm text-content',
    icon: 'mt-0.5 size-4',
    tones: toneMap(
      (tone) => TINTS[tone],
      (tone) => INKS[tone],
    ),
  },
  inline: {
    box: 'gap-1.5 text-meta',
    icon: 'mt-0.5 size-3.5',
    tones: toneMap(
      (tone) => INKS[tone],
      () => '',
    ),
  },
};

const lookName = computed<NoticeLookName>(() => {
  if (props.inline) return 'inline';
  return props.compact ? 'compact' : 'default';
});
const look = computed(() => LOOKS[lookName.value]);
const resolvedRole = computed(() => {
  if (props.tone === 'danger') return 'alert';
  return props.role === undefined ? DEFAULT_ROLES[props.tone] : (props.role ?? undefined);
});
/** The action goes under the text in the compact look, beside it otherwise. */
const isActionBelow = computed(() => lookName.value === 'compact');
</script>

<template>
  <div
    :role="resolvedRole"
    class="flex flex-wrap items-start"
    :class="[look.box, look.tones[tone].box]"
  >
    <InlineBit v-if="bit && !inline" :kind="bit" />
    <component
      :is="ICONS[tone]"
      v-else
      aria-hidden="true"
      class="shrink-0"
      :class="[look.icon, look.tones[tone].icon]"
    />
    <div class="min-w-0 grow" :class="!inline && 'basis-48'">
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
          />
        </button>
        <div v-show="isOpen" :id="detailsId" class="mt-2 flex flex-col gap-2">
          <slot name="details" />
        </div>
      </template>
      <slot v-if="isActionBelow" name="action" />
    </div>
    <slot v-if="!isActionBelow" name="action" />
    <IconButton
      v-if="dismissible"
      class="-my-3 -mr-2.5 shrink-0"
      :label="$t('common.notice.dismiss')"
      @click="$emit('dismiss')"
    >
      <X aria-hidden="true" />
    </IconButton>
  </div>
</template>
