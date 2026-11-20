<script setup lang="ts">
import { useId } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import FoldPanel from '@/components/ui/FoldPanel.vue';
import StatusMark from '@/components/ui/StatusMark.vue';
import { sectionDomId } from './section-dom-id';

/**
 * One section of a workbench (the problem's and the contest's): a one-line row (number and title, what the section holds now, "Sửa") that opens the
 * section's form below it. The whole row is the control. The form stays in the DOM while closed, so its edits are kept.
 * The summary shows while the section is closed: once open, the form says the same. With `to` the row is a link to
 * where the section's work is done (the trial run on the problem page) and has no form; `actionLabel` names the link.
 */
const open = defineModel<boolean>('open', { default: false });
defineProps<{
  /** The section's id among the page's own sections. */
  id: string;
  /** The step number of a setup section; a section that is not a step (a contest's running tools) has none. */
  index?: number;
  title: string;
  summary: string;
  /** Unsaved changes inside, shown as a mark while the section is closed. */
  changeCount?: number;
  to?: RouteLocationRaw;
  actionLabel?: string;
}>();
const panelId = useId();
</script>

<template>
  <section :id="sectionDomId(id)" :data-section="id" class="scroll-mt-4 border-t border-line">
    <AppButton
      tone="plain"
      data-section-toggle
      class="flex min-h-(--qh-row) w-full items-center gap-3 rounded-row text-left hover:bg-surface-strong"
      :to="to"
      :aria-expanded="to ? undefined : open"
      :aria-controls="to ? undefined : panelId"
      @click="open = !open"
    >
      <span class="shrink-0 text-body font-semibold">{{
        index === undefined ? title : `${index} · ${title}`
      }}</span>
      <span class="min-w-0 flex-1 truncate text-meta text-muted">{{ open ? '' : summary }}</span>
      <StatusMark
        v-if="changeCount"
        tone="accent"
        :label="$t('form.saveBar.unsaved', changeCount)"
      />
      <span class="shrink-0 px-2 text-small font-semibold text-accent-text">{{
        actionLabel ?? $t(`admin.problems.workbench.sections.${open ? 'collapse' : 'edit'}`)
      }}</span>
    </AppButton>
    <FoldPanel v-if="!to" :id="panelId" :open="open">
      <div class="flex flex-col gap-4 pt-2 pb-6"><slot /></div>
    </FoldPanel>
  </section>
</template>
