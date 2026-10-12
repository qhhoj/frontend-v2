<script setup lang="ts">
import { Ellipsis } from 'lucide-vue-next';
import Popover from 'primevue/popover';
import { computed, ref, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/ui/PageHeader.vue';
import { navCrumbsOf } from '../shell/admin-nav';
import type { AdminCrumb } from '../shell/admin-nav';

/**
 * Every admin page's header: `PageHeader` at the compact title size, its breadcrumb led by the nav's crumbs. One primary
 * action per page goes in `#actions` with the secondary ones; a third action or more goes in `#overflow`, behind a
 * "⋯ Thêm" button. Below `md` the breadcrumb becomes one back link: `back`, else the nearest crumb that links somewhere.
 * `#meta` sits under the title (chips, a code, a status line).
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

const overflowMenu = ref<InstanceType<typeof Popover> | null>(null);
const closeOverflow = () => overflowMenu.value?.hide();
</script>

<template>
  <PageHeader :title="title" :lead="lead" :crumbs="crumbs" :back="backLink" size="compact">
    <template v-if="slots.meta" #meta><slot name="meta" /></template>
    <template v-if="slots.actions || slots.overflow" #actions>
      <slot name="actions" />
      <template v-if="slots.overflow">
        <button
          type="button"
          aria-haspopup="true"
          class="inline-flex min-h-(--qa-control) items-center gap-1.5 rounded-cell border border-line-strong bg-surface-solid px-3 text-sm font-semibold hover:bg-surface-hover"
          @click="overflowMenu?.toggle($event)"
        >
          <Ellipsis aria-hidden="true" class="size-4" />{{ $t('admin.shell.more') }}
        </button>
        <Popover ref="overflowMenu">
          <div class="flex min-w-48 flex-col gap-1">
            <slot name="overflow" :close="closeOverflow" />
          </div>
        </Popover>
      </template>
    </template>
  </PageHeader>
</template>
