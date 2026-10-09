<script setup lang="ts">
import { computed, useId } from 'vue';
import type { NotificationItem } from '@/api/types/notifications';
import NotificationRow from './NotificationRow.vue';
import { groupByDay } from './notification-days';

/** The rows grouped "Hôm nay" / "Trước đó" (M1B); shared by the drawer and the page. */
const props = defineProps<{
  items: NotificationItem[];
  canMarkRead: boolean;
  isStale: (id: string) => boolean;
}>();
const emit = defineEmits<{ open: [item: NotificationItem]; markRead: [item: NotificationItem] }>();
const baseId = useId();
const groups = computed(() => groupByDay(props.items, new Date()));
</script>

<template>
  <div class="flex flex-col gap-4">
    <section v-for="group in groups" :key="group.key" :aria-labelledby="`${baseId}-${group.key}`">
      <h2
        :id="`${baseId}-${group.key}`"
        class="text-xs font-semibold tracking-wider text-muted uppercase"
      >
        {{ $t(`notifications.${group.key}`) }}
      </h2>
      <ul class="m-0 list-none p-0">
        <NotificationRow
          v-for="item in group.items"
          :key="item.id"
          :item="item"
          :is-stale="isStale(item.id)"
          :can-mark-read="canMarkRead"
          @open="emit('open', $event)"
          @mark-read="emit('markRead', $event)"
        />
      </ul>
    </section>
  </div>
</template>
