<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import type { PolygonProblem } from '@/api/types/polygon';
import { formatDate } from '@/lib/format-date';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import PackageStatePill from './PackageStatePill.vue';
import { packageRevisionOf, previewCautionsOf } from './polygon-preview';
import type { PreviewCaution } from './polygon-preview';

/** The checked link's problem and the package an import takes, with what the setter should know about that package. */
const props = defineProps<{ problem: PolygonProblem; isChecking: boolean }>();
const emit = defineEmits<{ checkAgain: [] }>();
const locale = useLocaleStore();

const meta = computed(() => {
  const latest = props.problem.latestPackage;
  return translate('admin.polygonLink.link.previewMeta', {
    owner: props.problem.owner,
    id: latest.id ?? '-',
    revision: packageRevisionOf(props.problem),
    type: translate(`admin.polygonLink.packageType.short.${latest.type ?? 'full'}`),
    time: latest.createdAt ? formatDate(latest.createdAt, 'datetime', locale.locale) : '-',
  });
});
const cautions = computed(() => previewCautionsOf(props.problem));

function cautionBody(caution: PreviewCaution): string {
  const key = `admin.polygonLink.caution.${caution.kind}`;
  if (caution.kind === 'standard') return translate(`${key}.body`);
  const values = { package: caution.packageRevision };
  if (caution.kind === 'modified') return translate(`${key}.body`, values);
  return translate(caution.modified ? `${key}.bodyModified` : `${key}.body`, values);
}
const cautionTitle = (caution: PreviewCaution) =>
  translate(`admin.polygonLink.caution.${caution.kind}.title`, {
    package: caution.kind === 'standard' ? '' : caution.packageRevision,
    revision: caution.kind === 'stale' ? caution.revision : '',
  });
</script>

<template>
  <section
    data-testid="polygon-link-preview"
    class="flex flex-col gap-3 rounded-row border border-line bg-surface-strong p-4"
  >
    <div class="flex flex-wrap items-start justify-between gap-2">
      <h2 class="font-display text-title leading-7 font-bold break-words">
        {{ problem.title ?? problem.name }}
        <span class="font-mono text-sm font-normal text-muted"
          >{{ problem.name }} · #{{ problem.id }}</span
        >
      </h2>
      <PackageStatePill :state="problem.latestPackage.state" />
    </div>
    <p class="text-sm text-muted [overflow-wrap:anywhere]">
      {{ meta }} · {{ $t('admin.polygonLink.link.notLinked') }}
    </p>
    <Notice
      v-for="caution in cautions"
      :key="caution.kind"
      compact
      :role="null"
      :tone="caution.kind === 'standard' ? 'info' : 'warning'"
      :title="cautionTitle(caution)"
      :data-caution="caution.kind"
    >
      <p>{{ cautionBody(caution) }}</p>
      <template v-if="caution.kind !== 'standard'" #action>
        <div class="mt-2">
          <AppButton size="sm" :loading="isChecking" @click="emit('checkAgain')">
            {{ $t('admin.polygonLink.link.checkAgain') }}
          </AppButton>
        </div>
      </template>
    </Notice>
  </section>
</template>
