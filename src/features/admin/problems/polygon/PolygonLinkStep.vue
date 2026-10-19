<script setup lang="ts">
import { BadgeCheck } from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { ApiError } from '@/api/client';
import { resolvePolygonLink } from '@/api/polygon.api';
import type { PolygonProblem } from '@/api/types/polygon';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../../ui/AdminChip.vue';
import { CARD, INPUT, buttonClass } from '../../ui/controls';
import AdminNotice from '../../ui/feedback/AdminNotice.vue';
import PackageStatePill from './PackageStatePill.vue';
import PackageTypePill from './PackageTypePill.vue';
import PolygonLinkRefusal from './PolygonLinkRefusal.vue';
import PolygonSetterHowTo from './PolygonSetterHowTo.vue';
import { linkRefusalOf, parsePolygonLink } from './polygon-problem-link';
import type { LinkRefusal } from './polygon-problem-link';

/**
 * Step 1 (board W1): one field. Once the pasted text reads as a problem link the server checks it (the `p…` token
 * against the newest package) and the preview appears inline; "Tiếp tục" opens the options.
 */
const props = defineProps<{ accountName: string; initialLink: string }>();
const emit = defineEmits<{ resolved: [link: string, problem: PolygonProblem] }>();
const CHECK_DELAY_MS = 400;
const locale = useLocaleStore();
const account = computed(() => props.accountName || 'qhhoj');

const text = ref(props.initialLink);
const parts = computed(() => parsePolygonLink(text.value));
const isMalformed = computed(() => text.value.trim() !== '' && parts.value === null);

/** The last check sent: the link it was for and its answer; a newer check makes an older answer stale. */
const checked = ref<{ link: string; problem: PolygonProblem | null; refusal: LinkRefusal | null }>({
  link: '',
  problem: null,
  refusal: null,
});
const isChecking = ref(false);
let sequence = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

async function check(link: string) {
  const mine = (sequence += 1);
  isChecking.value = true;
  checked.value = { link, problem: null, refusal: null };
  try {
    const problem = await resolvePolygonLink(link);
    if (mine === sequence) checked.value = { link, problem, refusal: null };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (mine === sequence) checked.value = { link, problem: null, refusal: linkRefusalOf(error) };
  } finally {
    if (mine === sequence) isChecking.value = false;
  }
}

/** Each check counts against a per-user limit, so only a well-formed link that changed is sent, after a pause. */
watch(
  text,
  (value) => {
    clearTimeout(timer);
    const link = value.trim();
    if (!parts.value || link === checked.value.link) return;
    timer = setTimeout(() => void check(link), CHECK_DELAY_MS);
  },
  { immediate: true },
);
onBeforeUnmount(() => clearTimeout(timer));

const current = computed(() =>
  checked.value.link === text.value.trim() && !isChecking.value ? checked.value : null,
);
const preview = computed(() => current.value?.problem ?? null);
const refusal = computed<LinkRefusal | null>(() =>
  isMalformed.value ? { kind: 'invalid' } : (current.value?.refusal ?? null),
);
const builtAt = computed(() =>
  preview.value?.latestPackage.createdAt
    ? formatDate(preview.value.latestPackage.createdAt, 'datetime', locale.locale)
    : '-',
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <AdminNotice :title="$t('admin.polygonLink.howTo.title')">
      <PolygonSetterHowTo :account-name="accountName" headless />
    </AdminNotice>
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
          :aria-invalid="isMalformed || undefined"
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
              <strong class="font-mono text-content">{{ parts.owner }}</strong></span
            >
            <span aria-hidden="true">·</span>
            <span
              >{{ $t('admin.polygonLink.link.problem') }}
              <strong class="font-mono text-content">{{ parts.name }}</strong></span
            >
            <span v-if="isChecking">{{ $t('admin.polygonLink.link.checking') }}</span>
            <template v-else-if="preview">
              <span class="font-mono">→ #{{ preview.id }}</span>
              <AdminChip tone="positive" :icon="BadgeCheck" data-testid="polygon-link-verified">{{
                $t('admin.polygonLink.link.verified')
              }}</AdminChip>
            </template>
          </template>
        </p>
      </div>

      <PolygonLinkRefusal
        v-if="refusal"
        :refusal="refusal"
        :account-name="account"
        :is-checking="isChecking"
        @check-again="check(text.trim())"
      />

      <section
        v-if="preview"
        data-testid="polygon-link-preview"
        class="flex flex-col gap-2 rounded-row border border-line bg-surface-strong p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <h2 class="font-display text-subtitle leading-7 font-bold break-words">
            {{ preview.title ?? preview.name }}
            <span class="font-mono text-sm font-normal text-muted"
              >{{ preview.name }} · #{{ preview.id }}</span
            >
          </h2>
          <PackageStatePill state="READY" />
        </div>
        <p class="flex flex-wrap gap-x-2 text-sm text-muted">
          <span
            >{{ $t('admin.polygonLink.source.owner') }}
            <strong class="font-mono text-content">{{ preview.owner }}</strong></span
          >
          <span aria-hidden="true">·</span>
          <span>{{
            $t('admin.polygonLink.link.packageValue', {
              revision: preview.latestPackage.revision ?? preview.revision,
              id: preview.latestPackage.id ?? '-',
              time: builtAt,
            })
          }}</span>
          <PackageTypePill :type="preview.latestPackage.type" />
        </p>
        <p class="text-sm text-muted">{{ $t('admin.polygonLink.link.notLinked') }}</p>
      </section>

      <div class="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          :class="buttonClass('primary')"
          :aria-disabled="!preview || undefined"
          @click="preview && emit('resolved', text.trim(), preview)"
        >
          {{ $t('admin.polygonLink.link.next') }}
        </button>
      </div>
    </div>
  </div>
</template>
