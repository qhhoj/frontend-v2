<script setup lang="ts">
import CopyButton from '@/components/CopyButton.vue';

/** What a problem setter does on Polygon so a problem shows up here; shared by the settings block and the empty list. */
defineProps<{ accountName: string }>();
const STEPS = ['open', 'access', 'package', 'import'] as const;
</script>

<template>
  <div class="flex flex-col gap-3 rounded-row bg-surface-strong p-4">
    <h3 class="font-semibold">{{ $t('admin.polygonLink.howTo.title') }}</h3>
    <ol class="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
      <li v-for="step in STEPS" :key="step">
        <i18n-t :keypath="`admin.polygonLink.howTo.steps.${step}`" tag="span">
          <template #account>
            <code class="font-mono font-semibold">{{
              accountName || $t('admin.polygonLink.howTo.unnamed')
            }}</code>
          </template>
        </i18n-t>
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
