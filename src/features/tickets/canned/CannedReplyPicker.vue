<script setup lang="ts">
import { MessageSquareText } from 'lucide-vue-next';
import FocusTrap from 'primevue/focustrap';
import Popover from 'primevue/popover';
import { computed, ref, useId } from 'vue';
import type { CannedReply } from '@/api/types/tickets';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { adminRouteName } from '@/features/admin/admin-screens';
import { TICKET_BITS } from '../ticket-bits';
import { useCannedRepliesQuery } from '../tickets.queries';
import { fillPlaceholders } from './canned-text';
import type { CannedContext } from './canned-text';

/** The staff composer's list of canned replies; reads them the first time it opens. */
const props = defineProps<{ context: CannedContext }>();
const emit = defineEmits<{ pick: [text: string, title: string] }>();
const vFocustrap = FocusTrap;
const titleId = useId();
const SKELETON_ROWS = 3;
const popover = ref<InstanceType<typeof Popover>>();
const isOpen = ref(false);
const query = useCannedRepliesQuery(isOpen);
const replies = computed(() => query.data.value?.items ?? []);

function choose(reply: CannedReply) {
  emit('pick', fillPlaceholders(reply.body, props.context), reply.title);
  popover.value?.hide();
}
</script>

<template>
  <button
    type="button"
    data-testid="canned-picker"
    class="inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    @click="popover?.toggle($event)"
  >
    <MessageSquareText aria-hidden="true" class="size-[18px]" />
    {{ $t('cannedPicker.open') }}
  </button>
  <Popover
    ref="popover"
    :pt="{ root: { role: 'dialog', 'aria-labelledby': titleId } }"
    @show="isOpen = true"
    @hide="isOpen = false"
  >
    <div
      v-focustrap="{ autoFocus: true }"
      class="flex w-[min(24rem,calc(100vw-4rem))] flex-col gap-3"
    >
      <p :id="titleId" class="font-display text-lg font-bold">{{ $t('cannedPicker.title') }}</p>
      <p class="text-meta text-muted">{{ $t('cannedPicker.hint') }}</p>
      <QueryState
        :loading="query.isLoading.value"
        :error="query.error.value"
        :registers-wait="false"
        @retry="query.refetch()"
      >
        <template #skeleton>
          <ul class="m-0 flex list-none flex-col gap-1 p-0">
            <li
              v-for="index in SKELETON_ROWS"
              :key="index"
              data-skeleton-region="canned-row"
              class="flex min-h-11 flex-col justify-center gap-0.5 px-3 py-2"
            >
              <span class="text-sm"><SkeletonBlock text class="w-1/2" /></span>
              <span class="text-xs"><SkeletonBlock text class="w-full" /></span>
            </li>
          </ul>
        </template>
        <EmptyState v-if="replies.length === 0" compact :kind="TICKET_BITS.cannedEmpty">
          {{ $t('cannedPicker.empty') }}
        </EmptyState>
        <ul v-else class="m-0 flex max-h-72 list-none flex-col gap-1 overflow-y-auto p-0">
          <li v-for="reply in replies" :key="reply.id">
            <button
              type="button"
              class="flex min-h-11 w-full flex-col items-start gap-0.5 rounded-row px-3 py-2 text-left hover:bg-surface-hover"
              @click="choose(reply)"
            >
              <span class="text-sm font-semibold">{{ reply.title }}</span>
              <span class="line-clamp-1 text-xs text-muted">{{ reply.body }}</span>
            </button>
          </li>
        </ul>
      </QueryState>
      <RouterLink
        :to="{ name: adminRouteName('cannedReplies') }"
        class="inline-flex min-h-11 items-center self-start text-sm font-semibold text-accent-text"
      >
        {{ $t('cannedPicker.manage') }}
      </RouterLink>
    </div>
  </Popover>
</template>
