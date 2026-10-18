<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';
import { adminRouteName } from '../../admin-screens';
import { useEditableProblemCounts } from './admin-overview.queries';
import OverviewTile from './OverviewTile.vue';

/** The problem setter's figures (P-33): the problems they may edit, not yet public and public, each opening that list. */
const counts = useEditableProblemCounts();
/** The plural of the link line needs a number; a failed or loading count shows the tile's generic line anyway. */
const numberOf = (value: number | string | null) => (typeof value === 'number' ? value : 0);
</script>

<template>
  <OverviewTile
    :icon="EyeOff"
    :label="$t('admin.shell.overview.unpublished')"
    :value="counts.unpublished.value"
    :detail="$t('admin.shell.overview.unpublishedDetail')"
    :to="{ name: adminRouteName('problems'), query: { status: 'private' } }"
    :link-text="$t('admin.shell.overview.links.problems', numberOf(counts.unpublished.value))"
  />
  <OverviewTile
    :icon="Eye"
    :label="$t('admin.shell.overview.published')"
    :value="counts.published.value"
    :detail="$t('admin.shell.overview.publishedDetail')"
    :to="{ name: adminRouteName('problems'), query: { status: 'public' } }"
    :link-text="$t('admin.shell.overview.links.problems', numberOf(counts.published.value))"
  />
</template>
