<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import Dialog from 'primevue/dialog';
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useSessionStore } from '@/stores/session.store';
import { INPUT } from '../../ui/controls';
import { canUseAdmin } from '../../admin-access';
import { PALETTE_SCREENS } from '../admin-nav';
import { MIN_RECORD_SEARCH, matchScreens, paletteOptionId, steppedKey } from './admin-search';
import type { PaletteEntry } from './admin-search';
import { useAdminRecordSearch } from './admin-search.queries';
import PaletteResults from './PaletteResults.vue';

/**
 * The admin search (Ctrl+K, ⌘K or `/`): screens the viewer may open match as they type, and once the text is long enough
 * the problems, contests, users and organizations they may edit. A combobox over a grouped listbox; arrows move, Enter opens.
 */
const visible = defineModel<boolean>('visible', { required: true });
const router = useRouter();
const { t } = useI18n();
const session = useSessionStore();
const listboxId = useId();

const searchTerm = ref('');
const text = useDebouncedText(
  () => searchTerm.value,
  (committed) => (searchTerm.value = committed),
);
const records = useAdminRecordSearch(searchTerm);
const screens = computed(() => PALETTE_SCREENS.filter((item) => canUseAdmin(session.user, item)));
const entries = computed<PaletteEntry[]>(() => [
  ...matchScreens(screens.value, text.value.trim(), (item) => t(item.labelKey)),
  ...records.entries.value,
]);

const activeKey = ref<string | null>(null);
const activeId = computed(() =>
  activeKey.value ? paletteOptionId(listboxId, activeKey.value) : undefined,
);
watch(entries, (list) => {
  if (!list.some((entry) => entry.key === activeKey.value)) activeKey.value = list[0]?.key ?? null;
});

function moveActive(step: 1 | -1) {
  activeKey.value = steppedKey(entries.value, activeKey.value, step);
  void nextTick(() =>
    document.getElementById(activeId.value ?? '')?.scrollIntoView({ block: 'nearest' }),
  );
}
function choose(entry: PaletteEntry) {
  visible.value = false;
  void router.push(entry.to);
}
function onKeydown(event: KeyboardEvent) {
  if (event.isComposing) return;
  const step = { ArrowDown: 1, ArrowUp: -1 }[event.key] as 1 | -1 | undefined;
  if (step) {
    event.preventDefault();
    moveActive(step);
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const active = entries.value.find((entry) => entry.key === activeKey.value);
    if (active) choose(active);
  }
}
/** Each opening starts from an empty box; the Dialog focuses it (`autofocus`) and later returns focus to the opener. */
function onShow() {
  text.commitNow('');
  activeKey.value = entries.value[0]?.key ?? null;
}
/** Between a key and the debounced lookup the records are about to be asked for, not missing. */
const isWaiting = computed(
  () => records.isSearching.value || text.value.trim() !== searchTerm.value,
);

const status = computed(() => {
  const typedLength = text.value.trim().length;
  if (isWaiting.value && typedLength >= MIN_RECORD_SEARCH) return t('admin.shell.search.searching');
  if (records.hasFailure.value) return t('admin.shell.search.failed');
  if (entries.value.length === 0) return t('admin.shell.search.empty');
  if (typedLength > 0 && typedLength < MIN_RECORD_SEARCH)
    return t('admin.shell.search.tooShort', { count: MIN_RECORD_SEARCH });
  return t('admin.shell.search.count', entries.value.length);
});
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissable-mask
    position="top"
    :header="$t('admin.shell.search.title')"
    :draggable="false"
    :style="{ width: '640px', maxWidth: 'calc(100vw - 2rem)' }"
    :close-button-props="{ 'aria-label': $t('common.close') }"
    data-testid="admin-palette"
    @show="onShow"
  >
    <div class="flex flex-col gap-3">
      <div class="relative">
        <Search
          aria-hidden="true"
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <input
          v-model="text"
          autofocus
          type="text"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="entries.length > 0"
          :aria-controls="entries.length > 0 ? listboxId : undefined"
          :aria-activedescendant="activeId"
          :aria-label="$t('admin.shell.search.label')"
          :placeholder="$t('admin.shell.search.placeholder')"
          :class="[INPUT, 'pl-9']"
          autocomplete="off"
          spellcheck="false"
          @keydown="onKeydown"
        />
      </div>
      <p role="status" class="text-caption leading-4 text-muted">{{ status }}</p>
      <!-- Focusable so a keyboard user can scroll it; the combobox keeps the selection. -->
      <div
        role="region"
        tabindex="0"
        :aria-label="$t('admin.shell.search.results')"
        class="max-h-[min(60vh,28rem)] overflow-y-auto"
      >
        <PaletteResults
          v-if="entries.length > 0"
          :listbox-id="listboxId"
          :entries="entries"
          :active-key="activeKey"
          :term="text.trim()"
          @choose="choose"
          @hover="activeKey = $event"
        />
        <EmptyState v-else-if="!isWaiting" compact>
          {{ $t('admin.shell.search.emptyAdvice') }}
        </EmptyState>
      </div>
      <p class="hidden text-caption leading-4 text-muted sm:block">
        {{ $t('admin.shell.search.keys') }}
      </p>
    </div>
  </Dialog>
</template>
