<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { updateSetting } from '@/api/settings-admin.api';
import type { Setting, SettingKey } from '@/api/types/settings-admin';
import { CircleCheck } from 'lucide-vue-next';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { CARD } from '../ui/controls';
import { isSameValue } from '../ui/form/dirty-form';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import { failureTextOf, fieldErrorsOf, hasIssueCode } from '../ui/admin-errors';
import SettingField from './SettingField.vue';
import SettingInfo from './SettingInfo.vue';
import { canResetToDefault, defaultDraftOf, isAtDefault, valueText } from './setting-defaults';
import type { ShownBlock } from './setting-blocks';
import { checkBlock, sendKeysInOrder } from './setting-save';
import type { BlockSaveOutcome } from './settings-page';
import type { Drafts } from './setting-save';
import { draftOf } from './setting-values';
import { useStoreSettingAnswer } from './settings.queries';

/**
 * One titled block of keys. Each key keeps its own draft; a key's draft is rebuilt only when the stored value of that key
 * changes, so an unsaved edit of another key of the block is never lost. The block validates and saves as a unit, but the
 * page's one save bar drives it: it reports its changed keys (`dirty`) and exposes `save` and `discard`.
 */
const props = defineProps<{
  block: ShownBlock;
  /** The rows a settings search shows; null shows every row. */
  shownKeys?: ReadonlySet<string> | null;
}>();
const emit = defineEmits<{ history: [key: SettingKey]; dirty: [count: number] }>();
const headingId = useId();
const toast = useAdminToast();
const composer = useI18n();
const { t } = composer;
const storeAnswer = useStoreSettingAnswer();
const locale = useLocaleStore();
const isShown = (key: SettingKey) => !props.shownKeys || props.shownKeys.has(key);
/** The default as the ⓘ shows it; null for a secret, which has no default anyone can send. */
const defaultTextOf = (setting: Setting) =>
  canResetToDefault(setting) ? valueText(setting.default, locale.locale) : null;
const isDraftAtDefault = (setting: Setting) =>
  drafts[setting.key] ? isAtDefault(setting, drafts[setting.key]!) : true;
/** Fills the registry default into the box; nothing is sent until "Lưu". */
const resetToDefault = (setting: Setting) => (drafts[setting.key] = defaultDraftOf(setting));

const drafts = reactive<Drafts>({});
/** The stored copy each key's draft was last filled from. */
const filledFrom = new Map<SettingKey, Setting>();
const notice = ref<{ tone: 'done' | 'refused'; text: string } | null>(null);
const isSaving = ref(false);

/** A key whose stored value changed is refilled only while its draft still equals the copy it was filled from. */
function seedChangedDrafts(settings: Setting[]) {
  for (const setting of settings) {
    const previous = filledFrom.get(setting.key);
    if (previous && JSON.stringify(previous.value) === JSON.stringify(setting.value)) continue;
    filledFrom.set(setting.key, setting);
    const draft = drafts[setting.key];
    if (!previous || !draft || isSameValue(draft, draftOf(previous)))
      drafts[setting.key] = draftOf(setting);
  }
}
watch(() => props.block.settings, seedChangedDrafts, { immediate: true });

/** Keys whose draft differs from the stored value. */
const dirtyCount = computed(
  () =>
    props.block.settings.filter(
      (setting) => drafts[setting.key] && !isSameValue(drafts[setting.key], draftOf(setting)),
    ).length,
);
watch(dirtyCount, (count) => emit('dirty', count), { immediate: true });
watch(dirtyCount, (count) => {
  if (count > 0 && notice.value?.tone === 'done') notice.value = null;
});

function discardEdits() {
  if (dirtyCount.value === 0) return;
  for (const setting of props.block.settings) drafts[setting.key] = draftOf(setting);
  notice.value = null;
}

function showRefusal(key: SettingKey, message: string) {
  notice.value = { tone: 'refused', text: t('admin.settings.saveFailed', { key, message }) };
}

/** The block's answer to a refused key: the field's text when the server named one, else the page line of the failure. */
function refusalMessage(key: SettingKey, error: unknown): string {
  const ownText = `admin.settings.badValue.${key.split('.').pop()}`;
  if (hasIssueCode(error, 'invalid') && composer.te(ownText)) return t(ownText);
  return fieldErrorsOf(error).value ?? failureTextOf(error);
}

