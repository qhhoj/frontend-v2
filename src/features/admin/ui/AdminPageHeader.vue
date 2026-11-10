<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next';
import { computed, ref, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import Popover from '@/components/ui/Popover.vue';
import { navCrumbsOf } from '../shell/admin-nav';
import type { AdminCrumb } from '../shell/admin-nav';

/**
 * Shim over `PageHeader` (new pages use it directly, with `overflow` items): the breadcrumb is led by the nav's crumbs,
 * and below `md` it becomes one back link: `back`, else the nearest crumb that links somewhere. One primary action per
 * page goes in `#actions` with the secondary ones; the `#overflow` slot (hand-built items, until its pages move to
 * `PageHeader overflow`) opens behind the same "⋯ Thêm" button. `#meta` sits under the title.
 */
const props = defineProps<{
  title: string;
  lead?: string;
  trail?: AdminCrumb[];
  back?: { to: AdminCrumb['to']; label: string };
}>();
defineSlots<{
  actions?: () => unknown;
  overflow?: (props: { close: () => void }) => unknown;
  meta?: () => unknown;
}>();
const slots = useSlots();
const route = useRoute();
const { t } = useI18n();
const crumbs = computed(() => [...navCrumbsOf(route.path, t), ...(props.trail ?? [])]);
const backLink = computed(() => {
  const target = props.back ?? crumbs.value.filter((crumb) => crumb.to).at(-1);
  if (!target?.to) return null;
  return {
    to: target.to,
    label: target.label,
    ariaLabel: t('admin.shell.backTo', { label: target.label }),
  };
});

const overflowMenu = ref<InstanceType<typeof Popover>>();
const closeOverflow = () => overflowMenu.value?.hide();
</script>

<template>
  <PageHeader :title="title" :lead="lead" :crumbs="crumbs" :back="backLink">
    <template v-if="slots.meta" #meta><slot name="meta" /></template>
    <template v-if="slots.actions || slots.overflow" #actions>
      <template v-if="slots.overflow">
        <AppButton
          aria-haspopup="true"
          data-testid="page-header-overflow"
          @click="overflowMenu?.toggle($event)"
        >
          <template #icon><Ellipsis aria-hidden="true" class="size-4" /></template>
          {{ $t('admin.shell.more') }}
        </AppButton>
        <Popover ref="overflowMenu" :label="$t('admin.shell.more')">
          <div class="flex min-w-48 flex-col gap-1">
            <slot name="overflow" :close="closeOverflow" />
          </div>
        </Popover>
      </template>
      <slot name="actions" />
    </template>
  </PageHeader>
</template>
