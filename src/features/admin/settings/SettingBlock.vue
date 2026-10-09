<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { updateSetting } from '@/api/settings-admin.api';
import type { Setting, SettingKey } from '@/api/types/settings-admin';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../ui/classes';
import { failureTextOf, fieldErrorsOf } from '../ui/admin-errors';
import SettingField from './SettingField.vue';
import type { ShownBlock } from './setting-blocks';
import { checkBlock, sendKeysInOrder } from './setting-save';
import type { Drafts } from './setting-save';
import { draftOf } from './setting-values';
import { useStoreSettingAnswer } from './settings.queries';

/**
 * One titled block of keys with one "Lưu". Each key keeps its own draft; a key's draft is rebuilt only when the stored
 * value of that key changes, so an unsaved edit of another key of the block is never lost.
 */
const props = defineProps<{ block: ShownBlock }>();
const emit = defineEmits<{ history: [key: SettingKey] }>();
const { t } = useI18n();
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

function discardEdits() {
  for (const setting of props.block.settings) drafts[setting.key] = draftOf(setting);
  notice.value = null;
}

function showRefusal(key: SettingKey, message: string) {
  notice.value = { tone: 'refused', text: t('admin.settings.saveFailed', { key, message }) };
}

/** The block's answer to a refused key: the field's text when the server named one, else the page line of the failure. */
function refusalMessage(error: unknown): string {
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
  if ('failedKey' in outcome) return showRefusal(outcome.failedKey, refusalMessage(outcome.error));
  notice.value =
    outcome.saved.length > 0
      ? { tone: 'done', text: t('admin.settings.saved') }
      : { tone: 'done', text: t('admin.settings.noChanges') };
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
  notice.value = {
    tone: 'done',
    text: t('admin.settings.clear.done', { name: t(`admin.settings.clear.names.${answer.key}`) }),
  };
}

function historyLabel(key: SettingKey): string {
  return props.block.keys.length > 1
    ? t('admin.settings.historyWithKey', { key })
    : t('admin.settings.history');
}
</script>

<template>
  <div :data-block="block.id">
    <SettingsCard
      :title="$t(`admin.settings.blocks.${block.id}.title`)"
      :lead="$t(`admin.settings.blocks.${block.id}.help`)"
    >
      <div
        v-for="setting in block.settings"
        :key="setting.key"
        :data-key="setting.key"
        class="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0"
      >
        <div class="flex flex-wrap items-center gap-2">
          <code class="font-mono text-xs text-muted">{{ setting.key }}</code>
          <span
            data-testid="default-chip"
            class="rounded-pill px-2 text-xs"
            :class="
              setting.isDefault
                ? 'border border-line text-muted'
                : 'bg-accent-soft text-accent-soft-text'
            "
          >
            {{
              setting.isDefault
                ? t('admin.settings.reset.isDefault')
                : t('admin.settings.reset.notDefault')
            }}
          </span>
          <button
            :id="`history-${setting.key}`"
            type="button"
            class="ml-auto"
            :class="ADMIN_BUTTON_CLASS"
            @click="emit('history', setting.key)"
          >
            {{ historyLabel(setting.key) }}
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
      <AdminStatus
        v-if="notice"
        :kind="notice.tone === 'done' ? 'done' : 'refused'"
        :text="notice.text"
      />
      <div class="flex flex-wrap justify-end gap-2">
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="discardEdits">
          {{ t('admin.settings.discard') }}
        </button>
        <button
          type="button"
          :class="ADMIN_PRIMARY_CLASS"
          :aria-busy="isSaving || undefined"
          @click="save"
        >
          {{ t('admin.settings.save') }}
        </button>
      </div>
    </SettingsCard>
  </div>
</template>
