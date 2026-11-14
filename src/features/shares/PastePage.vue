<script setup lang="ts">
import { ClipboardPaste } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CodeEditor from '@/components/CodeEditor.vue';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import Notice from '@/components/ui/Notice.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SelectField from '@/components/ui/SelectField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { useProfileQuery } from '@/features/account/profile.queries';
import LanguagePicker from '@/features/problems/LanguagePicker.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { normalizeNewlines } from '@/lib/source';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';
import { PASTE_MAX_BYTES } from '@/api/types/shares';
import type { ShareExpiry } from '@/api/types/shares';
import { clearDraft, loadDraft, saveDraft } from './paste-draft';
import { pasteSize, sizeText } from './paste-size';
import { PASTE_DEFAULT_EXPIRY, SHARE_EXPIRIES } from './share-expiry';
import { shareFailureOf } from './share-failure';
import { useCreatePasteShare } from './shares.queries';

/**
 * `/paste` ("Dán mã"): the editor first, then one row with language, title, expiry and the create button. A visitor sees a
 * sign-in notice above the editor and can type at once: the draft is kept in this browser (`paste-draft.ts`) across the
 * sign-in, and removed once the link exists. Creating lands on the new share's page.
 */
const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const isSignedIn = computed(() => session.status === 'authenticated');
const draft = loadDraft();
const source = ref(draft.source);
const title = ref(draft.title);
const expiry = ref<ShareExpiry>(draft.expiry ?? PASTE_DEFAULT_EXPIRY);
const pickedLanguageId = ref<string | null>(draft.languageId);

const meta = useProblemMetaQuery();
const { data: profile } = useProfileQuery();
const languages = computed(() => meta.data.value?.languages.filter((item) => !item.fileOnly) ?? []);
/** The pick, else the account's language, else the first text language. */
const language = computed(
  () =>
    languages.value.find((item) => item.id === pickedLanguageId.value) ??
    languages.value.find((item) => item.id === profile.value?.languageId) ??
    languages.value[0] ??
    null,
);

const size = computed(() => pasteSize(source.value));
const failureKey = ref<string | null>(null);
const create = useCreatePasteShare();
const blockedReason = computed(() => {
  if (!isSignedIn.value) return 'share.paste.signInFirst';
  if (size.value.isEmpty) return 'share.paste.empty';
  if (size.value.isTooLarge) return 'share.paste.tooLarge';
  return language.value ? null : 'share.paste.noLanguage';
});

/** Typing saves after a short pause, and leaving saves what is typed: a 64 KiB write per keystroke is not needed. */
const SAVE_DELAY_MS = 300;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
const saveNow = () =>
  saveDraft({
    source: source.value,
    title: title.value,
    languageId: language.value?.id ?? null,
    expiry: expiry.value,
  });
watch([source, title, expiry, pickedLanguageId], () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, SAVE_DELAY_MS);
});
onBeforeUnmount(() => {
  clearTimeout(saveTimer);
  if (!create.isSuccess.value) saveNow();
});

const canReadClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;
const clipboardDenied = ref(false);
async function pasteFromClipboard() {
  clipboardDenied.value = false;
  try {
    source.value = normalizeNewlines(await navigator.clipboard.readText());
  } catch {
    clipboardDenied.value = true;
  }
}

async function submit() {
  if (blockedReason.value || !language.value) return;
  failureKey.value = null;
  try {
    const share = await create.mutateAsync({
      languageId: language.value.id,
      source: source.value,
      expiry: expiry.value,
      ...(title.value.trim() ? { title: title.value.trim() } : {}),
    });
    clearDraft();
    await router.push({ name: 'share', params: { code: share.code } });
  } catch (error) {
    const failure = shareFailureOf(error);
    failureKey.value = failure.kind === 'other' ? failure.key : 'errors.generic';
  }
}
const loginTo = computed(() => ({
  name: 'login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
</script>

<template>
  <div class="page-column">
    <PageHeader :title="$t('share.paste.title')" :lead="$t('share.paste.lead')" />
    <Notice v-if="!isSignedIn" tone="info" data-testid="paste-sign-in">
      <strong>{{ $t('share.paste.signInTitle') }}</strong> {{ $t('share.paste.signInBody') }}
      <template #action>
        <AppButton size="sm" class="mt-2" :to="loginTo">{{ $t('account.login') }}</AppButton>
      </template>
    </Notice>
    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <CodeEditor
        v-model="source"
        :label="$t('share.paste.editor')"
        :language="language?.ace ?? null"
        :min-lines="16"
      />
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p
          class="m-0 text-meta tabular-nums"
          :class="size.isTooLarge ? 'text-negative' : 'text-muted'"
          data-testid="paste-size"
        >
          {{
            $t('share.paste.size', {
              size: sizeText(size.bytes),
              max: sizeText(PASTE_MAX_BYTES),
              lines: size.lines,
            })
          }}
        </p>
        <AppButton
          v-if="canReadClipboard"
          data-testid="paste-clipboard"
          @click="pasteFromClipboard"
        >
          <template #icon><ClipboardPaste aria-hidden="true" class="size-4" /></template>
          {{ $t('share.paste.fromClipboard') }}
        </AppButton>
      </div>
      <Notice v-if="clipboardDenied" tone="warning" inline>{{
        $t('share.paste.clipboardDenied')
      }}</Notice>
      <div class="flex flex-wrap items-end gap-x-4 gap-y-4">
        <FormField :label="$t('share.paste.language')">
          <LanguagePicker
            :languages="languages"
            :selected-id="language?.id ?? null"
            :selected="language"
            :is-sheet="false"
            @pick="pickedLanguageId = $event"
          />
        </FormField>
        <FormField :label="$t('share.paste.titleLabel')" optional class="min-w-48 flex-1">
          <TextInput
            v-model="title"
            maxlength="100"
            :placeholder="$t('share.paste.titlePlaceholder')"
          />
        </FormField>
        <FormField :label="$t('share.expiry.label')">
          <SelectField v-model="expiry">
            <option v-for="value in SHARE_EXPIRIES" :key="value" :value="value">
              {{ $t(`share.expiry.option.${value}`) }}
            </option>
          </SelectField>
        </FormField>
        <AppButton
          tone="primary"
          type="submit"
          class="max-sm:w-full"
          data-testid="paste-create"
          :loading="create.isPending.value"
          :disabled="blockedReason !== null"
          :disabled-reason="blockedReason ? $t(blockedReason) : undefined"
        >
          {{ $t('share.paste.create') }}
        </AppButton>
      </div>
      <Notice v-if="failureKey" tone="danger" inline>{{ $t(failureKey) }}</Notice>
    </form>
  </div>
</template>
