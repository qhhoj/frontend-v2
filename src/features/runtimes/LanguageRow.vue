<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next';
import { computed } from 'vue';
import type { RuntimeJudge, RuntimeLanguage } from '@/api/types/runtimes';
import { commonCompiler, commonVersion, mismatchedJudges } from './runtimes-model';

/** One language: a summary line that opens in place to the extension and the version on every judge. */
const props = defineProps<{
  language: RuntimeLanguage;
  judges: RuntimeJudge[];
  isOpen: boolean;
}>();
defineEmits<{ toggle: [] }>();
const common = computed(() => commonVersion(props.language, props.judges));
const odd = computed(() => new Set(mismatchedJudges(props.language, props.judges)));
const compiler = computed(() => commonCompiler(props.language, props.judges));
const versionOf = (judge: string) =>
  props.language.versions.find((entry) => entry.judge === judge)?.version ?? null;
const detailId = computed(() => `language-${props.language.key}`);
const CHIP = 'rounded-pill px-2.5 py-0.5 font-mono text-xs font-semibold';
</script>

<template>
  <li :data-testid="`language-${language.key}`" class="border-t border-line first:border-t-0">
    <button
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="detailId"
      class="flex min-h-14 w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-left hover:bg-surface-hover sm:px-6"
      :class="{ 'bg-surface-strong': isOpen }"
      @click="$emit('toggle')"
    >
      <span class="min-w-32 flex-1">
        <b>{{ language.name }}</b>
        <span class="block text-xs text-muted"
          >{{ compiler ?? $t('runtimes.noJudge') }}
          <span v-if="common" class="font-mono">{{ common }}</span></span
        >
      </span>
      <span
        v-if="odd.size"
        class="rounded-pill bg-tag-4-bg px-2.5 py-0.5 text-xs font-semibold text-tag-4"
        >{{ $t('runtimes.mismatch', { count: odd.size }) }}</span
      >
      <span class="font-mono text-sm text-muted">.{{ language.extension }}</span>
      <component :is="isOpen ? ChevronDown : ChevronRight" aria-hidden="true" class="size-4" />
    </button>
    <div
      v-if="isOpen"
      :id="detailId"
      class="flex flex-col gap-3 bg-surface-strong px-4 pb-4 sm:px-6"
    >
      <p class="text-sm text-muted">
        {{ $t('runtimes.extension') }}
        <span :class="[CHIP, 'bg-accent-soft text-accent-soft-text']"
          >.{{ language.extension }}</span
        >
        <span v-if="language.fileOnly" class="ml-2">{{ $t('submit.fileOnly') }}</span>
      </p>
      <h4 class="text-xs font-semibold text-muted uppercase">{{ $t('runtimes.perJudge') }}</h4>
      <ul class="flex flex-col gap-1">
        <li v-for="judge in judges" :key="judge.name" class="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            class="size-2 rounded-full"
            :class="judge.online ? 'bg-verdict-ac' : 'bg-line-strong'"
          />
          <span class="flex-1">{{ judge.name }}</span>
          <span
            v-if="versionOf(judge.name)"
            :class="[
              CHIP,
              odd.has(judge.name) ? 'bg-tag-4-bg text-tag-4' : 'bg-surface text-muted',
            ]"
            >{{ versionOf(judge.name) }}</span
          >
          <span v-else class="text-xs text-muted">{{ $t('runtimes.notInstalled') }}</span>
        </li>
      </ul>
    </div>
  </li>
</template>
