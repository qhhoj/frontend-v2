<script setup lang="ts">
import { computed } from 'vue';
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { useOrganizationUsageQuery } from '@/features/organizations/quota/org-quota.queries';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { CreationOwner } from './creation-owners';

/**
 * An organization's credits this month, used over the limit, as one line with a meter: creating a problem or a contest
 * there spends them. Nothing is drawn while the usage is unknown, when the viewer may not read it (only administrators
 * may) or when the organization has no limit.
 */
const props = defineProps<{ owner: Pick<CreationOwner, 'slug' | 'name'> }>();
const locale = useLocaleStore();
const usage = useOrganizationUsageQuery(() => props.owner.slug, true);
const credits = computed(() => {
  const data = usage.data.value;
  return data && !data.unlimited ? data.credits : null;
});
const amount = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <p
    v-if="credits"
    data-testid="owner-credits"
    class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-meta text-muted"
  >
    <ProgressBar
      :value="credits.used"
      :max="credits.limit"
      :tone="credits.isOver ? 'danger' : credits.isNearLimit ? 'warning' : 'accent'"
      size="sm"
      :label="$t('admin.creation.credits.label', { owner: owner.name })"
      aria-hidden="true"
      class="w-40"
    />
    <span>{{
      $t('admin.creation.credits.line', {
        owner: owner.name,
        used: amount(credits.used),
        limit: amount(credits.limit),
      })
    }}</span>
  </p>
</template>
