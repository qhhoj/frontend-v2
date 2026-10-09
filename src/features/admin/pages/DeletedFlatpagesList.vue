<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { positivePageOf } from './flatpage-route';
import { useDeletedFlatpagesQuery } from './flatpages.queries';

defineProps<{ openedId: string | null }>();
const emit = defineEmits<{ open: [id: string] }>();
const route = useRoute();
const locale = useLocaleStore();
/** Closed until asked for: most staff never look for a deleted page, so the list is not fetched on every visit. */
const isShown = ref(false);
const query = useDeletedFlatpagesQuery(
  computed(() => positivePageOf(route.query.dp)),
  isShown,
);
const items = computed(() => query.data.value?.items ?? []);
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3" data-testid="deleted-pages">
    <button
      type="button"
      class="w-fit text-sm font-semibold text-accent-soft-text underline"
      :aria-expanded="isShown"
      @click="isShown = !isShown"
    >
      {{ $t('admin.pages.deleted.toggle') }}
    </button>
    <QueryState
      v-if="isShown"
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <p v-if="items.length === 0" class="text-sm text-muted">
        {{ $t('admin.pages.deleted.empty') }}
      </p>
      <ul v-else class="flex flex-col gap-2">
        <li v-for="item in items" :key="item.id">
          <button
            type="button"
            :aria-pressed="item.id === openedId"
            class="flex w-full min-w-0 flex-col gap-1 rounded-row border border-line bg-surface-solid p-3 text-left hover:bg-surface-hover aria-pressed:border-accent"
            @click="emit('open', item.id)"
          >
            <span class="truncate font-mono text-sm">{{ item.url }}</span>
            <span class="text-xs text-muted">
              {{
                $t('admin.pages.deleted.at', {
                  time: formatDateTime(item.deletedAt, locale.locale),
                })
              }}
            </span>
          </button>
        </li>
      </ul>
      <NumberedPager
        v-if="query.data.value && query.data.value.meta.total"
        :meta="query.data.value.meta"
        :label="$t('admin.pages.deleted.pager')"
        query-key="dp"
      />
    </QueryState>
  </section>
</template>
