<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Readout from '@/components/ui/Readout.vue';
import ReadoutCell from '@/components/ui/ReadoutCell.vue';
</script>

<template>
  <!-- Mirrors `SubmissionPlate.vue`: the plate, its grid and its first readings. -->
  <Readout aria-hidden="true">
    <div class="flex flex-wrap items-start gap-x-6 gap-y-4">
      <ReadoutCell
        label=""
        size="word"
        class="flex-1 basis-64 max-sm:basis-full"
        data-skeleton-region="line"
      >
        <SkeletonBlock text class="w-48" />
      </ReadoutCell>
      <ReadoutCell
        label=""
        size="big"
        class="shrink-0 max-sm:basis-full"
        data-skeleton-region="score"
      >
        <SkeletonBlock text class="w-24" />
      </ReadoutCell>
      <ReadoutCell label="" class="w-36 shrink-0" data-skeleton-region="facts">
        <SkeletonBlock text class="w-16" />
      </ReadoutCell>
    </div>
  </Readout>
</template>
