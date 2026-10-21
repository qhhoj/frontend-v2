<script setup lang="ts">
import CopyButton from '@/components/CopyButton.vue';

/**
 * What a problem setter does: share the problem with the account, build a package, paste its link; shared by the settings
 * block and the link step (`headless` there: the fold around it carries the title).
 */
defineProps<{ accountName: string; headless?: boolean }>();
const STEPS = ['access', 'package', 'paste'] as const;
</script>

<template>
  <div class="flex flex-col gap-3" :class="!headless && 'rounded-row bg-surface-strong p-4'">
    <h3 v-if="!headless" class="font-semibold">{{ $t('admin.polygonLink.howTo.title') }}</h3>
    <ol class="flex flex-col gap-3 text-sm [overflow-wrap:anywhere]">
      <li v-for="(step, index) in STEPS" :key="step" class="flex items-start gap-3">
        <span
          aria-hidden="true"
          class="flex size-6 shrink-0 items-center justify-center rounded-pill bg-accent-soft font-mono text-caption font-semibold text-accent-soft-text"
          >{{ index + 1 }}</span
        >
        <div class="flex min-w-0 flex-col gap-0.5">
          <span class="font-semibold">{{ $t(`admin.polygonLink.howTo.steps.${step}.title`) }}</span>
          <i18n-t :keypath="`admin.polygonLink.howTo.steps.${step}.body`" tag="span">
            <template #account>
              <code class="font-mono font-semibold">{{
                accountName || $t('admin.polygonLink.howTo.unnamed')
              }}</code>
            </template>
            <template #shape>
              <code class="rounded-cell bg-surface-strong px-1 font-mono">{{
                $t('admin.polygonLink.howTo.shape')
              }}</code>
            </template>
          </i18n-t>
          <span v-if="step === 'paste'" class="text-muted">{{
            $t('admin.polygonLink.howTo.inPackage')
          }}</span>
        </div>
      </li>
    </ol>
    <p class="text-sm text-muted">{{ $t('admin.polygonLink.howTo.readIsEnough') }}</p>
    <CopyButton
      v-if="accountName"
      :text="accountName"
      :label="$t('admin.polygonLink.howTo.copy', { account: accountName })"
    />
  </div>
</template>
