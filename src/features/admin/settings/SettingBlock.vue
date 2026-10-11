<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { updateSetting } from '@/api/settings-admin.api';
import type { Setting, SettingKey } from '@/api/types/settings-admin';
import { CircleCheck, History } from 'lucide-vue-next';
import AdminChip from '../ui/AdminChip.vue';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { CARD, buttonClass } from '../ui/controls';
import { isSameValue } from '../ui/form/dirty-form';
import { useAdminToast } from '../ui/feedback/use-admin-toast';
import { failureTextOf, fieldErrorsOf, hasIssueCode } from '../ui/admin-errors';
import SettingField from './SettingField.vue';
import type { ShownBlock } from './setting-blocks';
import { checkBlock, sendKeysInOrder } from './setting-save';
import type { Drafts } from './setting-save';
import { draftOf } from './setting-values';
import { useStoreSettingAnswer } from './settings.queries';

/**
 * One titled block of keys with one "Lưu". Each key keeps its own draft; a key's draft is rebuilt only when the stored
 * value of that key changes, so an unsaved edit of another key of the block is never lost.
 * The footer works like `AdminSaveBar` for this block alone (blocks validate and save as units): the number of changed keys,
 * "Huỷ thay đổi" and "Lưu", both `aria-disabled` while nothing changed. It reports that number (`dirty`) for the leave guard.
 */
const props = defineProps<{ block: ShownBlock }>();
const emit = defineEmits<{ history: [key: SettingKey]; dirty: [count: number] }>();
const headingId = useId();
const toast = useAdminToast();
const composer = useI18n();
const { t } = composer;
const storeAnswer = useStoreSettingAnswer();

const drafts = reactive<Drafts>({});
const storedJsonByKey = new Map<SettingKey, string>();
const notice = ref<{ tone: 'done' | 'refused'; text: string } | null>(null);
const isSaving = ref(false);

function seedChangedDrafts(settings: Setting[]) {
  for (const setting of settings) {
    const storedJson = JSON.stringify(setting.value);
    if (storedJsonByKey.get(setting.key) === storedJson) continue;
    storedJsonByKey.set(setting.key, storedJson);
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

async function save() {
  if (isSaving.value) return;
  const problem = checkBlock(props.block.settings, drafts);
  if (problem) return showRefusal(problem.key, problem.problem);
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
  if ('failedKey' in outcome)
    return showRefusal(outcome.failedKey, refusalMessage(outcome.failedKey, outcome.error));
  if (outcome.saved.length > 0) {
    notice.value = { tone: 'done', text: t('admin.settings.saved') };
    toast.show({
      text: t('admin.settings.savedBlock', {
        name: t(`admin.settings.blocks.${props.block.id}.title`),
      }),
    });
  } else notice.value = { tone: 'done', text: t('admin.settings.noChanges') };
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

/** A block of several keys names the key for screen readers ("Lịch sử · mail.from"); the key is shown beside the button. */
const historySuffix = (key: SettingKey) => (props.block.keys.length > 1 ? ` · ${key}` : '');
</script>

<template>
  <section :data-block="block.id" :aria-labelledby="headingId" :class="[CARD, 'flex flex-col']">
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
        :key="setting.key"
        :data-key="setting.key"
        class="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0"
      >
        <div class="flex flex-wrap items-center gap-2">
          <code class="font-mono text-xs break-all text-muted">{{ setting.key }}</code>
          <AdminChip data-testid="default-chip" :tone="setting.isDefault ? 'neutral' : 'accent'">
            {{
              setting.isDefault
                ? t('admin.settings.reset.isDefault')
                : t('admin.settings.reset.notDefault')
            }}
          </AdminChip>
          <button
            :id="`history-${setting.key}`"
            type="button"
            class="ml-auto"
            :class="buttonClass('ghost', 'sm')"
            @click="emit('history', setting.key)"
          >
            <History aria-hidden="true" class="size-4" :stroke-width="1.75" />
            {{ t('admin.settings.history')
            }}<span v-if="historySuffix(setting.key)" class="sr-only">{{
              historySuffix(setting.key)
            }}</span>
          </button>
        </div>
        <SettingField
          v-if="drafts[setting.key]"
          :setting="setting"
          :model-value="drafts[setting.key]!"
          @update:model-value="drafts[setting.key] = $event"
          @cleared="onCleared"
        />
      </div>
      <slot />
    </div>
    <div v-if="notice?.tone === 'refused'" role="alert" class="px-4 pb-3 sm:px-5">
      <AdminNotice tone="danger" :title="notice.text" />
    </div>
    <footer
      class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3 sm:px-5"
    >
      <p role="status" class="flex min-w-0 flex-1 basis-48 items-center gap-2 text-sm">
        <span
          v-if="dirtyCount > 0"
          aria-hidden="true"
          class="size-2 shrink-0 rounded-full bg-accent"
        />
        <span v-if="dirtyCount > 0" class="font-semibold">{{
          $t('admin.form.saveBar.unsaved', dirtyCount)
        }}</span>
        <template v-else-if="notice?.tone === 'done'">
          <CircleCheck
            aria-hidden="true"
            class="size-4 shrink-0 text-positive"
            :stroke-width="1.75"
          />
          <span>{{ notice.text }}</span>
        </template>
      </p>
      <div class="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          :class="buttonClass('ghost')"
          :aria-disabled="dirtyCount === 0 || isSaving || undefined"
          @click="discardEdits"
        >
          {{ t('admin.settings.discard') }}
        </button>
        <button
          type="button"
          :class="buttonClass('primary')"
          :aria-disabled="dirtyCount === 0 || undefined"
          :aria-busy="isSaving || undefined"
          @click="save"
        >
          {{ t('admin.settings.save') }}
        </button>
      </div>
    </footer>
  </section>
</template>
