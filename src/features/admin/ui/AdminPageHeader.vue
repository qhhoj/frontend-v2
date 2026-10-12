<script setup lang="ts">
import { ChevronLeft, Ellipsis } from 'lucide-vue-next';
import Popover from 'primevue/popover';
import { computed, ref, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { navCrumbsOf } from '../shell/admin-nav';
import type { AdminCrumb } from '../shell/admin-nav';

/**
 * Every admin page's header: breadcrumb (from `md`), H1, an optional one-line lead and the actions. One primary action per
 * page goes in `#actions` with the secondary ones; a third action or more goes in `#overflow`, behind a "⋯ Thêm" button.
 * Below `md` the breadcrumb becomes one back link: `back`, else the nearest crumb that links somewhere.
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
  if (props.back) return props.back;
  const linked = crumbs.value.filter((crumb) => crumb.to);
  const last = linked.at(-1);
  return last?.to ? { to: last.to, label: last.label } : null;
});

const overflowMenu = ref<InstanceType<typeof Popover> | null>(null);
const closeOverflow = () => overflowMenu.value?.hide();
</script>

<template>
  <header class="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-4">
    <div class="min-w-0 md:min-w-[min(100%,16rem)] md:flex-1">
      <nav
        v-if="crumbs.length > 0"
        :aria-label="$t('common.breadcrumb')"
        class="hidden flex-wrap items-center gap-1.5 text-meta text-muted md:flex"
      >
        <template v-for="(crumb, index) in crumbs" :key="index">
          <span v-if="index > 0" aria-hidden="true">/</span>
          <RouterLink
            v-if="crumb.to"
            :to="crumb.to"
            class="hover:text-content hover:underline"
            :class="{ 'font-mono': crumb.mono }"
            >{{ crumb.label }}</RouterLink
          >
          <span v-else :class="{ 'font-mono': crumb.mono }">{{ crumb.label }}</span>
        </template>
      </nav>
      <RouterLink
        v-if="backLink"
        :to="backLink.to!"
        :aria-label="$t('admin.shell.backTo', { label: backLink.label })"
        class="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-text md:hidden"
      >
        <ChevronLeft aria-hidden="true" class="size-4" />{{ backLink.label }}
      </RouterLink>
      <h1 class="font-display text-xl leading-tight font-semibold md:text-2xl">{{ title }}</h1>
      <div v-if="slots.meta" class="mt-1 flex flex-wrap items-center gap-2 text-meta text-muted">
        <slot name="meta" />
      </div>
      <p v-if="lead" class="mt-0.5 text-sm text-muted">{{ lead }}</p>
    </div>
    <div
      v-if="slots.actions || slots.overflow"
      data-testid="admin-page-actions"
      class="flex flex-wrap items-center gap-2"
    >
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
    </div>
  </header>
</template>
