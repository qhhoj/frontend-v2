<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { INPUT } from '../controls';

export interface AdminSection {
  /** The `id` of the section (an `AdminFormSection` `id`). */
  id: string;
  label: string;
  danger?: boolean;
}

/**
 * The section navigation of a long form. `rail`: a sticky "Trên trang này" list beside the form (≥ 1280 px), marking the
 * section in view. `select`: a "Đi tới mục" select above the form (below 1280 px). Both scroll to the section and move
 * focus to it, never through the URL hash (the router would see a navigation).
 */
const props = withDefaults(defineProps<{ sections: AdminSection[]; mode?: 'rail' | 'select' }>(), {
  mode: 'rail',
});
const currentId = ref(props.sections[0]?.id ?? '');
const picked = ref('');

function goTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const isReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true;
  target.scrollIntoView({ behavior: isReduced ? 'auto' : 'smooth', block: 'start' });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  currentId.value = id;
}

function onPick() {
  if (picked.value) goTo(picked.value);
  picked.value = '';
}

/** Scroll-spy: the topmost section crossing the upper part of the viewport is the current one. */
let observer: IntersectionObserver | undefined;
const visible = new Set<string>();
onMounted(() => {
  if (props.mode !== 'rail' || typeof IntersectionObserver !== 'function') return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      const first = props.sections.find((section) => visible.has(section.id));
      if (first) currentId.value = first.id;
    },
    { rootMargin: '-15% 0px -55% 0px' },
  );
  for (const section of props.sections) {
    const target = document.getElementById(section.id);
    if (target) observer.observe(target);
  }
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <nav
    v-if="mode === 'rail'"
    :aria-label="$t('admin.form.section.onThisPage')"
    class="sticky top-16 flex flex-col gap-0.5 text-meta"
  >
    <p class="px-2.5 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">
      {{ $t('admin.form.section.onThisPage') }}
    </p>
    <a
      v-for="section in sections"
      :key="section.id"
      :href="`#${section.id}`"
      :aria-current="currentId === section.id ? 'location' : undefined"
      class="border-l-2 border-line px-2.5 py-1.5 hover:text-content aria-[current=location]:border-accent aria-[current=location]:font-semibold aria-[current=location]:text-content"
      :class="section.danger ? 'text-negative' : 'text-muted'"
      @click.prevent="goTo(section.id)"
    >
      {{ section.label }}
    </a>
  </nav>
  <label v-else class="flex flex-col gap-1.5 text-sm font-semibold">
    {{ $t('admin.form.section.jumpTo') }}
    <select v-model="picked" :class="[INPUT, 'font-normal']" @change="onPick">
      <option value="" disabled>{{ $t('admin.form.section.pick') }}</option>
      <option v-for="section in sections" :key="section.id" :value="section.id">
        {{ section.label }}
      </option>
    </select>
  </label>
</template>
