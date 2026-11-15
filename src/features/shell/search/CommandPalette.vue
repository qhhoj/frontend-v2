<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Modal from '@/components/ui/Modal.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { paletteOptionId, steppedKey } from '@/lib/palette-list';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useAccountLinks } from '../account-links';
import { NAV_ITEMS } from '../nav-items';
import { MIN_RECORD_SEARCH, SEARCH_GROUPS, matchPages } from './site-search';
import type { SearchEntry, SearchPage } from './site-search';
import { useShellShortcuts } from './use-shell-shortcuts';
import { useSiteRecordSearch } from './use-site-search';
import SearchResults from './SearchResults.vue';
import type { SearchGroup } from './SearchResults.vue';

/**
 * The site search (Ctrl+K, ⌘K, the rail's search button, or `/` on a page without a search box of its own): the
 * sections and the account's pages match as they type; from two characters, the problems, contests and (signed in)
 * users. A combobox over a grouped listbox; arrows move, Enter opens, Esc closes.
 */
const visible = defineModel<boolean>('visible', { required: true });
const router = useRouter();
const { t } = useI18n();
const listboxId = useId();
const accountLinks = useAccountLinks();
/** Mounted with the public shell only: the admin shell has its own palette on the same keys. */
useShellShortcuts(() => (visible.value = true));

const searchTerm = ref('');
const text = useDebouncedText(
  () => searchTerm.value,
  (committed) => (searchTerm.value = committed),
);
const records = useSiteRecordSearch(searchTerm);
const pages = computed<SearchPage[]>(() => [
  ...NAV_ITEMS.map((item) => ({
    id: item.path,
    label: t(item.labelKey),
    detail: item.path,
    to: item.path,
  })),
  ...accountLinks.value.map((link) => ({
    id: link.labelKey,
    label: t(link.labelKey),
    detail: null,
    to: link.to,
  })),
]);
const entries = computed<SearchEntry[]>(() => [
  ...matchPages(pages.value, text.value.trim()),
  ...records.entries.value,
]);
const groups = computed<SearchGroup[]>(() =>
  SEARCH_GROUPS.map((id) => ({
    id,
    label: t(`search.groups.${id}`),
    entries: entries.value.filter((entry) => entry.group === id),
  })).filter((group) => group.entries.length > 0),
);

const activeKey = ref<string | null>(null);
const activeId = computed(() =>
  activeKey.value ? paletteOptionId(listboxId, activeKey.value) : undefined,
);
watch(entries, (list) => {
  if (!list.some((entry) => entry.key === activeKey.value)) activeKey.value = list[0]?.key ?? null;
});
/** Each opening starts from an empty box; the Modal focuses it and later returns focus to the opener. */
watch(visible, (isOpen) => {
  if (!isOpen) return;
  text.commitNow('');
  activeKey.value = entries.value[0]?.key ?? null;
});

function moveActive(step: 1 | -1) {
  activeKey.value = steppedKey(entries.value, activeKey.value, step);
  void nextTick(() =>
    document.getElementById(activeId.value ?? '')?.scrollIntoView({ block: 'nearest' }),
  );
}
function choose(entry: SearchEntry) {
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
/** Between a key and the debounced lookup the records are about to be asked for, not missing. */
const isWaiting = computed(
  () => records.isSearching.value || text.value.trim() !== searchTerm.value,
);
const status = computed(() => {
  const typedLength = text.value.trim().length;
  if (isWaiting.value && typedLength >= MIN_RECORD_SEARCH) return t('search.searching');
  if (records.hasFailure.value) return t('search.failed');
  if (entries.value.length === 0) return t('search.empty');
  if (typedLength > 0 && typedLength < MIN_RECORD_SEARCH)
    return t('search.tooShort', { count: MIN_RECORD_SEARCH });
  return t('search.count', entries.value.length);
});
</script>

<template>
  <Modal
    v-model:visible="visible"
    :title="$t('search.title')"
    size="md"
    dismissable
    data-testid="site-palette"
  >
    <div class="flex flex-col gap-3">
      <TextInput
        v-model="text"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="entries.length > 0"
        :aria-controls="entries.length > 0 ? listboxId : undefined"
        :aria-activedescendant="activeId"
        :aria-label="$t('search.label')"
        :placeholder="$t('search.placeholder')"
        autocomplete="off"
        spellcheck="false"
        @keydown="onKeydown"
      >
        <template #prefix><Search aria-hidden="true" class="size-4" /></template>
      </TextInput>
      <p role="status" class="text-caption leading-4 text-muted">{{ status }}</p>
      <!-- Focusable so a keyboard user can scroll it; the combobox keeps the selection. -->
      <div
        role="region"
        tabindex="0"
        :aria-label="$t('search.results')"
        class="max-h-[min(60vh,28rem)] overflow-y-auto"
      >
        <SearchResults
          v-if="groups.length > 0"
          :listbox-id="listboxId"
          :groups="groups"
          :active-key="activeKey"
          @choose="choose"
          @hover="activeKey = $event"
        />
        <EmptyState v-else-if="!isWaiting" compact>
          {{ $t('search.emptyAdvice') }}
          <template #action>
            <AppButton
              tone="link"
              :to="{ name: 'problems', query: { search: text.trim() } }"
              @click="visible = false"
              >{{ $t('search.inProblems') }}</AppButton
            >
          </template>
        </EmptyState>
      </div>
      <p class="hidden text-caption leading-4 text-muted sm:block">{{ $t('search.keys') }}</p>
    </div>
  </Modal>
</template>