/** Sends the block's changed keys; a refusal stays on the block as an alert. */
async function save(): Promise<BlockSaveOutcome> {
  if (isSaving.value) return 'unchanged';
  const problem = checkBlock(props.block.settings, drafts);
  if (problem) {
    showRefusal(problem.key, problem.problem);
    return 'refused';
  }
  isSaving.value = true;
  const answers = new Map<SettingKey, Setting>();
  const outcome = await sendKeysInOrder(props.block.settings, { ...drafts }, async (key, value) => {
    const answer = await updateSetting(key, value);
    storeAnswer(answer);
    answers.set(key, answer);
    return answer;
  });
  isSaving.value = false;
  rebuildDraftsFrom(answers);
  if ('failedKey' in outcome) {
    showRefusal(outcome.failedKey, refusalMessage(outcome.failedKey, outcome.error));
    return 'refused';
  }
  notice.value = null;
  return outcome.saved.length > 0 ? 'saved' : 'unchanged';
}

/**
 * A saved key takes its answer as its draft, whatever the stored value was: a replaced secret leaves its replace mode
 * and its typed box, so a later "Lưu" cannot send the plaintext again.
 */
function rebuildDraftsFrom(answers: Map<SettingKey, Setting>) {
  for (const [key, answer] of answers) drafts[key] = draftOf(answer);
}

/** A cleared secret is the answer of its own write: only that key's draft is rebuilt, the others keep their edits. */
function onCleared(answer: Setting) {
  storeAnswer(answer);
  drafts[answer.key] = draftOf(answer);
  const text = t('admin.settings.clear.done', {
    name: t(`admin.settings.clear.names.${answer.key}`),
  });
  notice.value = { tone: 'done', text };
  toast.show({ text });
}

defineExpose({ save, discard: discardEdits });
</script>

<template>
  <section
    :id="`settings-${block.id}`"
    :data-block="block.id"
    :aria-labelledby="headingId"
    :class="[CARD, 'flex min-w-0 flex-col']"
  >
    <header class="px-4 pt-4 sm:px-5">
      <h2 :id="headingId" class="font-display text-base font-semibold">
        {{ $t(`admin.settings.blocks.${block.id}.title`) }}
      </h2>
      <p class="mt-0.5 max-w-prose text-sm text-muted">
        {{ $t(`admin.settings.blocks.${block.id}.help`) }}
      </p>
    </header>
    <div class="flex flex-col gap-4 px-4 py-4 sm:px-5">
      <div
        v-for="setting in block.settings"
        v-show="isShown(setting.key)"
        :key="setting.key"
        :data-key="setting.key"
        class="flex items-start gap-2 border-t border-line pt-4 first:border-t-0 first:pt-0"
      >
        <SettingField
          v-if="drafts[setting.key]"
          class="min-w-0 flex-1"
          :setting="setting"
          :model-value="drafts[setting.key]!"
          @update:model-value="drafts[setting.key] = $event"
          @cleared="onCleared"
        />
        <div class="flex shrink-0 items-center gap-1">
          <AdminChip v-if="!setting.isDefault" data-testid="changed-chip" tone="accent">
            {{ t('admin.settings.reset.notDefault') }}
          </AdminChip>
          <SettingInfo
            :setting-key="setting.key"
            :default-text="defaultTextOf(setting)"
            :is-at-default="isDraftAtDefault(setting)"
            @history="emit('history', setting.key)"
            @reset="resetToDefault(setting)"
          />
        </div>
      </div>
      <slot />
    </div>
    <div v-if="notice?.tone === 'refused'" role="alert" class="px-4 pb-3 sm:px-5">
      <AdminNotice tone="danger" :title="notice.text" />
    </div>
    <p
      v-if="notice?.tone === 'done'"
      role="status"
      class="flex items-center gap-2 px-4 pb-3 text-sm sm:px-5"
    >
      <CircleCheck aria-hidden="true" class="size-4 shrink-0 text-positive" :stroke-width="1.75" />
      {{ notice.text }}
    </p>
  </section>
</template>
