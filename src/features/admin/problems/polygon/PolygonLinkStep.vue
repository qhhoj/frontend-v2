<script setup lang="ts">
import { BadgeCheck, ChevronRight, LoaderCircle } from 'lucide-vue-next';
import { computed } from 'vue';
import Notice from '@/components/ui/Notice.vue';
import type { PolygonProblem } from '@/api/types/polygon';
import { translate } from '@/i18n';
import AdminChip from '../../ui/AdminChip.vue';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import PolygonLinkPreview from './PolygonLinkPreview.vue';
import PolygonLinkRefusal from './PolygonLinkRefusal.vue';
import PolygonMyImports from './PolygonMyImports.vue';
import PolygonSetterHowTo from './PolygonSetterHowTo.vue';
import { useLinkCheck } from './use-link-check';

/**
 * Step 1 (link option A): one field. Once the pasted text reads as a problem link the server checks it (the `p…` token
 * against the newest package) and the preview, its cautions or the refusal appear inline; "Tiếp tục" opens the options.
 * The how-to is open while the field starts empty; the viewer's recent imports sit under the card.
 */
const props = defineProps<{ accountName: string; initialLink: string }>();
const emit = defineEmits<{ resolved: [link: string, problem: PolygonProblem] }>();
/** A check this slow is downloading the package for the problem's first check. */
const SLOW_CHECK_SECONDS = 4;
const account = computed(() => props.accountName || translate('admin.polygonLink.howTo.unnamed'));
const {
  text,
  parts,
  address,
  preview,
  refusal,
  isChecking,
  elapsedSeconds,
  autoRecheckIn,
  checkAgain,
} = useLinkCheck(props.initialLink);
const isFromText = computed(
  () => refusal.value?.kind === 'invalid' || refusal.value?.kind === 'editing',
);
const isSlow = computed(() => isChecking.value && elapsedSeconds.value >= SLOW_CHECK_SECONDS);
const elapsed = computed(() => {
  const seconds = elapsedSeconds.value;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <details :open="initialLink === '' || undefined" :class="[CARD, 'group px-4 py-1 md:px-5']">
      <summary class="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-2 font-semibold">
        <ChevronRight
          aria-hidden="true"
          class="size-4 text-muted transition-transform group-open:rotate-90"
          :stroke-width="1.75"
        />
        {{ $t('admin.polygonLink.howTo.fold') }}
        <span class="text-meta font-normal text-muted">{{
          $t('admin.polygonLink.howTo.foldMeta')
        }}</span>
      </summary>
      <PolygonSetterHowTo :account-name="accountName" headless class="mb-4 pt-1" />
    </details>

    <div :class="[CARD, 'flex min-w-0 flex-col gap-4 p-4 md:p-5']">
      <div class="flex flex-col gap-1.5">
        <label for="polygon-link" class="font-semibold">{{
          $t('admin.polygonLink.link.label')
        }}</label>
        <p id="polygon-link-hint" class="text-sm text-muted">
          {{ $t('admin.polygonLink.link.hint', { account }) }}
        </p>
        <input
          id="polygon-link"
          v-model="text"
          type="url"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          maxlength="300"
          :placeholder="$t('admin.polygonLink.link.placeholder')"
          aria-describedby="polygon-link-hint polygon-link-parts"
          :aria-invalid="isFromText || undefined"
          :class="[INPUT, 'font-mono text-sm']"
        />
        <p
          id="polygon-link-parts"
          aria-live="polite"
          class="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted"
        >
          <template v-if="parts">
            <span
              >{{ $t('admin.polygonLink.link.token') }}
              <strong class="font-mono text-content">{{ parts.token }}</strong></span
            >
            <span aria-hidden="true">·</span>
            <span
              >{{ $t('admin.polygonLink.link.owner') }}
              <strong class="font-mono text-content break-all">{{ parts.owner }}</strong></span
            >
            <span aria-hidden="true">·</span>
            <span
              >{{ $t('admin.polygonLink.link.problem') }}
              <strong class="font-mono text-content break-all">{{ parts.name }}</strong></span
            >
            <span v-if="isChecking">{{ $t('admin.polygonLink.link.checking') }}</span>
            <AdminChip
              v-else-if="preview"
              tone="positive"
              :icon="BadgeCheck"
              data-testid="polygon-link-verified"
              >{{ $t('admin.polygonLink.link.verified') }}</AdminChip
            >
          </template>
        </p>
      </div>

      <Notice
        v-if="isSlow"
        compact
        :role="null"
        :title="$t('admin.polygonLink.link.slow.title')"
        data-testid="polygon-link-slow"
      >
        <p>{{ $t('admin.polygonLink.link.slow.body') }}</p>
        <p class="mt-1 flex items-center gap-1.5 text-muted">
          <LoaderCircle aria-hidden="true" class="size-4 animate-spin" :stroke-width="1.75" />
          {{ $t('admin.polygonLink.link.slow.elapsed', { time: elapsed }) }}
        </p>
      </Notice>
      <PolygonLinkRefusal
        v-else-if="refusal"
        :refusal="refusal"
        :account-name="account"
        :is-checking="isChecking"
        :from-text="isFromText"
        :auto-recheck-in="autoRecheckIn"
        @check-again="checkAgain"
      />
      <PolygonLinkPreview
        v-if="preview"
        :problem="preview"
        :is-checking="isChecking"
        @check-again="checkAgain"
      />

      <div class="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          :class="buttonClass('primary')"
          :aria-disabled="!preview || undefined"
          @click="preview && emit('resolved', address, preview)"
        >
          {{ $t('admin.polygonLink.link.next') }}
        </button>
      </div>
    </div>

    <PolygonMyImports />
  </div>
</template>
