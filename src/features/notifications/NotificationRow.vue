<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import { Check } from 'lucide-vue-next';
import { computed } from 'vue';
import type { NotificationItem } from '@/api/types/notifications';
import IconButton from '@/components/ui/IconButton.vue';
import { translate } from '@/i18n';
import { formatAgo } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { kindIcon } from './notification-kinds';

/** One inbox row (M1B): the row opens its target; the check button marks it read without leaving. */
const props = defineProps<{ item: NotificationItem; isStale: boolean; canMarkRead: boolean }>();
const emit = defineEmits<{ open: [item: NotificationItem]; markRead: [item: NotificationItem] }>();
const locale = useLocaleStore();
const title = computed(() =>
  props.isStale ? translate('notifications.staleTitle') : props.item.title,
);
const body = computed(() =>
  props.isStale ? translate('notifications.staleBody') : props.item.body,
);
const icon = computed(() => kindIcon(props.item.kind));
const when = computed(() => formatAgo(props.item.lastActivityAt, Date.now(), locale.locale));
const hasChips = computed(() => !props.isStale);
</script>

<template>
  <li
    data-testid="notification-row"
    :data-unread="item.unread"
    class="flex items-start gap-3 border-t border-line py-3 first:border-t-0"
  >
    <span
      aria-hidden="true"
      class="flex size-10 shrink-0 items-center justify-center rounded-cell bg-accent-soft text-accent-soft-text"
    >
      <component :is="icon" class="size-[18px]" />
    </span>
    <button
      type="button"
      class="flex min-h-11 min-w-0 flex-1 flex-col gap-1 rounded-row px-1 text-left hover:bg-surface-hover"
      @click="emit('open', item)"
    >
      <span class="flex flex-wrap items-center gap-2">
        <span
          v-if="item.unread"
          aria-hidden="true"
          class="inline-block size-2 shrink-0 rounded-full bg-accent"
        />
        <span v-if="item.unread" class="sr-only">{{ $t('notifications.unread') }}</span>
        <span class="min-w-0 break-words text-content" :class="item.unread ? 'font-semibold' : ''">
          {{ title }}
        </span>
        <span
          v-if="hasChips && item.count > 1"
          class="rounded-pill bg-surface-hover px-2 text-xs font-semibold text-content"
        >
          {{ $t('notifications.merged', { count: item.count }) }}
        </span>
        <Chip v-if="hasChips && item.priority === 'high'" tone="warning">
          {{ $t('notifications.important') }}
        </Chip>
      </span>
      <span class="line-clamp-2 text-sm text-muted">{{ body }}</span>
      <time :datetime="item.lastActivityAt" class="text-xs text-muted">{{ when }}</time>
    </button>
    <IconButton
      v-if="canMarkRead && item.unread"
      tone="secondary"
      class="shrink-0"
      :label="$t('notifications.markRead', { title })"
      @click="emit('markRead', item)"
    >
      <Check aria-hidden="true" class="size-[18px]" />
    </IconButton>
  </li>
</template>
