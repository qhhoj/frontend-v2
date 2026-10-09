<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import type { PageMeta } from '@/api/client';
import type { OrganizationListItem } from '@/api/types/organizations';
import NumberedPager from '@/components/NumberedPager.vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  items: OrganizationListItem[];
  meta: PageMeta;
  selected: string | null;
}>();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

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
    <div class="overflow-x-auto rounded-card border border-line">
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
                <span class="font-semibold">{{ item.name }}</span>
                <span class="font-mono text-xs text-muted"
                  >{{ item.slug }} · {{ item.shortName }}</span
                >
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
    <p class="text-sm text-muted">
      {{
        t('admin.organizations.list.footer', {
          shown: items.length,
          total: meta.total ?? items.length,
        })
      }}
    </p>
    <NumberedPager :meta="meta" :label="$t('admin.organizations.list.pager')" />
  </section>
</template>
