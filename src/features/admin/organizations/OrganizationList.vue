<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { PageMeta } from '@/api/client';
import type { OrganizationListItem } from '@/api/types/organizations';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import { ADMIN_BIT_KINDS } from '../shell/admin-bit';
import HighlightedText from '../search/HighlightedText.vue';
import IndexSearchBox from '../search/IndexSearchBox.vue';

const props = defineProps<{
  items: OrganizationListItem[];
  meta: PageMeta;
  selected: string | null;
  search: string;
}>();
const emit = defineEmits<{ search: [text: string] }>();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const total = computed(() => props.meta.total ?? props.items.length);
const footer = computed(() =>
  props.search
    ? t('admin.organizations.list.countMatch', {
        shown: props.items.length,
        total: total.value,
        search: props.search,
      })
    : t('admin.organizations.list.footer', { shown: props.items.length, total: total.value }),
);

function select(slug: string) {
  void router.push({ query: { ...route.query, org: slug } });
}
</script>

<template>
  <section
    data-testid="org-list"
    :aria-label="$t('admin.organizations.list.label')"
    class="flex min-w-0 flex-col gap-4"
  >
    <IndexSearchBox
      :value="search"
      :label="$t('admin.organizations.search.label')"
      :placeholder="$t('admin.organizations.search.placeholder')"
      :clear-label="$t('admin.search.clear')"
      :hint="$t('admin.organizations.search.hint')"
      :status="search ? footer : ''"
      @commit="emit('search', $event)"
    />
    <EmptyState v-if="items.length === 0" compact :kind="ADMIN_BIT_KINDS.empty">
      {{
        search
          ? $t('admin.organizations.list.emptySearch', { search })
          : $t('admin.organizations.list.empty')
      }}
    </EmptyState>
    <div v-else class="overflow-x-auto rounded-card border border-line">
      <table class="w-full text-left text-sm">
        <thead class="text-muted">
          <tr>
            <th scope="col" class="px-3 py-2 font-semibold">
              {{ $t('admin.organizations.list.name') }}
            </th>
            <th scope="col" class="px-3 py-2 font-semibold">
              {{ $t('admin.organizations.list.state') }}
            </th>
            <th scope="col" class="hidden px-3 py-2 font-semibold md:table-cell">
              {{ $t('admin.organizations.list.members') }}
            </th>
            <th scope="col" class="px-3 py-2 text-right font-semibold">
              {{ $t('admin.organizations.list.points') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-t border-line">
            <td class="px-3 py-2">
              <button
                type="button"
                class="flex min-h-11 flex-col items-start text-left hover:underline"
                :aria-pressed="item.slug === selected"
                @click="select(item.slug)"
              >
                <span class="font-semibold"
                  ><HighlightedText :text="item.name" :query="search"
                /></span>
                <span class="font-mono text-xs text-muted"
                  ><HighlightedText :text="`${item.slug} · ${item.shortName}`" :query="search"
                /></span>
              </button>
            </td>
            <td class="px-3 py-2">
              <span class="mr-2">{{
                item.isOpen
                  ? t('admin.organizations.list.open')
                  : t('admin.organizations.list.closed')
              }}</span>
              <span
                v-if="item.isUnlisted"
                class="rounded-pill bg-surface-solid px-2 py-0.5 text-xs"
              >
                {{ t('admin.organizations.list.hidden') }}
              </span>
            </td>
            <td class="hidden px-3 py-2 md:table-cell">{{ item.memberCount }}</td>
            <td class="px-3 py-2 text-right">{{ item.performancePoints }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm text-muted">{{ footer }}</p>
    <NumberedPager :meta="meta" :label="$t('admin.organizations.list.pager')" />
  </section>
</template>
