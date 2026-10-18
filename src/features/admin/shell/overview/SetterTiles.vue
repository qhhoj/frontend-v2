<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';
import { adminRouteName } from '../../admin-screens';
import { useEditableProblemCounts } from './admin-overview.queries';
import OverviewTile from './OverviewTile.vue';

/** The problem setter's figures (P-33): the problems they may edit, not yet public and public, each opening that list. */
const counts = useEditableProblemCounts();
</script>

<template>
  <OverviewTile
    :icon="EyeOff"
    :label="$t('admin.shell.overview.unpublished')"
    :value="counts.unpublished.value"
    :detail="$t('admin.shell.overview.unpublishedDetail')"
    :to="{ name: adminRouteName('problems'), query: { status: 'private' } }"
    :link-text="$t('admin.shell.overview.links.problems', counts.unpublished.value ?? 0)"
  />
  <OverviewTile
    :icon="Eye"
    :label="$t('admin.shell.overview.published')"
    :value="counts.published.value"
    :detail="$t('admin.shell.overview.publishedDetail')"
    :to="{ name: adminRouteName('problems'), query: { status: 'public' } }"
    :link-text="$t('admin.shell.overview.links.problems', counts.published.value ?? 0)"
  />
</template>
